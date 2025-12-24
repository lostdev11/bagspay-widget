/**
 * Bags API Integration
 * Handles all interactions with the Bags API for memecoin payments
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
  amount: number; // Amount in USD
  currency?: string; // Default: USD
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

export class BagsAPI {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'https://api.bags.fun', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Get list of available Bags tokens
   */
  async getTokens(): Promise<BagsToken[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tokens`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.tokens || [];
    } catch (error) {
      console.error('Error fetching Bags tokens:', error);
      // Fallback to default token if API fails
      return [{
        address: 'So11111111111111111111111111111111111111112', // SOL as fallback
        symbol: 'BAGS',
        name: 'Bags Token',
        decimals: 9,
      }];
    }
  }

  /**
   * Get token price in USD
   */
  async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/tokens/${tokenAddress}/price`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch token price: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.price || 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  /**
   * Create a payment request
   */
  async createPaymentRequest(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments`, {
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
    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}/verify`, {
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
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return headers;
  }
}

