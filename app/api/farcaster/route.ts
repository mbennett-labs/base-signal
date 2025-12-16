import { NextResponse } from 'next/server';

interface FarcasterCast {
  id: string;
  author: string;
  authorPfp: string;
  text: string;
  timestamp: Date;
  likes: number;
  channel: string;
}

// Notable Farcaster accounts to fetch from
const FEATURED_FIDS = [
  { fid: 3, fallbackName: 'dwr.eth' },           // Dan Romero (Farcaster founder)
  { fid: 5650, fallbackName: 'vitalik.eth' },    // Vitalik Buterin
  { fid: 99, fallbackName: 'jessepollak' },      // Jesse Pollak (Base)
  { fid: 680, fallbackName: 'linda' },           // Linda Xie
  { fid: 2433, fallbackName: 'balajis.eth' },    // Balaji
  { fid: 12, fallbackName: 'woj.eth' },          // Woj
  { fid: 7143, fallbackName: 'seneca' },         // Seneca (active crypto poster)
  { fid: 239, fallbackName: 'ted' },             // Ted (Farcaster team)
  { fid: 576, fallbackName: 'nonlinear.eth' },   // Nonlinear
  { fid: 1317, fallbackName: 'cassie' },         // Cassie
  { fid: 194, fallbackName: 'cameron' },         // Cameron (Warpcast)
  { fid: 617, fallbackName: 'ace' },             // Ace
  { fid: 2904, fallbackName: 'july' },           // July
  { fid: 4167, fallbackName: 'pinata' },         // Pinata
  { fid: 7732, fallbackName: 'base' },           // Base official
];

export async function GET() {
  try {
    const allCasts: FarcasterCast[] = [];

    for (const { fid, fallbackName } of FEATURED_FIDS) {
      try {
        // Fetch user data first to get username
        let username = fallbackName;
        let pfpUrl = '';
        
        try {
          const userResponse = await fetch(
            `https://hub.pinata.cloud/v1/userDataByFid?fid=${fid}`,
            { next: { revalidate: 300 } } // Cache for 5 minutes
          );
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            if (userData?.messages) {
              for (const msg of userData.messages) {
                const type = msg.data?.userDataBody?.type;
                const value = msg.data?.userDataBody?.value;
                if (type === 'USER_DATA_TYPE_USERNAME' && value) {
                  username = value;
                }
                if (type === 'USER_DATA_TYPE_PFP' && value) {
                  pfpUrl = value;
                }
              }
            }
          }
        } catch (userErr) {
          console.log(`Could not fetch user data for FID ${fid}`);
        }

        // Fetch casts
        const castsResponse = await fetch(
          `https://hub.pinata.cloud/v1/castsByFid?fid=${fid}&pageSize=3&reverse=true`,
          { next: { revalidate: 60 } } // Cache for 1 minute
        );

        if (castsResponse.ok) {
          const castsData = await castsResponse.json();
          
          const casts = castsData.messages
            ?.slice(0, 2)
            .filter((msg: any) => {
              const text = msg.data?.castAddBody?.text;
              // Filter out replies and very short casts
              return text && text.length > 20 && !msg.data?.castAddBody?.parentCastId;
            })
            .map((msg: any, index: number) => ({
              id: `${fid}_${index}_${Date.now()}`,
              author: username,
              authorPfp: pfpUrl,
              text: msg.data?.castAddBody?.text?.slice(0, 280) || '',
              timestamp: new Date(msg.data?.timestamp ? msg.data.timestamp * 1000 : Date.now()),
              likes: Math.floor(Math.random() * 200) + 20, // Simulated since Hub doesn't provide this
              channel: 'crypto',
            })) || [];

          allCasts.push(...casts);
        }
      } catch (fidErr) {
        console.log(`Failed to fetch FID ${fid}`);
      }
    }

    // Sort by timestamp (newest first) and limit
    const sortedCasts = allCasts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);

    // If we got some casts, return them
    if (sortedCasts.length > 0) {
      return NextResponse.json({ casts: sortedCasts, source: 'live' });
    }

    // Fallback to curated content if all fetches failed
    const fallbackCasts: FarcasterCast[] = [
      { id: '1', author: 'dwr.eth', authorPfp: '', text: 'Building the decentralized social network. Farcaster is growing every day. The future of social is onchain.', timestamp: new Date(Date.now() - 1000 * 60 * 30), likes: 342, channel: 'farcaster' },
      { id: '2', author: 'vitalik.eth', authorPfp: '', text: 'Excited about the progress on L2 scaling. Base and other rollups are shipping real solutions for users.', timestamp: new Date(Date.now() - 1000 * 60 * 60), likes: 891, channel: 'ethereum' },
      { id: '3', author: 'jessepollak', authorPfp: '', text: 'Base is for everyone. Keep building, keep shipping. The onchain economy is just getting started.', timestamp: new Date(Date.now() - 1000 * 60 * 90), likes: 567, channel: 'base' },
      { id: '4', author: 'linda', authorPfp: '', text: 'The best crypto products are the ones that make complex things simple. Focus on UX.', timestamp: new Date(Date.now() - 1000 * 60 * 120), likes: 234, channel: 'crypto' },
      { id: '5', author: 'balajis.eth', authorPfp: '', text: 'Bitcoin and crypto are not just about money. They are about building parallel systems and sovereign technology.', timestamp: new Date(Date.now() - 1000 * 60 * 150), likes: 445, channel: 'bitcoin' },
    ];

    return NextResponse.json({ casts: fallbackCasts, source: 'fallback' });

  } catch (error) {
    console.error('Farcaster API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Farcaster feed' },
      { status: 500 }
    );
  }
}
