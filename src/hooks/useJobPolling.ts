import { useEffect } from "react"
import { useJobsStore } from "@/store/jobs"
import { getJob } from "@/lib/api"

export function useJobPolling() {
  const jobs = useJobsStore((s) => s.jobs)
  const updateJob = useJobsStore((s) => s.updateJob)

  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = jobs.filter(
        (j) => j.status !== "completed" && j.status !== "failed"
      )
      for (const job of pending) {
        try {
          const data = await getJob(job.job_id)
          updateJob(job.job_id, {
            status: data.status,
            result: data.result,
            error: data.error,
            queue_position: data.queue_position,
          })
        } catch {
          // silently skip — will retry on next tick
        }
      }
    }, 10_000)

    return () => clearInterval(interval)
  }, [jobs, updateJob])
}
