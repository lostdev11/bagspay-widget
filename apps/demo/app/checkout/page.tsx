/**
 * Checkout Page - Shareable checkout link
 * 
 * This page is designed to be accessed via QR code or shareable link.
 * It reads query parameters and displays the checkout widget.
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import CheckoutWidget from '../../components/CheckoutWidget'

function CheckoutContent() {
  const searchParams = useSearchParams()
  
  // Get parameters from URL
  const merchant = searchParams.get('merchant') || 'merchant.sol'
  const amount = parseFloat(searchParams.get('amount') || '100')
  const currency = (searchParams.get('currency') || 'USDC') as 'USDC' | 'SOL'
  const theme = (searchParams.get('theme') || 'light') as 'light' | 'dark'

  const handlePaymentSuccess = (receiptId: string, txSignature: string) => {
    console.log('Payment successful:', { receiptId, txSignature })
    // Receipt page will be loaded via CheckoutWidget redirect
  }

  const handlePaymentError = (error: Error) => {
    console.error('Payment error:', error)
    // Error is handled in CheckoutWidget
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                BagsPay
              </span>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Checkout
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Complete your payment using any Bags memecoin
            </p>
          </div>

          {/* Checkout Widget */}
          <div className="flex items-start justify-center">
            <CheckoutWidget
              merchant={merchant}
              amount={amount}
              currency={currency}
              theme={theme}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>

          {/* Payment Details Summary */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Details
            </h2>
            <div className="space-y-2 text-gray-600 dark:text-gray-400">
              <div className="flex justify-between">
                <span>Merchant:</span>
                <span className="font-mono text-sm">{merchant}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount:</span>
                <span className="font-semibold">{amount} {currency}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

