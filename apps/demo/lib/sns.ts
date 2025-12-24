/**
 * Solana Name Service (SNS) resolver - MOCK IMPLEMENTATION
 * 
 * TODO: When integrating real SNS, replace with actual resolution service:
 * - Use @bonfida/spl-name-service or similar
 * - Connect to Solana RPC for real resolution
 * - Handle errors for invalid domains
 */

/**
 * Checks if a string is a .sol domain
 */
export function isValidSolDomain(input: string): boolean {
  return input.endsWith('.sol') && input.length > 4;
}

/**
 * Resolves a .sol domain to a wallet address (MOCK)
 * 
 * For demo purposes, returns a predictable mock address.
 * Real implementation should query Solana blockchain.
 * 
 * @param domain - The .sol domain (e.g., "merchant.sol")
 * @returns Mock wallet address
 */
export async function resolveSolDomain(domain: string): Promise<string> {
  // Mock implementation: generate a deterministic address based on domain
  // In production, this would query the Solana blockchain
  if (!isValidSolDomain(domain)) {
    throw new Error(`Invalid .sol domain: ${domain}`);
  }

  // Simple mock: create a fake address based on domain hash
  const hash = domain.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const mockAddress = `So1${hash.toString().padStart(40, '0')}`.substring(0, 44);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return mockAddress;
}

/**
 * Resolves either a .sol domain or wallet address
 * 
 * @param input - Either a .sol domain or wallet address
 * @returns Wallet address
 */
export async function resolveAddress(input: string): Promise<string> {
  if (isValidSolDomain(input)) {
    return resolveSolDomain(input);
  }
  
  // Assume it's already a wallet address (basic validation)
  if (input.length >= 32 && input.length <= 44) {
    return input;
  }
  
  throw new Error(`Invalid address or domain: ${input}`);
}

