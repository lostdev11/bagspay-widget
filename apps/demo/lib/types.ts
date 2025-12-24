/**
 * Type definitions for BagsPay Demo
 * 
 * TODO: When integrating real Bags API, these types should align with the actual API responses
 */

export interface BagsToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price?: number;
  logoURI?: string;
}

export interface QuoteResponse {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  amountOut: number;
  priceImpact: number; // percentage
  route: string[]; // array of token addresses in the route
  slippage: number; // percentage
  fee: number;
}

export interface PaymentRequest {
  tokenIn: string;
  amount: number;
  currency: 'USDC' | 'SOL';
  merchant: string;
  orderId?: string;
}

export interface PaymentResponse {
  receiptId: string;
  txSignature: string;
  merchant: string;
  amount: number;
  currency: 'USDC' | 'SOL';
  tokenUsed: BagsToken;
  timestamp: number;
}

export interface BagsPayWidgetProps {
  merchant: string; // wallet address or .sol domain
  amount: number;
  currency?: 'USDC' | 'SOL';
  theme?: 'light' | 'dark';
  orderId?: string;
  onSuccess?: (receiptId: string, txSignature: string) => void;
  onError?: (error: Error) => void;
}

