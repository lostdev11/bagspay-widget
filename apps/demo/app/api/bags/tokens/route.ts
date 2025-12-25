import { NextResponse } from 'next/server'

const BAGS_API_BASE = process.env.NEXT_PUBLIC_BAGS_API_BASE_URL
const BAGS_API_KEY = process.env.BAGS_API_KEY

export async function GET() {
  if (!BAGS_API_BASE) {
    return NextResponse.json(
      { error: 'Bags API not configured' },
      { status: 500 }
    )
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (BAGS_API_KEY) {
      headers['x-api-key'] = BAGS_API_KEY
    }

    // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
    const apiUrl = BAGS_API_BASE.includes('/api/v1') 
      ? `${BAGS_API_BASE}/tokens`
      : `${BAGS_API_BASE}/api/v1/tokens`

    const response = await fetch(apiUrl, {
      headers,
    })

    if (!response.ok) {
      throw new Error(`Bags API error: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tokens from Bags API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

