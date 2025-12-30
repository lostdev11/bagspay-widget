import { useState, useEffect, useRef, useCallback } from 'react'
import { PublicKey } from '@solana/web3.js'
import { BagsAPI } from '../../../lib/bagsApi'
import type { BagsToken } from '../../../lib/types'

const DEBOUNCE_MS = 300 // 300ms debounce

interface UseBagsQuoteParams {
  amount: number
  token: BagsToken | null
  currency: 'USDC' | 'SOL'
  merchantAddress: PublicKey | null
}

interface UseBagsQuoteResult {
  tokenAmount: number
  isLoading: boolean
  error: string | null
  refresh: () => void
}

/**
 * Hook for fetching Bags quotes and calculating token amounts
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
  bagsAPI,
}: UseBagsQuoteParams & { bagsAPI: BagsAPI }): UseBagsQuoteResult {
  const [tokenAmount, setTokenAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  const fetchQuote = useCallback(async (
    params: { tokenAddress: string; amount: number },
    currentRequestId: number
  ) => {
    try {
      const price = await bagsAPI.getTokenPrice(params.tokenAddress)
      
      if (price <= 0) {
        throw new Error('Unable to get token price')
      }

      const amountInTokens = params.amount / price
      
      // Only apply if this is still the latest request
      if (isMountedRef.current && requestIdRef.current === currentRequestId) {
        setTokenAmount(amountInTokens)
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
        setTokenAmount(0)
      }
    }
  }, [bagsAPI])

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
      setTokenAmount(0)
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
          tokenAddress: token.address,
          amount,
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
        tokenAddress: token.address,
        amount,
      },
      currentRequestId
    )
  }, [token, merchantAddress, amount, fetchQuote])

  return {
    tokenAmount,
    isLoading,
    error,
    refresh,
  }
}

