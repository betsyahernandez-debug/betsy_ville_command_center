import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const BRAND_SENDERS = [
  'functionhealth.com',
  '24hourfitness.com',
  'lemme.com',
  'tatcha.com',
  'yitty.com',
  'sephora.com',
  'oliveandjune.com',
  'kirkkara.com',
  'quince.com',
  // TSM clients — name-based matching
  'heather mcgarry',
  'jasmine valdez',
  'kajal vitha',
]

function getAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!key) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not set')
  const credentials = JSON.parse(key)
  // Gmail requires domain-wide delegation — use OAuth2 for personal Gmail
  // This route expects GMAIL_REFRESH_TOKEN + GMAIL_CLIENT_ID + GMAIL_CLIENT_SECRET
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return oauth2Client
}

function buildQuery() {
  const domainQueries = BRAND_SENDERS.filter(s => s.includes('.')).map(d => `from:*@${d}`)
  const nameQueries   = BRAND_SENDERS.filter(s => !s.includes('.')).map(n => `from:"${n}"`)
  const all = [...domainQueries, ...nameQueries]
  return `(${all.join(' OR ')}) newer_than:90d`
}

export async function GET() {
  try {
    const auth = getAuth()
    const gmail = google.gmail({ version: 'v1', auth })

    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: buildQuery(),
      maxResults: 50,
    })

    const messages = listRes.data.messages || []

    const details = await Promise.all(
      messages.slice(0, 30).map(async (msg) => {
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })
        const headers = detail.data.payload?.headers || []
        const get = (name: string) => headers.find(h => h.name === name)?.value || ''
        return {
          id: msg.id,
          from: get('From'),
          subject: get('Subject'),
          date: get('Date'),
          snippet: detail.data.snippet || '',
          threadId: detail.data.threadId,
          labelIds: detail.data.labelIds || [],
        }
      })
    )

    return NextResponse.json({ messages: details })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
