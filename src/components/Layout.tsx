import { NavLink, Outlet } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { useJobPolling } from "@/hooks/useJobPolling"
import { cn } from "@/lib/utils"
import { FaMicrophoneAlt } from "react-icons/fa"

export function Layout() {
  useJobPolling()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <FaMicrophoneAlt className="text-primary" />
            <span>Whisper Transcribe</span>
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
