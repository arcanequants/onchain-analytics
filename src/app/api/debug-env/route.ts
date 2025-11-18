import { NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET() {
  return NextResponse.json({
    hasCronSecret: !!process.env.CRON_SECRET,
    cronSecretLength: process.env.CRON_SECRET?.length || 0,
    cronSecretPreview: process.env.CRON_SECRET?.substring(0, 10) + '...',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('CRON') || k.includes('SECRET'))
  })
}
