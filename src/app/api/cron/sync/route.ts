import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: Request) {
  // Vercel cron jobs send this header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const botUrl = process.env.BOT_URL
  if (!botUrl) return NextResponse.json({ error: 'BOT_URL not set' }, { status: 500 })

  const res = await fetch(`${botUrl}/sync`, {
    method: 'POST',
    headers: { 'x-sync-token': process.env.SYNC_SECRET ?? '' },
  })

  const data = await res.json()
  return NextResponse.json({ ok: res.ok, ...data })
}
