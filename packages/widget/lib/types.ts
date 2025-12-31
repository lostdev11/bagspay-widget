/**
 * Shared type definitions for BagsPay
 */

export interface BagsToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price?: number;
  logoURI?: string;
}

export interface PaymentRequest {
  amount: number;
  currency?: 'USDC' | 'SOL' | string;
  merchantId: string;
  orderId?: string;
  callbackUrl?: string;
}

export interface PaymentResponse {
  paymentId: string;
  tokenAddress: string;
  amount: number;
  recipientAddress: string;
  transactionSignature?: string;
}

export interface BagsPayWidgetProps {
  merchant: string; // wallet address or .sol domain
  amount: number;
  currency?: 'USDC' | 'SOL';
  theme?: 'light' | 'dark';
  orderId?: string;
  onSuccess?: (txSignature: string) => void;
  onError?: (error: Error) => void;
}

export interface BagsPayConfig {
  merchant: string; // wallet address or .sol domain
  amount: number;
  currency?: 'USDC' | 'SOL';
  theme?: 'light' | 'dark';
  orderId?: string;
  widgetUrl?: string;
  onSuccess?: (txSignature: string) => void;
  onError?: (error: Error) => void;
}

export interface BagsPayInstance {
  init: (config: BagsPayConfig) => {
    destroy: () => void
  } | void
  destroy: () => void
}

declare global {
  interface Window {
    BagsPay?: BagsPayInstance
  }
}

export {}

