/**
 * Type definitions for BagsPay Widget
 */

export interface BagsPayConfig {
  amount: number
  merchantId: string
  orderId?: string
  widgetUrl?: string
  onSuccess?: (signature: string) => void
  onError?: (error: Error) => void
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

