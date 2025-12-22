import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { next: { revalidate: 10 } }
    );
    const data = await res.json();
    
    if (data.bitcoin) {
      return NextResponse.json({
        price: Math.round(data.bitcoin.usd),
        change: data.bitcoin.usd_24h_change || 0,
      });
    }
    
    throw new Error('No data');
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
