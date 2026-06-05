import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SHEET_ID = '1J_RUPP3TZcu9nINYPDUPprrCsIheteOUOwoFul5eIJQ'

function getAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  const credentials = JSON.parse(key)
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') || 'monthly_stats'

  try {
    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    // Fetch multiple ranges in one call based on tab
    const rangeMap: Record<string, string[]> = {
      monthly_stats: ['Monthly Stats!A:Z'],
      pillars:       ['Pillars!A:Z'],
      pipeline:      ['Pipeline!A:Z'],
    }

    const ranges = rangeMap[tab] || rangeMap['monthly_stats']

    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges,
    })

    const valueRanges = res.data.valueRanges || []
    const result: Record<string, string[][]> = {}
    ranges.forEach((range, i) => {
      result[range] = (valueRanges[i]?.values as string[][]) || []
    })

    return NextResponse.json({ data: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
