/**
 * BagsPay Demo - Landing Page
 * 
 * TODO: When integrating real Bags API:
 * 1. Replace mockBagsApi imports with actual Bags API client
 * 2. Update CheckoutWidget to use real wallet adapter (if needed)
 * 3. Replace mock SNS resolution with real Solana Name Service calls
 * 4. Update receipt page to verify transactions on-chain
 * 5. Add real transaction explorer links
 * 
 * Integration points:
 * - /lib/mockBagsApi.ts → Replace with real Bags API SDK
 * - /lib/sns.ts → Replace with @bonfida/spl-name-service or similar
 * - /components/CheckoutWidget.tsx → Add wallet adapter if needed
 */

import Link from 'next/link'
import CopyCodeButton from '../components/CopyCodeButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl mb-6 shadow-2xl animate-float">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 dark:text-white mb-4">
            <span className="gradient-text">BagsPay</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-8">
            Non-custodial checkout widget powered by Bags API
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Non-custodial</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users maintain full control of their funds</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
              <div className="w-12 h-12 bg-brand-secondary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Embeddable</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Simple widget that integrates anywhere</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 max-w-xs">
              <div className="w-12 h-12 bg-brand-tertiary/20 rounded-lg flex items-center justify-center mb-3 mx-auto">
                <svg className="w-6 h-6 text-brand-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Any Bags Memecoin</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support for all Bags protocol tokens</p>
            </div>
          </div>

          <Link
            href="/demo"
            className="inline-block px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-gotsol-black text-lg font-semibold rounded-xl hover:opacity-90 transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            Launch Demo →
          </Link>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-gotsol-black text-2xl font-bold mb-6 mx-auto">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Merchant Embeds Widget</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Merchants add a simple embed snippet to their checkout page. The widget is fully customizable and themeable.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-gotsol-black text-2xl font-bold mb-6 mx-auto">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Selects Token + Gets Quote</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Users choose from available Bags memecoins. The widget gets a real-time quote via Bags API showing exact amounts and fees.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-full flex items-center justify-center text-gotsol-black text-2xl font-bold mb-6 mx-auto">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Swap + Pay + Receipt</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Bags API executes the swap automatically. Payment is sent directly to the merchant. User receives a receipt with transaction details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Embed Snippet Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Embed in Seconds
          </h2>

          <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm font-semibold">EMBED SNIPPET</span>
              <CopyCodeButton
                code={`<script src="https://widget.bagspay.com/embed.js"></script>
<script>
  BagsPay.init({
    merchant: 'your-merchant.sol',
    amount: 100,
    currency: 'USDC',
    theme: 'light'
  });
</script>`}
              />
            </div>
            <pre className="text-green-400 text-sm overflow-x-auto">
              <code>{`<script src="https://widget.bagspay.com/embed.js"></script>
<script>
  BagsPay.init({
    merchant: 'your-merchant.sol',
    amount: 100,
    currency: 'USDC',
    theme: 'light'
  });
</script>`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400">
          Built for Bags Hackathon | Powered by Bags API
        </p>
      </footer>
    </div>
  )
}
