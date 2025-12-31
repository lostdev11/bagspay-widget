/**
 * Bags API Integration
 * Handles all interactions with the Bags API for memecoin payments
 * Includes mock implementation for development/hackathon use
 */

import type { BagsToken, PaymentRequest, PaymentResponse } from './types'

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const SOL_MINT = 'So11111111111111111111111111111111111111112'

export class BagsAPI {
  private baseUrl: string;
  private apiKey?: string;
  private useMock: boolean;

  constructor(baseUrl: string = 'https://api.bags.fun', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    // Use mock if no API key provided or if baseUrl is localhost
    this.useMock = !apiKey || baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  }

  /**
   * Get list of available Bags tokens
   */
  async getTokens(): Promise<BagsToken[]> {
    if (this.useMock) {
      // Mock tokens for hackathon
      return [
        {
          address: SOL_MINT,
          symbol: 'SOL',
          name: 'Solana',
          decimals: 9,
          price: 100, // Mock price
        },
        {
          address: USDC_MINT,
          symbol: 'USDC',
          name: 'USD Coin',
          decimals: 6,
          price: 1,
        },
        {
          address: 'BAGSo11111111111111111111111111111111111111',
          symbol: 'BAGS',
          name: 'Bags Token',
          decimals: 9,
          price: 0.01,
        },
      ];
    }

    try {
      // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
      const apiUrl = this.baseUrl.includes('/api/v1') 
        ? `${this.baseUrl}/tokens`
        : `${this.baseUrl}/api/v1/tokens`
      
      const response = await fetch(apiUrl, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('Error fetching Bags tokens:', error);
      // Fallback to mock tokens
      return this.getTokens(); // This will use mock
    }
  }

  /**
   * Get token price in USD (Quote)
   */
  async getTokenPrice(tokenAddress: string): Promise<number> {
    if (this.useMock) {
      // Mock prices
      if (tokenAddress === SOL_MINT) return 100;
      if (tokenAddress === USDC_MINT) return 1;
      return 0.01; // Default for BAGS or other tokens
    }

    try {
      // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
      const apiUrl = this.baseUrl.includes('/api/v1') 
        ? `${this.baseUrl}/tokens/${tokenAddress}/price`
        : `${this.baseUrl}/api/v1/tokens/${tokenAddress}/price`
      
      const response = await fetch(apiUrl, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token price: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.price || 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      // Return mock price as fallback
      if (tokenAddress === SOL_MINT) return 100;
      if (tokenAddress === USDC_MINT) return 1;
      return 0.01;
    }
  }

  /**
   * Create a payment quote/request
   */
  async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    if (this.useMock) {
      // Mock payment response
      return {
        paymentId: `payment_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        tokenAddress: request.merchantId, // Will be set by widget
        amount: request.amount,
        recipientAddress: request.merchantId,
      };
    }

    try {
      // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
      const apiUrl = this.baseUrl.includes('/api/v1') 
        ? `${this.baseUrl}/payments`
        : `${this.baseUrl}/api/v1/payments`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create payment: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment request:', error);
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(paymentId: string, signature: string): Promise<boolean> {
    if (this.useMock) {
      // Mock verification - always returns true for valid signatures
      return signature.length > 0;
    }

    try {
      // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
      const apiUrl = this.baseUrl.includes('/api/v1') 
        ? `${this.baseUrl}/payments/${paymentId}/verify`
        : `${this.baseUrl}/api/v1/payments/${paymentId}/verify`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      return data.verified === true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }
}

const BAGS_API_BASE = process.env.NEXT_PUBLIC_BAGS_API_BASE_URL!;
const BAGS_API_KEY = process.env.BAGS_API_KEY!;

export async function getBagsQuote(payload: {
  tokenIn: string;
  amount: number;
  outToken: string;
}) {
  // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
  const apiUrl = BAGS_API_BASE.includes('/api/v1') 
    ? `${BAGS_API_BASE}/quote`
    : `${BAGS_API_BASE}/api/v1/quote`

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BAGS_API_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Bags quote failed`);
  }

  return res.json();
}

