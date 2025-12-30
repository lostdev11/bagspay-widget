import { useState, useEffect, useRef, useCallback } from 'react'
import { mockGetQuote } from '../mockBagsApi'
import type { QuoteResponse, BagsToken } from '../types'

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const SOL_MINT = 'So11111111111111111111111111111111111111112'
const BAGS_API_BASE = process.env.NEXT_PUBLIC_BAGS_API_BASE_URL
const USE_MOCK = !BAGS_API_BASE
const DEBOUNCE_MS = 300 // 300ms debounce

interface UseBagsQuoteParams {
  amount: number
  token: BagsToken | null
  currency: 'USDC' | 'SOL'
  merchantAddress: string | null
}

interface UseBagsQuoteResult {
  quote: QuoteResponse | null
  isLoading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Get quote using mock or real API
 */
async function getQuote(params: {
  tokenIn: string
  amount: number
  currency: 'USDC' | 'SOL'
}): Promise<QuoteResponse> {
  if (USE_MOCK) {
    return await mockGetQuote(params)
  } else {
    try {
      const outToken = params.currency === 'USDC' ? USDC_MINT : SOL_MINT
      
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
      return quote as QuoteResponse
    } catch (error) {
      console.error('Error fetching quote from API, falling back to mock:', error)
      return await mockGetQuote(params)
    }
  }
}

/**
 * Hook for fetching Bags quotes
 * Features:
 * - Debounced fetching (300ms)
 * - Request ID pattern to prevent race conditions
 * - Automatic refetch on amount/token/currency/merchant changes
 * - Error handling with retry
 */
export function useBagsQuote({
  amount,
  token,
  currency,
  merchantAddress,
}: UseBagsQuoteParams): UseBagsQuoteResult {
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const fetchQuote = useCallback(async (
    params: { tokenIn: string; amount: number; currency: 'USDC' | 'SOL' },
    currentRequestId: number
  ) => {
    try {
      const quoteData = await getQuote(params)
      
      // Only apply if this is still the latest request
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        setQuote(quoteData)
        setIsLoading(false)
        setError(null)
      }
    } catch (err) {
      // Only apply error if this is still the latest request
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get quote'
        console.error('Failed to get quote:', err)
        setError(errorMessage)
        setIsLoading(false)
        setQuote(null)
      }
    }
  }, [])

  // Main quote fetching effect with debouncing
  useEffect(() => {
    isMountedRef.current = true

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Don't fetch if missing required data
    if (!token || !merchantAddress || amount <= 0) {
      setQuote(null)
      setIsLoading(false)
      setError(null)
      return
    }

    // Debounce quote fetching
    debounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      // Increment request ID for this new request
      const currentRequestId = ++requestIdRef.current
      
      // Create new abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsLoading(true)
      setError(null)

      fetchQuote(
        {
          tokenIn: token.address,
          amount,
          currency,
        },
        currentRequestId
      )
    }, DEBOUNCE_MS)

    return () => {
      isMountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [token, merchantAddress, amount, currency, fetchQuote])

  const refresh = useCallback(() => {
    if (!token || !merchantAddress || amount <= 0) return

    // Increment request ID for new request
    const currentRequestId = ++requestIdRef.current

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)

    fetchQuote(
      {
        tokenIn: token.address,
        amount,
        currency,
      },
      currentRequestId
    )
  }, [token, merchantAddress, amount, currency, fetchQuote])

  return {
    quote,
    isLoading,
    error,
    refresh,
  }
}

