'use client'

import { useState, memo } from 'react'

interface QRCodeBlockProps {
  url: string
  size?: number
}

const QRCodeBlock = memo(function QRCodeBlock({ url, size = 200 }: QRCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Check if URL is localhost
  const isLocalhost = typeof window !== 'undefined' && 
    (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('0.0.0.0'))

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
        
        {isLocalhost && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Localhost URLs won&apos;t work when scanned from other devices. Use your network IP or deploy to test QR codes.
            </p>
          </div>
        )}

        <div className="flex justify-center">
          {imageError ? (
            <div className="w-[200px] h-[200px] border-4 border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load QR code</p>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="border-4 border-gray-100 dark:border-gray-700 rounded-lg"
              width={size}
              height={size}
              onError={() => setImageError(true)}
            />
          )}
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
})

export default QRCodeBlock
