# BagsPay Setup Instructions

## Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Create `.env.local` in `packages/bagspay-widget/`:
   ```bash
   cd packages/bagspay-widget
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```
   NEXT_PUBLIC_BAGS_API_URL=https://api.bags.fun
   NEXT_PUBLIC_WIDGET_URL=http://localhost:3001
   BAGS_API_KEY=your-api-key-here
   NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   - Main app: http://localhost:3001
   - Embed page: http://localhost:3001/embed

## Testing the Widget

### Option 1: Use the Built-in Demo
Navigate to http://localhost:3001 to see the widget in action.

### Option 2: Use the Example HTML
Open `example.html` in your browser (make sure the dev server is running).

### Option 3: Embed in Your Site
Add this to any HTML page:

```html
<script src="http://localhost:3001/api/embed"></script>
<div id="bagspay-checkout"></div>
<script>
  BagsPay.init({
    amount: 29.99,
    merchantId: 'your-merchant-id',
    onSuccess: (sig) => console.log('Success:', sig),
    onError: (err) => console.error('Error:', err)
  });
</script>
```

## Project Structure

```
packages/bagspay-widget/
├── app/
│   ├── api/embed/          # Embed script API route
│   ├── embed/              # Embeddable widget page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Demo page
├── components/
│   └── CheckoutWidget.tsx  # Main checkout component
├── lib/
│   ├── bags-api.ts         # Bags API client
│   └── wallet-provider.tsx # Solana wallet provider
└── types/
    └── index.ts            # TypeScript definitions
```

## Next Steps

1. **Configure Bags API**: Update the API URL and add your API key
2. **Test with Real Wallet**: Connect a Solana wallet (Phantom, Solflare)
3. **Customize Styling**: Modify `tailwind.config.ts` for your brand
4. **Deploy**: See `DEPLOYMENT.md` for deployment options

## Troubleshooting

### Wallet Not Connecting
- Make sure you have a Solana wallet extension installed (Phantom, Solflare)
- Check browser console for errors
- Verify network settings (mainnet/devnet)

### API Errors
- Verify `NEXT_PUBLIC_BAGS_API_URL` is correct
- Check API key if required
- Review network requests in browser dev tools

### Build Errors
- Ensure Node.js 18+ is installed
- Clear `.next` folder and rebuild: `npm run clean && npm run build`
- Check TypeScript errors: `npm run lint`

## Support

For issues or questions, refer to the main README.md or open an issue.

