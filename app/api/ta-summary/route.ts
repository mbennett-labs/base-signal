import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { timeframe, marketData } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const timeframeDescriptions: Record<string, string> = {
      '4h': '4-hour (short-term, intraday moves)',
      'daily': 'daily (swing trading perspective)',
      'weekly': 'weekly/monthly (macro trend, big picture)'
    };

    const prompt = `You are a professional Bitcoin technical analyst. Generate a concise, actionable TA summary for the ${timeframeDescriptions[timeframe] || timeframe} timeframe.

Current Market Data:
- Price: $${marketData.price?.toLocaleString() || 'N/A'}
- 24h Change: ${marketData.priceChange?.toFixed(2) || 'N/A'}%
- RSI: ${marketData.rsi || 'N/A'}
- Fear & Greed Index: ${marketData.fearGreed?.value || 'N/A'} (${marketData.fearGreed?.text || 'N/A'})
- BTC Dominance: ${marketData.btcDominance || 'N/A'}%
- USDT Dominance: ${marketData.usdtDominance || 'N/A'}%

Provide a ${timeframe === '4h' ? '3-4' : timeframe === 'daily' ? '4-5' : '5-6'} sentence summary that includes:
1. Current trend assessment
2. Key support/resistance levels to watch
3. What the indicators suggest
4. A brief actionable outlook (bullish/bearish/neutral bias)

Keep it professional but accessible. No fluff - traders want quick, useful insights.
Do NOT use markdown formatting, asterisks, or bullet points. Write in plain prose paragraphs.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const summary = data.content?.[0]?.text || 'Unable to generate summary';

    return NextResponse.json({ summary, timeframe });

  } catch (error) {
    console.error('TA Summary error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
