'use client'

import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { mockGetQuote, executePayment, getTokens } from '../lib/mockBagsApi'
import { resolveAddress, isValidSolDomain } from '../lib/sns'
import type { BagsPayWidgetProps, BagsToken, QuoteResponse } from '../lib/types'

type WidgetState = 'idle' | 'quoting' | 'confirm' | 'processing' | 'success' | 'error'

// Check if live API is configured
const BAGS_API_BASE = process.env.NEXT_PUBLIC_BAGS_API_BASE_URL
const USE_MOCK = !BAGS_API_BASE

// Token mint addresses for mapping currency to outToken
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const SOL_MINT = 'So11111111111111111111111111111111111111112'

/**
 * Get quote using mock or real API based on configuration
 */
async function getQuote(params: {
  tokenIn: string;
  amount: number;
  currency: 'USDC' | 'SOL';
}): Promise<QuoteResponse> {
  if (USE_MOCK) {
    return await mockGetQuote(params)
  } else {
    try {
      // Map currency to outToken address
      const outToken = params.currency === 'USDC' ? USDC_MINT : SOL_MINT
      
      // Fetch quote from API via proxy route
      const response = await fetch('/api/bags/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenIn: params.tokenIn,
          amount: params.amount,
          outToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to get quote: ${response.statusText}`)
      }

      const quote = await response.json()
      // Type assertion - real API should return QuoteResponse compatible structure
      return quote as QuoteResponse
    } catch (error) {
      console.error('Error fetching quote from API, falling back to mock:', error)
      // Fallback to mock on error
      return await mockGetQuote(params)
    }
  }
}

const CheckoutWidget = memo(function CheckoutWidget({
  merchant,
  amount,
  currency = 'USDC',
  theme = 'light',
  orderId,
  onSuccess,
  onError,
}: BagsPayWidgetProps) {
  const [state, setState] = useState<WidgetState>('idle')
  const [merchantAddress, setMerchantAddress] = useState<string | null>(null)
  const [selectedToken, setSelectedToken] = useState<BagsToken | null>(null)
  const [tokens, setTokens] = useState<BagsToken[]>([])
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Resolve merchant address with debouncing
  const resolveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    const resolveMerchant = async () => {
      if (!merchant) {
        setState('error')
        setErrorMessage('Merchant address is required')
        return
      }

      try {
        const resolved = await resolveAddress(merchant)
        setMerchantAddress(resolved)
        setState('idle')
      } catch (error) {
        console.error('Failed to resolve merchant:', error)
        setState('error')
        setErrorMessage(error instanceof Error ? error.message : 'Failed to resolve merchant address')
        onError?.(error as Error)
      }
    }

    // Clear previous timeout
    if (resolveTimeoutRef.current) {
      clearTimeout(resolveTimeoutRef.current)
    }

    // Debounce merchant resolution
    resolveTimeoutRef.current = setTimeout(() => {
      resolveMerchant()
    }, 300)

    return () => {
      if (resolveTimeoutRef.current) {
        clearTimeout(resolveTimeoutRef.current)
      }
    }
  }, [merchant, onError])

  // Load tokens from API or mock
  useEffect(() => {
    const loadTokens = async () => {
      if (USE_MOCK) {
        // Use mock tokens
        const mockTokens = getTokens()
        setTokens(mockTokens)
        if (mockTokens.length > 0) {
          setSelectedToken(mockTokens[0])
        }
      } else {
        // Fetch tokens from live API via proxy route
        try {
          const response = await fetch('/api/bags/tokens', {
            headers: {
              'Content-Type': 'application/json',
            },
          })
          
          if (!response.ok) {
            throw new Error(`Failed to fetch tokens: ${response.statusText}`)
          }
          
          const data = await response.json()
          const apiTokens: BagsToken[] = data.tokens || []
          
          if (apiTokens.length > 0) {
            setTokens(apiTokens)
            setSelectedToken(apiTokens[0])
          } else {
            // Fallback to mock if API returns no tokens
            const mockTokens = getTokens()
            setTokens(mockTokens)
            if (mockTokens.length > 0) {
              setSelectedToken(mockTokens[0])
            }
          }
        } catch (error) {
          console.error('Error fetching tokens from API, falling back to mock:', error)
          // Fallback to mock tokens on error
          const mockTokens = getTokens()
          setTokens(mockTokens)
          if (mockTokens.length > 0) {
            setSelectedToken(mockTokens[0])
          }
        }
      }
    }
    
    loadTokens()
  }, [])

  // Memoize quote fetching function
  const fetchQuote = useCallback(async () => {
    if (!selectedToken || !merchantAddress) return

    setState('quoting')
    setQuoteError(null)

    try {
      const quoteData = await getQuote({
        tokenIn: selectedToken.address,
        amount,
        currency,
      })
      setQuote(quoteData)
      setState('confirm')
    } catch (error) {
      console.error('Failed to get quote:', error)
      setState('error')
      setQuoteError(error instanceof Error ? error.message : 'Failed to get quote')
      onError?.(error as Error)
    }
  }, [selectedToken, merchantAddress, amount, currency, onError])

  // Auto-quote when token is selected (debounced)
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    if (selectedToken && merchantAddress && state === 'idle') {
      // Clear previous timeout
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current)
      }

      // Debounce quote fetching
      quoteTimeoutRef.current = setTimeout(() => {
        fetchQuote()
      }, 200)

      return () => {
        if (quoteTimeoutRef.current) {
          clearTimeout(quoteTimeoutRef.current)
        }
      }
    }
  }, [selectedToken, merchantAddress, state, fetchQuote])

  const getQuoteData = useCallback(async () => {
    if (!selectedToken) return

    setState('quoting')
    setQuoteError(null)

    try {
      const quoteData = await getQuote({
        tokenIn: selectedToken.address,
        amount,
        currency,
      })
      setQuote(quoteData)
      setState('confirm')
    } catch (error) {
      console.error('Failed to get quote:', error)
      setState('error')
      setQuoteError(error instanceof Error ? error.message : 'Failed to get quote')
      onError?.(error as Error)
    }
  }, [selectedToken, amount, currency, onError])

  const handlePayment = useCallback(async () => {
    if (!selectedToken || !merchantAddress) {
      setState('error')
      setErrorMessage('Missing payment details')
      return
    }

    setState('processing')
    setErrorMessage(null)

    try {
      const paymentResponse = await executePayment({
        tokenIn: selectedToken.address,
        amount,
        currency,
        merchant: merchantAddress,
        orderId,
      })

      // Store receipt data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`receipt_${paymentResponse.receiptId}`, JSON.stringify(paymentResponse))
      }

      setState('success')
      onSuccess?.(paymentResponse.receiptId, paymentResponse.txSignature)

      // Auto-redirect to receipt page after a short delay
      setTimeout(() => {
        window.location.href = `/receipt/${paymentResponse.receiptId}`
      }, 2000)
    } catch (error) {
      console.error('Payment failed:', error)
      setState('error')
      const errorMsg = error instanceof Error ? error.message : 'Payment failed'
      setErrorMessage(errorMsg)
      onError?.(error instanceof Error ? error : new Error(errorMsg))
    }
  }, [selectedToken, merchantAddress, amount, currency, orderId, onSuccess, onError])

  const reset = useCallback(() => {
    setState('idle')
    setQuote(null)
    setErrorMessage(null)
    setQuoteError(null)
    if (selectedToken && merchantAddress) {
      getQuoteData()
    }
  }, [selectedToken, merchantAddress, getQuoteData])

  // Memoize theme-based styles to avoid recalculation
  const styles = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      bgColor: isDark ? 'bg-gray-800' : 'bg-white',
      textColor: isDark ? 'text-gray-100' : 'text-gray-900',
      textSecondary: isDark ? 'text-gray-400' : 'text-gray-600',
      borderColor: isDark ? 'border-gray-700' : 'border-gray-200',
      inputBg: isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200',
      cardBg: isDark ? 'bg-gray-700/50' : 'bg-gradient-to-br from-indigo-50 to-purple-50',
    }
  }, [theme])

  const { bgColor, textColor, textSecondary, borderColor, inputBg, cardBg } = styles

  // Error state
  if (state === 'error') {
    return (
      <div className={`${bgColor} shadow-2xl rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h3 className={`text-xl font-bold ${textColor} mb-2`}>Error</h3>
            <p className={textSecondary}>{errorMessage || quoteError || 'An error occurred'}</p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (state === 'success') {
    return (
      <div className={`${bgColor} shadow-2xl rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-scale-in">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className={`text-2xl font-bold ${textColor} mb-2`}>Payment Successful!</h3>
            <p className={textSecondary}>Redirecting to receipt...</p>
          </div>
        </div>
      </div>
    )
  }

  // Loading/Resolving state
  if (!merchantAddress || state === 'quoting') {
    return (
      <div className={`${bgColor} shadow-2xl rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={textSecondary}>
            {!merchantAddress ? 'Resolving merchant address...' : 'Getting quote...'}
          </p>
        </div>
      </div>
    )
  }

  // Processing state
  if (state === 'processing') {
    return (
      <div className={`${bgColor} shadow-2xl rounded-2xl p-8 max-w-md mx-auto border ${borderColor}`}>
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
    <div className={`${bgColor} shadow-2xl rounded-2xl p-8 max-w-md mx-auto border ${borderColor} transition-all duration-300`}>
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
          <div className={`flex justify-between items-center mb-6 p-4 ${cardBg} rounded-xl border ${borderColor}`}>
            <span className={`font-medium ${textSecondary}`}>Amount:</span>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {currency === 'USDC' ? '$' : ''}{amount.toFixed(2)} {currency}
            </span>
          </div>

          {merchant && (
            <div className={`mb-6 p-3 ${inputBg} rounded-lg border ${borderColor}`}>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className={`text-xs font-medium ${textSecondary}`}>
                  Merchant: {isValidSolDomain(merchant) ? merchant : `${merchant.substring(0, 8)}...${merchant.substring(merchant.length - 8)}`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${textColor} mb-3`}>
                Select Token
              </label>
              <select
                value={selectedToken?.address || ''}
                onChange={(e) => {
                  const token = tokens.find(t => t.address === e.target.value)
                  setSelectedToken(token || null)
                  setState('idle')
                  // Quote will be fetched automatically via useEffect
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

            {quote && state === 'confirm' && (
              <div className={`${cardBg} rounded-xl p-4 border-2 ${borderColor} shadow-sm space-y-3`}>
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${textSecondary}`}>You&apos;ll pay:</span>
                  <span className={`text-xl font-bold ${textColor}`}>
                    {quote.amountIn.toFixed(6)} <span className="text-indigo-600 dark:text-indigo-400">{selectedToken?.symbol}</span>
                  </span>
                </div>
                <div className="border-t ${borderColor} pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={textSecondary}>Slippage:</span>
                    <span className={textColor}>{quote.slippage.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textSecondary}>Price Impact:</span>
                    <span className={textColor}>{quote.priceImpact.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textSecondary}>Fee:</span>
                    <span className={textColor}>${quote.fee.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}

            {quoteError && (
              <div className={`p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg`}>
                <p className={`text-sm text-red-600 dark:text-red-400`}>{quoteError}</p>
                <button
                  onClick={getQuoteData}
                  className="mt-2 text-sm text-red-700 dark:text-red-300 underline"
                >
                  Retry quote
                </button>
              </div>
            )}

            {state === 'confirm' && (
              <button
                onClick={handlePayment}
                disabled={!selectedToken || !quote}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Confirm Payment
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

export default CheckoutWidget
