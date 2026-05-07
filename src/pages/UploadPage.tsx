import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { FaUpload, FaSpinner } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useJobsStore } from "@/store/jobs"
import { postTranscribe } from "@/lib/api"

const LANGUAGES = [
  { value: "", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadPage() {
  const navigate = useNavigate()
  const addJob = useJobsStore((s) => s.addJob)
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [dragging, setDragging] = useState(false)

  function handleFile(f: File | null) {
    setFile(f)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || submitting) return

    setSubmitting(true)
    try {
      const data = await postTranscribe(file, language || null)
      addJob({
        job_id: data.job_id,
        name: file.name.replace(/\.[^.]+$/, ""),
        filename: file.name,
        status: data.status,
        request_date: new Date().toISOString(),
        language: language || null,
      })
      toast.success("Job queued successfully")
      navigate("/jobs")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload Audio</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dropzone */}
            <label
              className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 cursor-pointer transition-colors
                ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            >
              <FaUpload className="text-2xl text-muted-foreground" />
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Click to select or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    MP3, WAV, M4A, OGG, FLAC…
                  </p>
                </div>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>

            {/* Language selector */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Language</label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Auto-detect" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!file || submitting}
            >
              {submitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Transcribing…
                </>
              ) : (
                <>
                  <FaUpload />
                  Transcribe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
