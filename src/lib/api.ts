import { API_URL, API_KEY } from "@/config"

export type JobStatus = "queued" | "processing" | "completed" | "failed"

export interface TranscribeResponse {
  job_id: string
  status: JobStatus
}

export interface JobResult {
  formatted?: string
  text?: string
  transcription_with_time?: string
  transcription?: string
}

export interface JobResponse {
  status: JobStatus
  filename: string
  result?: JobResult
  error?: string
  queue_position?: number
}

function headers(): HeadersInit {
  return { "X-API-Key": API_KEY }
}

export async function postTranscribe(
  file: File,
  language: string | null,
  diarize: boolean
): Promise<TranscribeResponse> {
  const form = new FormData()
  form.append("file", file)
  if (language) form.append("language", language)
  form.append("diarize", String(diarize))
  if (diarize) {
    // Diarization on → tag enrolled voices by name, auto-enroll + label any
    // unrecognized speaker as unknown-NN, and run word-level alignment so a
    // short interjection gets its own speaker line instead of being swallowed.
    form.append("enroll_unknown", "true")
    form.append("align", "true")
  }

  const res = await fetch(`${API_URL}/transcribe`, {
    method: "POST",
    headers: headers(),
    body: form,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Upload failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<TranscribeResponse>
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const res = await fetch(`${API_URL}/jobs/${jobId}`, {
    headers: headers(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Job fetch failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<JobResponse>
}

export interface WatcherTriggerResponse {
  status: string
  note?: string
}

// Fires the host-side watched-folder scan now instead of waiting for its hourly schedule.
// The backend can only confirm the signal was written, not that the watcher (a separate
// host process it has no visibility into) actually picked it up.
export async function triggerWatcher(): Promise<WatcherTriggerResponse> {
  const res = await fetch(`${API_URL}/watcher/trigger`, {
    method: "POST",
    headers: headers(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Watcher trigger failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<WatcherTriggerResponse>
}
