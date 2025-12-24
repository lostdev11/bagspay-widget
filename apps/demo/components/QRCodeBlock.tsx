'use client'

import { useState } from 'react'

interface QRCodeBlockProps {
  url: string
  size?: number
}

export default function QRCodeBlock({ url, size = 200 }: QRCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  // Use external QR code service (no dependencies needed)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Shareable Checkout Link
        </h3>
        
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="border-4 border-gray-100 dark:border-gray-700 rounded-lg"
            width={size}
            height={size}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <input
              type="text"
              readOnly
              value={url}
              className="flex-1 text-sm text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

