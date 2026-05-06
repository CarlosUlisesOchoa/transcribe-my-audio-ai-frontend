import { useCallback, useEffect, useState } from "react"
import { NavLink, Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { useJobPolling } from "@/hooks/useJobPolling"
import { cn } from "@/lib/utils"
import { FaMicrophoneAlt } from "react-icons/fa"
import { API_URL } from "@/config"

type ApiHealthStatus = "checking" | "healthy" | "unhealthy"

const healthTimeFmt = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
})

export function Layout() {
  useJobPolling()

  const [apiHealthStatus, setApiHealthStatus] = useState<ApiHealthStatus>("checking")
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null)

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/health`)
      setApiHealthStatus(res.ok ? "healthy" : "unhealthy")
    } catch {
      setApiHealthStatus("unhealthy")
    } finally {
      setLastCheckedAt(new Date())
    }
  }, [])

  useEffect(() => {
    const initialTimeout = window.setTimeout(() => {
      void checkHealth()
    }, 0)

    const interval = window.setInterval(() => {
      void checkHealth()
    }, 5 * 60 * 1000)

    return () => {
      window.clearTimeout(initialTimeout)
      window.clearInterval(interval)
    }
  }, [checkHealth])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <FaMicrophoneAlt className="text-primary" />
            <span>Whisper Transcribe</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                "inline-block size-2 rounded-full",
                apiHealthStatus === "healthy"
                  ? "bg-emerald-500"
                  : apiHealthStatus === "unhealthy"
                    ? "bg-red-500"
                    : "animate-pulse bg-amber-500"
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                "font-medium",
                apiHealthStatus === "healthy"
                  ? "text-emerald-700"
                  : apiHealthStatus === "unhealthy"
                    ? "text-red-700"
                    : "text-amber-700"
              )}
            >
              {apiHealthStatus === "checking"
                ? "API checking..."
                : apiHealthStatus === "healthy"
                  ? "API healthy"
                  : "API unreachable"}
            </span>
            {lastCheckedAt && (
              <span className="text-xs text-muted-foreground">
                {`(${healthTimeFmt.format(lastCheckedAt)})`}
              </span>
            )}
          </div>
          <nav className="flex gap-1">
            {[
              { to: "/upload", label: "Upload" },
              { to: "/jobs", label: "Jobs" },
            ].map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>

      <Toaster richColors position="top-right" />
    </div>
  )
}
