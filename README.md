# BagsPay — Embeddable Checkout Widget (Bags Hackathon)

## Live Demo
https://bagspay-widget-demo.vercel.app/

> Hackathon Demo — payments flow is live; some execution paths may be simulated for demo stability.

BagsPay is an embeddable, non-custodial checkout widget powered by the **Bags API** that enables merchants to accept payments using **any Bags memecoin**. It is built as a standalone demo for the Bags Hackathon and is designed to integrate cleanly into existing commerce platforms (e.g., GotSOL) without exposing private codebases.

## What's Included in This Demo
- Embeddable checkout widget (payments-only scope)
- Live demo site deployed via Vercel
- Quote routing via Bags API (live or mocked depending on environment)
- Receipt / success state with transaction metadata
- Designed to integrate cleanly into GotSOL Paylinks and merchant sites

## What this is
- **Checkout Widget**: drop-in UI for merchant sites/apps
- **Demo Site**: judge-friendly interactive demo showcasing the widget flow
- **Non-custodial**: users remain in control of funds (no custody)

## Why it matters
Most merchants don't want to rebuild their stack to accept new assets. A widget is the fastest path to adoption:
- Merchants embed the widget
- Customers pay with any Bags memecoin
- Routing/quotes are handled via **Bags API**
- Receipts are transparent and verifiable

## Hackathon Focus
For the Bags Hackathon, BagsPay is intentionally scoped to:
- Payments-only (no inventory or bookkeeping logic inside the widget)
- Fully non-custodial
- Powered by the Bags API
- Designed as a reusable primitive that GotSOL and other apps can embed

Inventory, bookkeeping, and merchant dashboards remain owned by GotSOL and react to payment events emitted by the widget.

## How it works (high level)
1. Merchant configures the widget (merchant wallet or `.sol`, amount, currency)
2. Customer selects a token and receives a quote (via Bags API)
3. Customer confirms → payment executes → receipt is shown (tx signature + details)

## Features (MVP)
- Merchant config panel (amount, merchant, currency, theme)
- Checkout link generation + QR code
- Receipt page with transaction signature and details
- SNS `.sol` resolution (mock or real, depending on environment)
- Live Bags API integration for swap quoting
- Execution mocked for demo safety

## 🏗️ Project Structure

```
bagspay/
├─ apps/
│  └─ demo/              # Hackathon demo site for judges
├─ packages/
│  └─ widget/            # Embeddable checkout widget
├─ lib/
│  ├─ bagsApi.ts         # Bags API client
│  ├─ sns.ts             # .sol domain resolution
│  └─ types.ts           # Shared type definitions
└─ README.md
```

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: Solana Wallet Adapter
- **Network**: Solana (Mainnet/Devnet)
- **Build**: Turborepo (Monorepo)

## Local Development

### Requirements
- Node.js 18+ (or the version you are using locally)

### Install
```bash
npm install
```

### Start Development Servers

Start both demo and widget:
```bash
npm run dev
```

Or start individually:
```bash
# Start demo (port 3000)
npm run dev:demo

# Start widget (port 3001)
npm run dev:widget
```

### Environment Variables

Create `.env.local` files in each app/package:

**packages/widget/.env.local:**
```env
NEXT_PUBLIC_BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1
NEXT_PUBLIC_WIDGET_URL=http://localhost:3001
BAGS_API_KEY=your-api-key-here
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

**apps/demo/.env.local:**
```env
NEXT_PUBLIC_BAGS_API_BASE_URL=https://public-api-v2.bags.fm/api/v1
BAGS_API_KEY=your-api-key-here
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

