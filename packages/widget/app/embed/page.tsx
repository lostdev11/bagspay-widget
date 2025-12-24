'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { WalletContextProvider } from '@/lib/wallet-provider'
import CheckoutWidget from '@/components/CheckoutWidget'

function EmbedContent() {
  const searchParams = useSearchParams()
  const amount = parseFloat(searchParams.get('amount') || '0')
  const merchant = searchParams.get('merchant') || ''
  const currency = (searchParams.get('currency') as 'USDC' | 'SOL') || 'USDC'
  const theme = (searchParams.get('theme') as 'light' | 'dark') || 'light'
  const orderId = searchParams.get('orderId') || undefined

  useEffect(() => {
    // Notify parent window that widget is ready
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({ type: 'BAGSPAY_READY' }, '*')
    }
  }, [])

  const handleSuccess = (txSignature: string) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage({
        type: 'BAGSPAY_SUCCESS',
        signature: txSignature,
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

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'

  return (
    <WalletContextProvider>
      <div className={`min-h-screen ${bgColor} p-4`}>
        <CheckoutWidget
          merchant={merchant}
          amount={amount}
          currency={currency}
          theme={theme}
          orderId={orderId}
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

