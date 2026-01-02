'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { BagsAPI } from '../lib/bagsApi'
import { isValidSolDomain } from '../lib/sns'
import { useMerchantResolution } from '../lib/hooks/useMerchantResolution'
import { useBagsQuote } from '../lib/hooks/useBagsQuote'
import type { BagsPayWidgetProps, BagsToken, PaymentRequest } from '../lib/types'

// USDC and SOL token addresses
const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

type WidgetState = 'idle' | 'quoting' | 'confirm' | 'processing' | 'success' | 'error'

export default function CheckoutWidget({
  merchant,
  amount,
  currency = 'USDC',
  theme = 'light',
  orderId,
  onSuccess,
  onError,
}: BagsPayWidgetProps) {
  const { publicKey, sendTransaction, connected } = useWallet()
  const { connection } = useConnection()
  const [state, setState] = useState<WidgetState>('idle')
  const [selectedToken, setSelectedToken] = useState<BagsToken | null>(null)
  const [tokens, setTokens] = useState<BagsToken[]>([])
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [bagsAPI] = useState(() => new BagsAPI())
  
  // Track merchant identity (resolved address) and network for initialization
  // This is used to determine when to re-initialize vs just refresh quote
  const [merchantIdentity, setMerchantIdentity] = useState<string | null>(null)
  const [networkId, setNetworkId] = useState<string | null>(null)

  // Use merchant resolution hook
  const {
    resolvedAddress: merchantAddress,
    isResolving: isResolvingMerchant,
    error: merchantError,
    retry: retryMerchant,
  } = useMerchantResolution(merchant, connection)

  // Use quote hook
  const {
    tokenAmount,
    isLoading: isQuoteLoading,
    error: quoteError,
    refresh: refreshQuote,
  } = useBagsQuote({
    amount,
    token: selectedToken,
    currency,
    merchantAddress,
    bagsAPI,
  })

  // Get network for explorer link
  const getExplorerUrl = (signature: string) => {
    const network = connection.rpcEndpoint.includes('mainnet') ? 'mainnet' : 'devnet'
    return `https://solscan.io/tx/${signature}?cluster=${network}`
  }

  // Get current network identifier
  const currentNetworkId = connection.rpcEndpoint.includes('mainnet') ? 'mainnet' : 'devnet'
  const currentMerchantIdentity = merchantAddress?.toString() || null

  /**
   * INITIALIZATION EFFECT
   * 
   * This effect runs ONLY when merchant identity or network changes.
   * It handles:
   * - Loading tokens list
   * - Resetting widget state for new merchant/network
   * - Setting initial selected token (only if not already selected)
   * 
   * Dependencies: merchantIdentity, networkId
   * Does NOT depend on: amount, currency, theme
   */
  useEffect(() => {
    // Check if merchant identity or network changed
    const merchantChanged = currentMerchantIdentity !== merchantIdentity
    const networkChanged = currentNetworkId !== networkId

    if (merchantChanged || networkChanged) {
      // Update tracked identity/network
      setMerchantIdentity(currentMerchantIdentity)
      setNetworkId(currentNetworkId)

      // Reset state for new merchant/network
      if (merchantChanged) {
        setState('idle')
        setSelectedToken(null)
        setTokens([])
        setErrorMessage(null)
      }

      // Load tokens when merchant is resolved
      if (currentMerchantIdentity) {
        const loadTokens = async () => {
          try {
            const availableTokens = await bagsAPI.getTokens()
            
            // Filter or prioritize based on currency preference (for display only, doesn't trigger reload)
            let filteredTokens = availableTokens
            if (currency === 'USDC') {
              const usdcToken = availableTokens.find(t => 
                t.address === USDC_MINT.toString() || 
                t.symbol === 'USDC' || 
                t.symbol === 'USD'
              )
              if (usdcToken) {
                filteredTokens = [usdcToken, ...availableTokens.filter(t => t.address !== usdcToken.address)]
              }
            } else if (currency === 'SOL') {
              const solToken = availableTokens.find(t => 
                t.address === SOL_MINT.toString() || 
                t.symbol === 'SOL'
              )
              if (solToken) {
                filteredTokens = [solToken, ...availableTokens.filter(t => t.address !== solToken.address)]
              }
            }

            setTokens(filteredTokens)
            // Only set selected token if not already set (preserve user selection)
            if (filteredTokens.length > 0 && !selectedToken) {
              setSelectedToken(filteredTokens[0])
            }
          } catch (error) {
            console.error('Failed to load tokens:', error)
            setState('error')
            setErrorMessage('Failed to load tokens')
            onError?.(error as Error)
          }
        }
        
        loadTokens()
      }
    }
  }, [currentMerchantIdentity, merchantIdentity, currentNetworkId, networkId, bagsAPI, currency, selectedToken, onError])

  /**
   * CURRENCY-BASED TOKEN ORDERING EFFECT
   * 
   * Reorders tokens based on currency preference without reloading.
   * Preserves selected token if it still exists in the list.
   * 
   * Dependencies: currency (only runs when currency changes)
   * Does NOT reload tokens or reset selectedToken.
   * Uses functional updates to avoid dependency on tokens array.
   */
  useEffect(() => {
    setTokens((currentTokens) => {
      if (currentTokens.length === 0) return currentTokens

      // Reorder tokens based on currency preference
      let reorderedTokens = [...currentTokens]
      if (currency === 'USDC') {
        const usdcToken = currentTokens.find(t => 
          t.address === USDC_MINT.toString() || 
          t.symbol === 'USDC' || 
          t.symbol === 'USD'
        )
        if (usdcToken) {
          reorderedTokens = [usdcToken, ...currentTokens.filter(t => t.address !== usdcToken.address)]
        }
      } else if (currency === 'SOL') {
        const solToken = currentTokens.find(t => 
          t.address === SOL_MINT.toString() || 
          t.symbol === 'SOL'
        )
        if (solToken) {
          reorderedTokens = [solToken, ...currentTokens.filter(t => t.address !== solToken.address)]
        }
      }

      // Only update if order actually changed
      const orderChanged = reorderedTokens.some((token, index) => 
        currentTokens[index]?.address !== token.address
      )
      
      if (orderChanged) {
        // Preserve selected token if it still exists
        setSelectedToken((currentSelected) => {
          if (currentSelected && !reorderedTokens.find(t => t.address === currentSelected.address)) {
            // Selected token no longer in list, keep first token selected
            if (reorderedTokens.length > 0) {
              return reorderedTokens[0]
            }
          }
          return currentSelected
        })
        return reorderedTokens
      }
      
      return currentTokens
    })
  }, [currency]) // Only depend on currency

  /**
   * QUOTE REFRESH EFFECT
   * 
   * This effect handles quote updates when amount/currency/token changes.
   * It does NOT reset widget state or clear selected token.
   * 
   * Dependencies: amount, currency, selectedToken, merchantAddress
   * The actual quote fetching is handled by useBagsQuote hook with debouncing.
   */
  // Quote refresh is handled by useBagsQuote hook - no additional effect needed

  /**
   * STATE UPDATE EFFECT
   * 
   * Updates widget state based on merchant resolution and quote status.
   * This is separate from initialization to allow smooth quote updates.
   * When quote is loading, preserve current state instead of switching to 'quoting'.
   */
  useEffect(() => {
    if (merchantError) {
      setState('error')
      setErrorMessage(merchantError)
      onError?.(new Error(merchantError))
    } else if (quoteError) {
      // Quote errors should not set global error state, just show in UI
      // Only set error state if we don't have a valid quote and can't proceed
      if (!merchantAddress) {
        setState('error')
        setErrorMessage(quoteError)
        onError?.(new Error(quoteError))
      }
    } else if (isResolvingMerchant) {
      setState('idle')
      setErrorMessage(null)
    } else if (merchantAddress && isQuoteLoading) {
      // Don't change state when quote is loading - preserve current state for smooth updates
      // Only set to 'quoting' if we're in initial state (no tokenAmount yet)
      if (tokenAmount === 0 && state === 'idle') {
        setState('quoting')
      }
      setErrorMessage(null)
    } else if (merchantAddress && tokenAmount > 0 && !isQuoteLoading && connected && publicKey) {
      setState('confirm')
      setErrorMessage(null)
    } else if (merchantAddress && !isQuoteLoading) {
      // Only set to idle if we don't have a valid quote and aren't already in a terminal state
      if (state !== 'success' && state !== 'error' && state !== 'processing') {
        setState('idle')
      }
      setErrorMessage(null)
    }
  }, [merchantError, quoteError, isResolvingMerchant, merchantAddress, isQuoteLoading, tokenAmount, connected, publicKey, onError, state])


  const handlePayment = async () => {
    if (!publicKey || !selectedToken || !merchantAddress) {
      setState('error')
      setErrorMessage('Wallet not connected or missing payment details')
      return
    }

    setState('processing')
    setErrorMessage(null)

    try {
      // Create payment request
      const paymentRequest: PaymentRequest = {
        amount,
        currency,
        merchantId: merchantAddress.toString(),
        orderId,
      }

      const paymentResponse = await bagsAPI.createPaymentRequest(paymentRequest)

      // Calculate lamports
      const lamports = Math.floor(tokenAmount * Math.pow(10, selectedToken.decimals))

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: merchantAddress,
          lamports,
        })
      )

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Send transaction
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
      })

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      }, 'confirmed')

      // Verify payment
      const verified = await bagsAPI.verifyPayment(paymentResponse.paymentId, signature)
      
      if (verified || signature) {
        setTxSignature(signature)
        setState('success')
        onSuccess?.(signature)
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      setState('error')
      const errorMsg = error instanceof Error ? error.message : 'Payment failed'
      setErrorMessage(errorMsg)
      onError?.(error instanceof Error ? error : new Error(errorMsg))
    }
  }

  const reset = () => {
    setState('idle')
    setTxSignature(null)
    setErrorMessage(null)
    if (merchantError) {
      retryMerchant()
    } else if (quoteError) {
      refreshQuote()
    }
  }

  const isDark = theme === 'dark'
  const bgColor = isDark ? 'bg-gray-800' : 'bg-white'
  const textColor = isDark ? 'text-gray-100' : 'text-gray-900'
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-600'
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-200'
  const inputBg = isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
  const cardBg = isDark ? 'bg-gray-700/50' : 'bg-gradient-to-br from-indigo-50 to-purple-50'
  const shadowClass = isDark ? 'shadow-2xl shadow-gray-900/50' : 'shadow-2xl'

  // Error state
  if (state === 'error') {
    return (
      <div className={`${bgColor} ${shadowClass} rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className={`text-xl font-bold ${textColor} mb-2`}>Error</h3>
            <p className={textSecondary}>{errorMessage || merchantError || quoteError || 'An error occurred'}</p>
          </div>
          <button
            onClick={reset}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (state === 'success' && txSignature) {
    return (
      <div className={`${bgColor} ${shadowClass} rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${textColor} mb-2`}>Payment Successful!</h3>
            <p className={textSecondary}>Transaction confirmed on Solana</p>
          </div>
          <div className={`${cardBg} rounded-xl p-4 border ${borderColor}`}>
            <p className={`text-xs ${textSecondary} mb-2`}>Transaction Signature</p>
            <p className={`font-mono text-sm ${textColor} break-all mb-4`}>
              {txSignature}
            </p>
            <a
              href={getExplorerUrl(txSignature)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              <span>View on Solscan</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Loading/Resolving state - only show full loading for initial merchant resolution
  // Don't show full loading for quote updates - let the widget stay visible
  if (isResolvingMerchant || !merchantAddress) {
    return (
      <div className={`${bgColor} ${shadowClass} rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={textSecondary}>
            Resolving merchant address...
          </p>
        </div>
      </div>
    )
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div className={`${bgColor} ${shadowClass} rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <div>
            <h3 className={`text-xl font-bold ${textColor} mb-2`}>Processing Payment</h3>
            <p className={textSecondary}>Please wait while we confirm your transaction...</p>
          </div>
        </div>
      </div>
    )
  }

  // Main widget UI (idle/confirm states)
  return (
    <div className={`${bgColor} ${shadowClass} rounded-2xl p-8 max-w-md mx-auto border ${borderColor} transition-all duration-300`}>
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${textColor} mb-2`}>BagsPay Checkout</h2>
          <p className={`text-sm ${textSecondary}`}>Secure payment with Bags memecoin</p>
        </div>

        <div className={`border-t ${borderColor} pt-6`}>
          <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl">
            <span className={`font-medium ${textSecondary}`}>Amount:</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {currency === 'USDC' ? '$' : ''}{amount.toFixed(2)} {currency}
            </span>
          </div>

          {merchant && (
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Merchant: {isValidSolDomain(merchant) ? merchant : `${merchant.substring(0, 8)}...${merchant.substring(merchant.length - 8)}`}
                </span>
              </div>
            </div>
          )}

          {!connected ? (
            <div className="space-y-4">
              <p className={`text-center text-sm ${textSecondary} mb-2`}>Connect your wallet to continue</p>
              <div className="transform hover:scale-105 transition-transform duration-200">
                <WalletMultiButton className="w-full !bg-gradient-to-r !from-indigo-600 !to-purple-600 hover:!from-indigo-700 hover:!to-purple-700 !rounded-xl !h-12 !font-semibold !shadow-lg" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(state === 'confirm' || isQuoteLoading) && (tokenAmount > 0 || isQuoteLoading) && (
                <div className={`${cardBg} rounded-xl p-4 border-2 ${borderColor} shadow-sm mb-4`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${textSecondary}`}>You&apos;ll pay:</span>
                    <div className="flex items-center space-x-2">
                      {isQuoteLoading && tokenAmount === 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          <span className={`text-sm ${textSecondary}`}>Calculating...</span>
                        </div>
                      ) : (
                        <>
                          <span className={`text-xl font-bold ${textColor} ${isQuoteLoading ? 'opacity-60' : ''}`}>
                            {tokenAmount.toFixed(6)} <span className="text-indigo-600 dark:text-indigo-400">{selectedToken?.symbol}</span>
                          </span>
                          {isQuoteLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-sm font-semibold ${textColor} mb-3`}>
                  Select Token
                </label>
                <select
                  value={selectedToken?.address || ''}
                  onChange={(e) => {
                    const token = tokens.find(t => t.address === e.target.value)
                    setSelectedToken(token || null)
                    // Quote will be fetched automatically via useBagsQuote hook
                  }}
                  className={`w-full px-4 py-3 ${inputBg} ${textColor} rounded-xl border-2 ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium cursor-pointer`}
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>

              {quoteError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{quoteError}</p>
                  <button
                    onClick={refreshQuote}
                    className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
                  >
                    Retry quote
                  </button>
                </div>
              )}

              {state === 'confirm' && (
                <button
                  onClick={handlePayment}
                  disabled={!selectedToken || isQuoteLoading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isQuoteLoading ? 'Updating quote...' : 'Confirm Payment'}
                  </span>
                </button>
              )}

              <div className="text-center pt-2">
                <WalletMultiButton className="!bg-gray-100 hover:!bg-gray-200 !text-gray-900 !rounded-lg" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
