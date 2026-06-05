import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const COLLAB_SUBJECTS = [
  'collaboration', 'collab', 'partnership', 'contract', 'gifting',
  'campaign', 'brand deal', 'paid partnership', 'sponsored', 'ambassador',
  'new collaboration', 'contract proposed', 'partnership opportunity',
  'creator opportunity', 'influencer',
]

// Our 3 bucket label names in Gmail
export const LABEL_NEEDS_REPLY  = 'collab/needs-reply'
export const LABEL_IN_PROGRESS  = 'collab/in-progress'
export const LABEL_DONE         = 'collab/done'
export const ALL_COLLAB_LABELS  = [LABEL_NEEDS_REPLY, LABEL_IN_PROGRESS, LABEL_DONE]

export function getAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )
  oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN })
  return oauth2Client
}

function buildQuery() {
  const subjectQueries = COLLAB_SUBJECTS.map(s => `subject:"${s}"`)
  return `(${subjectQueries.join(' OR ')}) in:inbox category:primary newer_than:90d`
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

// Ensure our 3 labels exist, return their IDs
async function ensureLabels(gmail: ReturnType<typeof google.gmail>): Promise<Record<string, string>> {
  const res = await gmail.users.labels.list({ userId: 'me' })
  const existing = res.data.labels || []
  const labelMap: Record<string, string> = {}

  for (const name of ALL_COLLAB_LABELS) {
    const found = existing.find(l => l.name === name)
    if (found?.id) {
      labelMap[name] = found.id
    } else {
      const created = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
        },
      })
      if (created.data.id) labelMap[name] = created.data.id
    }
  }
  return labelMap
}

export async function GET() {
  try {
    const auth = getAuth()
    const gmail = google.gmail({ version: 'v1', auth })
    const labelMap = await ensureLabels(gmail)

    const listRes = await gmail.users.threads.list({
      userId: 'me',
      q: buildQuery(),
      maxResults: 50,
    })

    const threads = listRes.data.threads || []

    const details = await Promise.all(
      threads.slice(0, 40).map(async (t) => {
        const thread = await gmail.users.threads.get({
          userId: 'me',
          id: t.id!,
          format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date'],
        })

        const messages = thread.data.messages || []
        const first = messages[0]
        const last  = messages[messages.length - 1]

        const getHeader = (msg: typeof first, name: string) =>
          msg?.payload?.headers?.find(h => h.name === name)?.value || ''

        const allLabelIds = messages.flatMap(m => m.labelIds || [])
        const isUnread    = allLabelIds.includes('UNREAD')
        const lastDate    = getHeader(last, 'Date')
        const days        = daysSince(lastDate)
        const messageCount = messages.length

        // Determine bucket from our labels
        let bucket: 'needs-reply' | 'in-progress' | 'done' = 'needs-reply'
        if (allLabelIds.includes(labelMap[LABEL_DONE]))        bucket = 'done'
        else if (allLabelIds.includes(labelMap[LABEL_IN_PROGRESS])) bucket = 'in-progress'
        else if (isUnread) bucket = 'needs-reply'
        else bucket = 'needs-reply' // opened but not actioned = still needs reply

        const stale = bucket === 'in-progress' && days >= 5

        return {
          threadId:     t.id,
          from:         getHeader(first, 'From'),
          subject:      getHeader(first, 'Subject'),
          date:         getHeader(first, 'Date'),
          lastDate,
          snippet:      last?.snippet || '',
          bucket,
          days,
          stale,
          messageCount,
          isUnread,
          labelIds:     allLabelIds,
        }
      })
    )

    return NextResponse.json({ threads: details, labelMap })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
