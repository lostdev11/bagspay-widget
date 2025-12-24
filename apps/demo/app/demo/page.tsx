/**
 * BagsPay Demo Page
 * 
 * This page showcases the interactive checkout widget with merchant configuration.
 * 
 * TODO: When integrating real Bags API:
 * - Replace mockBagsApi with actual Bags API client
 * - Add wallet adapter integration if needed
 * - Update CheckoutWidget to use real transaction signing
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import MerchantConfigPanel from '../../components/MerchantConfigPanel'
import CheckoutWidget from '../../components/CheckoutWidget'
import type { PaymentResponse } from '../../lib/types'

export default function DemoPage() {
  const [config, setConfig] = useState({
    merchant: 'merchant.sol',
    amount: 100,
    currency: 'USDC' as 'USDC' | 'SOL',
    theme: 'light' as 'light' | 'dark',
  })

  const handleConfigChange = (newConfig: {
    merchant: string
    amount: number
    currency: 'USDC' | 'SOL'
    theme: 'light' | 'dark'
  }) => {
    setConfig(newConfig)
  }

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
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Interactive Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Configure the merchant settings and experience the BagsPay checkout widget in action
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Left Column: Merchant Config Panel */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <MerchantConfigPanel onConfigChange={handleConfigChange} />
          </div>

          {/* Right Column: Checkout Widget */}
          <div className="flex items-start justify-center lg:justify-start">
            <CheckoutWidget
              merchant={config.merchant}
              amount={config.amount}
              currency={config.currency}
              theme={config.theme}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              How to Use This Demo
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">1</span>
                </div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Configure Settings:</strong> Adjust the merchant address, amount, currency, and theme in the left panel.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">2</span>
                </div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Select Token:</strong> Choose from available Bags memecoins in the checkout widget.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">3</span>
                </div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Review Quote:</strong> See the estimated amount, slippage, and fees before confirming.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm font-bold">4</span>
                </div>
                <p>
                  <strong className="text-gray-900 dark:text-white">Complete Payment:</strong> Confirm the payment to see the receipt screen with transaction details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

