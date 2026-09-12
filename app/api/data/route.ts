import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '100';
  
  return NextResponse.json({
    status: 'success',
    data: [],
    meta: {
      limit: parseInt(limit, 10),
      timestamp: Date.now()
    }
  });
}
