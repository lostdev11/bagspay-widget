/**
 * BagsPay Receipt Page
 * 
 * Displays payment receipt after successful checkout.
 * 
 * TODO: When integrating real Bags API:
 * - Verify transaction signature on-chain
 * - Fetch real transaction data from Solana explorer
 * - Add explorer link validation
 * - Store receipts in database instead of localStorage
 */

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PaymentResponse } from '../../../lib/types'
import { resolveAddress, isValidSolDomain } from '../../../lib/sns'

export default function ReceiptPage() {
  const params = useParams()
  const router = useRouter()
  const receiptId = params?.id as string
  const [receipt, setReceipt] = useState<PaymentResponse | null>(null)
  const [merchantDisplay, setMerchantDisplay] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!receiptId || typeof window === 'undefined') {
      setLoading(false)
      return
    }

    // Load receipt from localStorage
    const receiptData = localStorage.getItem(`receipt_${receiptId}`)
    if (receiptData) {
      try {
        const parsed: PaymentResponse = JSON.parse(receiptData)
        setReceipt(parsed)
        
        // Resolve merchant display name
        const resolveMerchant = async () => {
          try {
            const resolved = await resolveAddress(parsed.merchant)
            if (isValidSolDomain(parsed.merchant)) {
              setMerchantDisplay(parsed.merchant)
            } else {
              setMerchantDisplay(`${parsed.merchant.substring(0, 8)}...${parsed.merchant.substring(parsed.merchant.length - 8)}`)
            }
          } catch (error) {
            setMerchantDisplay(`${parsed.merchant.substring(0, 8)}...${parsed.merchant.substring(parsed.merchant.length - 8)}`)
          }
        }
        resolveMerchant()
      } catch (error) {
        console.error('Failed to parse receipt:', error)
      }
    }
    setLoading(false)
  }, [receiptId])

  const handleCopyTx = async () => {
    if (!receipt?.txSignature) return
    try {
      await navigator.clipboard.writeText(receipt.txSignature)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const explorerUrl = receipt?.txSignature
    ? `https://solscan.io/tx/${receipt.txSignature}`
    : '#'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Receipt Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The receipt you&apos;re looking for doesn&apos;t exist or has expired.
            </p>
            <Link
              href="/demo"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
            >
              Back to Demo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const formattedDate = new Date(receipt.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

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
              href="/demo"
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium"
            >
              ← Back to Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 animate-scale-in">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">Your transaction has been completed</p>
          </div>

          {/* Receipt Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-semibold">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed
                </span>
              </div>

              {/* Receipt ID */}
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Receipt ID</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{receiptId}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Details</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Merchant</span>
                      <span className="text-gray-900 dark:text-white font-mono text-sm">{merchantDisplay || 'Loading...'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Amount</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {receipt.currency === 'USDC' ? '$' : ''}{receipt.amount.toFixed(2)} {receipt.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Token Used</span>
                      <span className="text-gray-900 dark:text-white font-semibold">
                        {receipt.tokenUsed.symbol} - {receipt.tokenUsed.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Date</span>
                      <span className="text-gray-900 dark:text-white">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Signature */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Signature</span>
                  <button
                    onClick={handleCopyTx}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-900 dark:text-white break-all">{receipt.txSignature}</p>
              </div>

              {/* Explorer Link */}
              <div>
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-semibold space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>View on Solscan</span>
                </a>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link
              href="/demo"
              className="inline-block px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-600 dark:hover:border-indigo-600 transition-colors font-semibold"
            >
              Back to Demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

