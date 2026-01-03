'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { BagsAPI, type BagsToken, type PaymentRequest } from '@/lib/bags-api'

interface CheckoutWidgetProps {
  amount: number
  merchantId: string
  orderId?: string
  onSuccess?: (signature: string) => void
  onError?: (error: Error) => void
  className?: string
}

export default function CheckoutWidget({
  amount,
  merchantId,
  orderId,
  onSuccess,
  onError,
  className = '',
}: CheckoutWidgetProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [selectedToken, setSelectedToken] = useState<BagsToken | null>(null)
  const [tokens, setTokens] = useState<BagsToken[]>([])
  const [tokenAmount, setTokenAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isQuoteLoading, setIsQuoteLoading] = useState(false)

  // Prevent stale async updates when amount changes quickly
  const quoteReqIdRef = useRef(0)
  const quoteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [bagsAPI] = useState(() => new BagsAPI())

  const loadTokens = useCallback(async () => {
    try {
      setIsLoading(true)
      const availableTokens = await bagsAPI.getTokens()
      setTokens(availableTokens)
      if (availableTokens.length > 0) {
        setSelectedToken(availableTokens[0])
      }
    } catch (error) {
      console.error('Failed to load tokens:', error)
      onError?.(error as Error)
    } finally {
      setIsLoading(false)
    }
  }, [bagsAPI, onError])

  useEffect(() => {
    loadTokens()
  }, [loadTokens])

  const calculateTokenAmount = useCallback(async () => {
    if (!selectedToken) return

    const reqId = ++quoteReqIdRef.current
    setIsQuoteLoading(true)

    try {
      const price = await bagsAPI.getTokenPrice(selectedToken.address)

      // Ignore stale responses
      if (reqId !== quoteReqIdRef.current) return

      if (price > 0) {
        setTokenAmount(amount / price)
      } else {
        setTokenAmount(amount / 0.01) // fallback
      }
    } catch (error) {
      // Ignore stale responses
      if (reqId !== quoteReqIdRef.current) return

      console.error('Failed to calculate token amount:', error)
      setTokenAmount(amount / 0.01)
    } finally {
      // Ignore stale responses
      if (reqId !== quoteReqIdRef.current) return
      setIsQuoteLoading(false)
    }
  }, [selectedToken, amount, bagsAPI])

  useEffect(() => {
    if (!selectedToken || amount <= 0) return

    // debounce: don't spam API while merchant is typing
    if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current)

    quoteDebounceRef.current = setTimeout(() => {
      calculateTokenAmount()
    }, 300)

    return () => {
      if (quoteDebounceRef.current) clearTimeout(quoteDebounceRef.current)
    }
  }, [selectedToken, amount, calculateTokenAmount])

  const handlePayment = async () => {
    if (!publicKey || !selectedToken) {
      onError?.(new Error('Wallet not connected or token not selected'))
      return
    }

    try {
      setIsProcessing(true)

      // Create payment request
      const paymentRequest: PaymentRequest = {
        amount,
        merchantId,
        orderId,
      }

      const paymentResponse = await bagsAPI.createPaymentRequest(paymentRequest)

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(paymentResponse.recipientAddress),
          lamports: Math.floor(tokenAmount * Math.pow(10, selectedToken.decimals)),
        })
      )

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = publicKey

      // Send transaction
      const signature = await sendTransaction(transaction, connection)

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')

      // Verify payment
      const verified = await bagsAPI.verifyPayment(paymentResponse.paymentId, signature)
      
      if (verified) {
        onSuccess?.(signature)
      } else {
        throw new Error('Payment verification failed')
      }
    } catch (error) {
      console.error('Payment failed:', error)
      onError?.(error as Error)
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}>
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">BagsPay Checkout</h2>
          <p className="text-gray-600">Pay with Bags memecoin</p>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-700">Amount:</span>
            <span className="text-xl font-semibold text-gray-900">${amount.toFixed(2)}</span>
          </div>

          {!publicKey ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Connect your wallet to continue</p>
              <WalletMultiButton className="w-full !bg-primary-600 hover:!bg-primary-700" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Token
                </label>
                <select
                  value={selectedToken?.address || ''}
                  onChange={(e) => {
                    const token = tokens.find(t => t.address === e.target.value)
                    setSelectedToken(token || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {tokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedToken && tokenAmount > 0 && (
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">You&apos;ll pay:</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {tokenAmount.toFixed(6)} {selectedToken.symbol}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handlePayment}
                disabled={isProcessing || !selectedToken}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-md font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Pay Now'
                )}
              </button>

              <div className="text-center">
                <WalletMultiButton className="!bg-gray-100 hover:!bg-gray-200 !text-gray-900" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

