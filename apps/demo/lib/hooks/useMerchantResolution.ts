import { useState, useEffect, useRef, useCallback } from 'react'
import { resolveAddress, isValidSolDomain } from '../sns'

const RESOLUTION_TIMEOUT = 7000 // 7 seconds
const DEBOUNCE_MS = 400 // 400ms debounce

interface UseMerchantResolutionResult {
  resolvedAddress: string | null
  isResolving: boolean
  error: string | null
  retry: () => void
}

/**
 * Hook for resolving merchant addresses (.sol domains or wallet addresses)
 * Features:
 * - Debounced resolution (400ms)
 * - Hard timeout (7 seconds)
 * - Cancellation on unmount/input change
 * - Fallback to raw address if .sol resolution fails
 * - Error handling with retry
 */
export function useMerchantResolution(input: string | null | undefined): UseMerchantResolutionResult {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Validate if input looks like a base58 address (32-44 chars, alphanumeric)
  const isValidBase58Address = useCallback((addr: string): boolean => {
    if (addr.length < 32 || addr.length > 44) return false
    // Basic base58 check: alphanumeric, no 0, O, I, l
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    return base58Regex.test(addr)
  }, [])

  const resolveMerchant = useCallback(async (merchantInput: string, signal: AbortSignal) => {
    if (!merchantInput || merchantInput.trim() === '') {
      if (isMountedRef.current) {
        setResolvedAddress(null)
        setIsResolving(false)
        setError('Merchant address is required')
      }
      return
    }

    const trimmedInput = merchantInput.trim()

    try {
      // If it's a .sol domain, try to resolve it
      if (isValidSolDomain(trimmedInput)) {
        try {
          const resolved = await resolveAddress(trimmedInput)
          if (signal.aborted || !isMountedRef.current) return
          
          if (resolved) {
            setResolvedAddress(resolved)
            setIsResolving(false)
            setError(null)
            return
          }
        } catch (domainError) {
          // .sol resolution failed, try fallback to raw address
          console.warn('Failed to resolve .sol domain, trying as raw address:', domainError)
          // Continue to try as raw address below
        }
      }

      // Fallback: try treating input as raw address
      if (isValidBase58Address(trimmedInput)) {
        if (signal.aborted || !isMountedRef.current) return
        setResolvedAddress(trimmedInput)
        setIsResolving(false)
        setError(null)
        return
      }

      // Invalid input
      if (signal.aborted || !isMountedRef.current) return
      setError(`Invalid merchant address or domain: ${trimmedInput}`)
      setResolvedAddress(null)
      setIsResolving(false)
    } catch (err) {
      if (signal.aborted || !isMountedRef.current) return
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve merchant address'
      console.error('Merchant resolution error:', err)
      setError(errorMessage)
      setResolvedAddress(null)
      setIsResolving(false)
    }
  }, [isValidBase58Address])

  // Main resolution effect with debouncing
  useEffect(() => {
    isMountedRef.current = true

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Clear previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!input || input.trim() === '') {
      setResolvedAddress(null)
      setIsResolving(false)
      setError(null)
      return
    }

    // Debounce resolution
    debounceRef.current = setTimeout(() => {
      if (!isMountedRef.current) return

      // Create new abort controller for this resolution
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      setIsResolving(true)
      setError(null)

      // Set hard timeout
      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || abortController.signal.aborted) return
        
        abortController.abort()
        setError('Merchant resolution timed out. Please check the address and try again.')
        setResolvedAddress(null)
        setIsResolving(false)
      }, RESOLUTION_TIMEOUT)

      // Start resolution
      resolveMerchant(input, abortController.signal).finally(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      })
    }, DEBOUNCE_MS)

    return () => {
      isMountedRef.current = false
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [input, resolveMerchant])

  const retry = useCallback(() => {
    // Force re-resolution by clearing state and re-triggering
    setError(null)
    setIsResolving(false)
    setResolvedAddress(null)
    
    // Re-trigger effect by updating a dependency
    // This is handled by the useEffect above when input changes
    // For retry, we'll manually trigger resolution
    if (input) {
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      
      setIsResolving(true)
      setError(null)

      timeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current || abortController.signal.aborted) return
        abortController.abort()
        setError('Merchant resolution timed out. Please check the address and try again.')
        setResolvedAddress(null)
        setIsResolving(false)
      }, RESOLUTION_TIMEOUT)

      resolveMerchant(input, abortController.signal).finally(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      })
    }
  }, [input, resolveMerchant])

  return {
    resolvedAddress,
    isResolving,
    error,
    retry,
  }
}

