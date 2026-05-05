import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { JobStatus, JobResult } from "@/lib/api"

export interface Job {
  job_id: string
  name: string
  filename: string
  status: JobStatus
  request_date: string
  language: string | null
  result?: JobResult
  error?: string
  queue_position?: number
}

interface JobsState {
  jobs: Job[]
  addJob: (job: Job) => void
  updateJob: (id: string, patch: Partial<Job>) => void
  removeJob: (id: string) => void
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set) => ({
      jobs: [],

      addJob: (job) =>
        set((state) => ({ jobs: [job, ...state.jobs] })),

      updateJob: (id, patch) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.job_id === id ? { ...j, ...patch } : j
          ),
        })),

      removeJob: (id) =>
        set((state) => ({
          jobs: state.jobs.filter((j) => j.job_id !== id),
        })),
    }),
    {
      name: "whisper-jobs-v1",
      partialize: (state) => ({ jobs: state.jobs }),
    }
  )
)
