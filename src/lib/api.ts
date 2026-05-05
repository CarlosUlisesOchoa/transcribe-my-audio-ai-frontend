import { API_URL, API_KEY } from "@/config"

export type JobStatus = "queued" | "processing" | "completed" | "failed"

export interface TranscribeResponse {
  job_id: string
  status: JobStatus
}

export interface JobResult {
  formatted: string
  text: string
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
  language: string | null
): Promise<TranscribeResponse> {
  const form = new FormData()
  form.append("file", file)
  if (language) form.append("language", language)

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
