'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WalletContextProvider } from '@/lib/wallet-provider'
import CheckoutWidget from '@/components/CheckoutWidget'

function EmbedContent() {
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const merchantId = searchParams.get('merchantId') || ''
  const orderId = searchParams.get('orderId') || null

  useEffect(() => {
    // Notify parent window that widget is ready
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'BAGSPAY_READY' }, '*')
    }
  }, [])

  const handleSuccess = (signature: string) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({
        type: 'BAGSPAY_SUCCESS',
        signature,
      }, '*')
    }
  }

  const handleError = (error: Error) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({
        type: 'BAGSPAY_ERROR',
        error: error.message,
      }, '*')
    }
  }

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <CheckoutWidget
          amount={amount}
          merchantId={merchantId}
          orderId={orderId || undefined}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </WalletContextProvider>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading checkout...</div>
      </div>
    }>
      <EmbedContent />
    </Suspense>
  )
}

