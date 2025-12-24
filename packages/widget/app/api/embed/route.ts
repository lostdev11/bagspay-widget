import { NextResponse } from 'next/server'

export async function GET() {
  const widgetUrl = process.env.NEXT_PUBLIC_WIDGET_URL || 'http://localhost:3001'
  
  const embedScript = `
(function() {
  'use strict';
  
  if (window.BagsPay) {
    return; // Already loaded
  }

  function getWidgetUrl() {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes('api/embed')) {
        const url = new URL(src);
        return url.origin;
      }
    }
    return '${widgetUrl}';
  }

  window.BagsPay = {
    init: function(config) {
      if (!config || !config.merchant) {
        console.error('BagsPay: merchant (wallet address or .sol domain) is required');
        return;
      }

      const container = document.getElementById('bagspay-checkout') || document.body;
      const widgetUrl = config.widgetUrl || getWidgetUrl();
      
      const iframe = document.createElement('iframe');
      iframe.id = 'bagspay-iframe';
      const params = new URLSearchParams({
        amount: (config.amount || 0).toString(),
        merchant: config.merchant || '',
        currency: config.currency || 'USDC',
        theme: config.theme || 'light',
      });
      if (config.orderId) {
        params.append('orderId', config.orderId);
      }
      iframe.src = widgetUrl + '/embed?' + params.toString();
      iframe.style.width = '100%';
      iframe.style.minHeight = '500px';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.setAttribute('allowtransparency', 'true');
      
      const messageHandler = function(event) {
        if (event.data.type === 'BAGSPAY_SUCCESS' && config.onSuccess) {
          config.onSuccess(event.data.signature);
        }
        if (event.data.type === 'BAGSPAY_ERROR' && config.onError) {
          config.onError(new Error(event.data.error));
        }
      };
      
      window.addEventListener('message', messageHandler);
      iframe._bagspayHandler = messageHandler;
      container.appendChild(iframe);
      
      return {
        destroy: function() {
          window.removeEventListener('message', messageHandler);
          if (iframe && iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }
      };
    },
    
    destroy: function() {
      const iframe = document.getElementById('bagspay-iframe');
      if (iframe && iframe.parentNode) {
        if (iframe._bagspayHandler) {
          window.removeEventListener('message', iframe._bagspayHandler);
        }
        iframe.parentNode.removeChild(iframe);
      }
    }
  };
})();
  `.trim()

  return new NextResponse(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

