import { NextRequest, NextResponse } from 'next/server'

const BAGS_API_BASE = process.env.NEXT_PUBLIC_BAGS_API_BASE_URL
const BAGS_API_KEY = process.env.BAGS_API_KEY

export async function POST(request: NextRequest) {
  if (!BAGS_API_BASE) {
    return NextResponse.json(
      { error: 'Bags API not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { tokenIn, amount, outToken } = body

    if (!tokenIn || !amount || !outToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: tokenIn, amount, outToken' },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (BAGS_API_KEY) {
      headers['x-api-key'] = BAGS_API_KEY
    }

    // Construct full URL - if base URL already includes /api/v1, use it as-is, otherwise append
    const apiUrl = BAGS_API_BASE.includes('/api/v1') 
      ? `${BAGS_API_BASE}/quote`
      : `${BAGS_API_BASE}/api/v1/quote`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tokenIn, amount, outToken }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bags API error: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching quote from Bags API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

