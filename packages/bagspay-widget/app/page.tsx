'use client'

import { WalletContextProvider } from '@/lib/wallet-provider'
import CheckoutWidget from '@/components/CheckoutWidget'

export default function Home() {
  const handleSuccess = (signature: string) => {
    console.log('Payment successful:', signature)
    alert(`Payment successful! Transaction: ${signature}`)
  }

  const handleError = (error: Error) => {
    console.error('Payment error:', error)
    alert(`Payment failed: ${error.message}`)
  }

  return (
    <WalletContextProvider>
      <main className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              BagsPay Checkout Widget
            </h1>
            <p className="text-lg text-gray-600">
              Non-custodial payment widget for Bags memecoin
            </p>
          </div>

          <div className="flex justify-center">
            <CheckoutWidget
              amount={29.99}
              merchantId="demo-merchant-123"
              orderId="order-456"
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>

          <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Integration Guide</h2>
            <div className="space-y-4 text-gray-700">
              <p>
                To embed this widget in your website, include the following script:
              </p>
              <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                {`<script src="https://widget.bagspay.com/embed.js"></script>
<div id="bagspay-checkout"></div>
<script>
  BagsPay.init({
    amount: 29.99,
    merchantId: 'your-merchant-id',
    orderId: 'order-123',
    onSuccess: (signature) => {
      console.log('Payment successful:', signature);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
    }
  });
</script>`}
              </pre>
            </div>
          </div>
        </div>
      </main>
    </WalletContextProvider>
  )
}

