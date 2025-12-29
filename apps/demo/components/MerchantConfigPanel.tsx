'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import QRCodeBlock from './QRCodeBlock'

interface MerchantConfigPanelProps {
  onConfigChange?: (config: {
    merchant: string
    amount: number
    currency: 'USDC' | 'SOL'
    theme: 'light' | 'dark'
  }) => void
}

export default function MerchantConfigPanel({ onConfigChange }: MerchantConfigPanelProps) {
  const [merchant, setMerchant] = useState('merchant.sol')
  const [amount, setAmount] = useState('100')
  const [currency, setCurrency] = useState<'USDC' | 'SOL'>('USDC')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [checkoutUrl, setCheckoutUrl] = useState('')

  // Debounced config for onConfigChange
  const [debouncedConfig, setDebouncedConfig] = useState({
    merchant: 'merchant.sol',
    amount: 100,
    currency: 'USDC' as 'USDC' | 'SOL',
    theme: 'light' as 'light' | 'dark',
  })

  // Generate checkout URL based on current config (only on client)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCheckoutUrl(`${window.location.origin}/checkout?merchant=${encodeURIComponent(merchant)}&amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}&theme=${encodeURIComponent(theme)}`)
    }
  }, [merchant, amount, currency, theme])

  // Debounce config changes to reduce re-renders
  useEffect(() => {
    const numAmount = parseFloat(amount) || 0
    const timer = setTimeout(() => {
      setDebouncedConfig({
        merchant,
        amount: numAmount,
        currency,
        theme,
      })
    }, 150) // 150ms debounce

    return () => clearTimeout(timer)
  }, [merchant, amount, currency, theme])

  // Call onConfigChange only when debounced config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(debouncedConfig)
    }
  }, [debouncedConfig, onConfigChange])

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Merchant Configuration
        </h2>

        <div className="space-y-5">
          {/* Merchant Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Merchant Address / .sol Domain
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="merchant.sol or wallet address"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter a wallet address or .sol domain
            </p>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
              min="0"
              step="0.01"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Currency Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'USDC' | 'SOL')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="USDC">USDC</option>
              <option value="SOL">SOL</option>
            </select>
          </div>

          {/* Theme Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark')}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* QR Code Block */}
      {checkoutUrl && (
        <QRCodeBlock url={checkoutUrl} />
      )}
    </div>
  )
}

