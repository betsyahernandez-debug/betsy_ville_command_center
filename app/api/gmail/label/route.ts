import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAuth, ALL_COLLAB_LABELS } from '../route'

export async function POST(request: Request) {
  try {
    const { threadId, bucket } = await request.json()
    if (!threadId || !bucket) return NextResponse.json({ error: 'Missing threadId or bucket' }, { status: 400 })

    const auth = getAuth()
    const gmail = google.gmail({ version: 'v1', auth })

    // Get all label IDs
    const res = await gmail.users.labels.list({ userId: 'me' })
    const existing = res.data.labels || []
    const labelMap: Record<string, string> = {}
    for (const name of ALL_COLLAB_LABELS) {
      const found = existing.find(l => l.name === name)
      if (found?.id) labelMap[name] = found.id
    }

    const bucketToLabel: Record<string, string> = {
      'needs-reply': 'collab/needs-reply',
      'in-progress': 'collab/in-progress',
      'done':        'collab/done',
    }

    const addLabel    = labelMap[bucketToLabel[bucket]]
    const removeLabels = ALL_COLLAB_LABELS
      .filter(l => l !== bucketToLabel[bucket])
      .map(l => labelMap[l])
      .filter(Boolean)

    await gmail.users.threads.modify({
      userId: 'me',
      id: threadId,
      requestBody: {
        addLabelIds:    addLabel ? [addLabel] : [],
        removeLabelIds: removeLabels,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
