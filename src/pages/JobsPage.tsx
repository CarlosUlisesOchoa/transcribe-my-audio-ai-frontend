import { Link } from "react-router-dom"
import { FaDownload, FaTimes } from "react-icons/fa"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/StatusBadge"
import { useJobsStore } from "@/store/jobs"
import { saveTextFile } from "@/lib/download"

const fmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
  timeStyle: "short",
})

export default function JobsPage() {
  const jobs = useJobsStore((s) => s.jobs)
  const removeJob = useJobsStore((s) => s.removeJob)

  const sorted = [...jobs].sort(
    (a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime()
  )

  if (sorted.length === 0) {
    return (
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-muted-foreground">No transcriptions yet.</p>
            <Link
              to="/upload"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Upload your first audio file →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Transcription Jobs</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((job) => {
              const tooltip =
                job.status === "failed"
                  ? job.error
                  : job.status === "queued" && job.queue_position != null
                    ? `Position #${job.queue_position}`
                    : undefined

              return (
                <TableRow key={job.job_id}>
                  <TableCell className="font-medium">{job.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} tooltip={tooltip} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmt.format(new Date(job.request_date))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={job.status !== "completed"}
                            title="Download transcript"
                          >
                            <FaDownload />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!job.result) return
                              saveTextFile(`${job.name}.txt`, job.result.formatted)
                              toast.success("Downloaded formatted transcript")
                            }}
                          >
                            Download formatted (.txt)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              if (!job.result) return
                              saveTextFile(`${job.name}-plain.txt`, job.result.text)
                              toast.success("Downloaded plain transcript")
                            }}
                          >
                            Download plain (.txt)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Remove from list"
                        onClick={() => removeJob(job.job_id)}
                      >
                        <FaTimes />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
