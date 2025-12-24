# BagsPay Deployment Guide

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
cd packages/bagspay-widget
npm run dev
```

3. Open http://localhost:3001

### Production Build

1. Build the widget:
```bash
npm run build
```

2. Start production server:
```bash
cd packages/bagspay-widget
npm start
```

## Deployment Options

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
cd packages/bagspay-widget
vercel
```

3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_BAGS_API_URL`
   - `NEXT_PUBLIC_WIDGET_URL`
   - `BAGS_API_KEY`

### Docker

1. Build Docker image:
```bash
docker build -t bagspay-widget .
```

2. Run container:
```bash
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_BAGS_API_URL=https://api.bags.fun \
  -e NEXT_PUBLIC_WIDGET_URL=https://widget.bagspay.com \
  bagspay-widget
```

### Static Export (Alternative)

For static hosting, modify `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  // ... other config
}
```

Then build:
```bash
npm run build
```

The `out` directory can be deployed to any static host.

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_BAGS_API_URL`: Bags API base URL (default: https://api.bags.fun)
- `NEXT_PUBLIC_WIDGET_URL`: Public URL of your widget (for embed script)
- `BAGS_API_KEY`: Your Bags API key (optional, for authenticated requests)

## CDN Integration

After deployment, merchants can integrate using:

```html
<script src="https://your-widget-url.com/api/embed"></script>
```

Or use a CDN:

```html
<script src="https://cdn.bagspay.com/embed.js"></script>
```

## Security Considerations

1. **HTTPS Only**: Always serve the widget over HTTPS in production
2. **CORS**: Configure CORS headers appropriately for your domain
3. **API Keys**: Never expose API keys in client-side code
4. **Origin Validation**: Validate message origins in production

## Monitoring

Consider adding:
- Error tracking (Sentry, etc.)
- Analytics
- Performance monitoring
- Transaction logging

