/**
 * Mock Bags API implementation
 * 
 * TODO: Replace this with real Bags API integration:
 * 1. Import actual API client/sdk from Bags
 * 2. Replace getQuote() with real API call to Bags quote endpoint
 * 3. Replace executePayment() with real API call to Bags swap/execute endpoint
 * 4. Handle real errors and edge cases
 * 5. Use actual token prices from Bags
 */

import type { BagsToken, QuoteResponse, PaymentRequest, PaymentResponse } from './types';

// Mock list of Bags tokens for demo
export const MOCK_BAGS_TOKENS: BagsToken[] = [
  {
    address: 'BAGSoL11111111111111111111111111111111111111',
    symbol: 'BAGS',
    name: 'Bags Protocol Token',
    decimals: 9,
    price: 0.05, // $0.05 per token
  },
  {
    address: 'MOCHI11111111111111111111111111111111111111',
    symbol: 'MOCHI',
    name: 'Mochi Meme Coin',
    decimals: 9,
    price: 0.0001,
  },
  {
    address: 'BONK111111111111111111111111111111111111111',
    symbol: 'BONK',
    name: 'Bonk Inu',
    decimals: 5,
    price: 0.00002,
  },
  {
    address: 'POPCAT1111111111111111111111111111111111111',
    symbol: 'POPCAT',
    name: 'Popcat',
    decimals: 9,
    price: 0.0005,
  },
  {
    address: 'WIF1111111111111111111111111111111111111111',
    symbol: 'WIF',
    name: 'dogwifhat',
    decimals: 9,
    price: 2.5,
  },
];

// Mock prices for stablecoins
const MOCK_PRICES: Record<string, number> = {
  USDC: 1.0,
  SOL: 150.0, // Mock SOL price
};

/**
 * Gets a quote for swapping tokens via Bags API (MOCK)
 * 
 * @param params - Quote parameters
 * @returns Mock quote response
 */
export async function mockGetQuote(params: {
  tokenIn: string;
  amount: number;
  currency: 'USDC' | 'SOL';
}): Promise<QuoteResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const token = MOCK_BAGS_TOKENS.find(t => t.address === params.tokenIn);
  if (!token || !token.price) {
    throw new Error(`Token not found: ${params.tokenIn}`);
  }

  const currencyPrice = MOCK_PRICES[params.currency] || 1;
  const amountInCurrency = params.amount * currencyPrice;
  const amountOut = amountInCurrency / token.price;

  // Mock slippage (0.5% to 2%)
  const slippage = 0.5 + Math.random() * 1.5;
  
  // Mock price impact (0.1% to 1%)
  const priceImpact = 0.1 + Math.random() * 0.9;

  // Mock route (direct swap for simplicity)
  const route = [params.tokenIn, 'SOL'];
  
  // Mock fee (0.3% typical DEX fee)
  const fee = amountInCurrency * 0.003;

  return {
    tokenIn: params.tokenIn,
    tokenOut: params.currency === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' : 'So11111111111111111111111111111111111111112',
    amountIn: amountOut,
    amountOut: params.amount,
    priceImpact,
    route,
    slippage,
    fee,
  };
}

// Export as getQuote for backward compatibility
export const getQuote = mockGetQuote;

/**
 * Executes a payment via Bags API (MOCK)
 * 
 * @param params - Payment parameters
 * @returns Mock payment response with receipt ID and transaction signature
 */
export async function executePayment(params: {
  tokenIn: string;
  amount: number;
  currency: 'USDC' | 'SOL';
  merchant: string;
  orderId?: string;
}): Promise<PaymentResponse> {
  // Simulate API delay (payment processing)
  await new Promise(resolve => setTimeout(resolve, 1500));

  const token = MOCK_BAGS_TOKENS.find(t => t.address === params.tokenIn);
  if (!token) {
    throw new Error(`Token not found: ${params.tokenIn}`);
  }

  // Generate mock transaction signature (base58-like string)
  const generateMockSignature = (): string => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 88; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate mock receipt ID
  const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const txSignature = generateMockSignature();

  return {
    receiptId,
    txSignature,
    merchant: params.merchant,
    amount: params.amount,
    currency: params.currency,
    tokenUsed: token,
    timestamp: Date.now(),
  };
}

/**
 * Gets available Bags tokens
 */
export function getTokens(): BagsToken[] {
  return MOCK_BAGS_TOKENS;
}