> **Note**: Get your API key from [dev.bags.fm](https://dev.bags.fm). Rate limit: 1,000 requests per hour per user.

> **Security Note**: `BAGS_API_KEY` is server-side only and is never exposed to the client.  
> Client-side calls proxy through the demo app where required.

> **Note**: For the hackathon demo, mock APIs are used. Replace with real Bags API endpoints when deploying to production.

## 🔌 Integration

### Option 1: Embed Script (Planned)

> The embed script interface is defined as part of the widget spec and will be finalized post-hackathon.

Add the embed script to your HTML:

```html
<script src="https://widget.bagspay.com/embed.js"></script>
<div id="bagspay-checkout"></div>
<script>
  BagsPay.init({
    merchant: 'your-merchant.sol',  // or wallet address
    amount: 100,
    currency: 'USDC',
    theme: 'light',
    onSuccess: (receiptId, signature) => {
      console.log('Payment successful:', receiptId, signature);
      // Handle success
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      // Handle error
    }
  });
</script>
```

### Option 2: Direct Component Import

If you're using React/Next.js:

```tsx
import { WalletContextProvider } from '@bagspay/widget/lib/wallet-provider'
import CheckoutWidget from '@bagspay/widget/components/CheckoutWidget'

function MyPage() {
  return (
    <WalletContextProvider>
      <CheckoutWidget
        merchant="your-merchant.sol"
        amount={100}
        currency="USDC"
        theme="light"
        onSuccess={(receiptId, sig) => console.log('Success:', receiptId, sig)}
        onError={(err) => console.error('Error:', err)}
      />
    </WalletContextProvider>
  )
}
```

## 📡 Bags API Integration

The widget uses the Bags API for:
- Fetching available Bags tokens
- Getting token prices
- Creating payment requests
- Verifying transactions

### API Configuration

Update the API base URL in `lib/bagsApi.ts` or via environment variables.

## 🌐 SNS Domain Resolution

The `lib/sns.ts` module provides utilities for resolving .sol domain names:

```typescript
import { resolveSolDomain, resolveAddress } from '@/lib/sns'

// Resolve a .sol domain
const address = await resolveSolDomain('merchant.sol', connection)

// Resolve either a domain or address
const resolved = await resolveAddress('merchant.sol', connection)
```

## 🎨 Customization

### Styling

Customize colors in `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      }
    }
  }
}
```

## 🧪 Testing

- **Demo App**: http://localhost:3000 - Full demo site for hackathon judges
- **Widget**: http://localhost:3001 - Standalone widget
- **Embed Page**: http://localhost:3001/embed - Embeddable version

### Demo Flow
1. Visit http://localhost:3000
2. Click "Launch Demo" to see the interactive demo
3. Configure merchant settings (amount, merchant address, currency)
4. Generate checkout link and QR code
5. Test the full payment flow with mock tokens
6. View receipt page with transaction details

## 📝 Scripts

- `npm run dev` - Start all apps in development
- `npm run dev:widget` - Start widget only
- `npm run dev:demo` - Start demo only
- `npm run build` - Build all apps
- `npm run lint` - Lint all packages
- `npm run clean` - Clean build artifacts

## 🔒 Security

- **Non-Custodial**: Private keys never leave the user's wallet
- **Direct Transactions**: Payments go directly from user to merchant
- **Transaction Verification**: All payments are verified via Bags API
- **HTTPS Only**: Widget should only be served over HTTPS in production

## 🚀 Deployment

This project is configured for deployment on Vercel with optimizations enabled:

- **Parallel Builds**: Configured via `vercel.json` and Turborepo for simultaneous deployments
- **Build Optimization**: Turbo caching enabled for faster builds
- **Version Syncing**: Automatic version synchronization between frontend and backend via `NEXT_PUBLIC_APP_VERSION`
- **Monorepo Support**: Each app has its own `vercel.json` configuration

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions and Vercel recommendations.

## 📄 License

MIT

## 🤝 Contributing

This is a hackathon project for the Bags Hackathon. Contributions welcome!

---

Built with ❤️ for the Bags Hackathon

Status: Hackathon MVP / Demo. Some flows may be mocked while APIs and partner configurations are finalized.
