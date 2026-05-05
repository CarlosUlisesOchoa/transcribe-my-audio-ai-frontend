import { Badge } from "@/components/ui/badge"
import type { JobStatus } from "@/lib/api"
import { FaSpinner, FaCheck, FaTimes } from "react-icons/fa"

interface StatusBadgeProps {
  status: JobStatus
  tooltip?: string
}

const config: Record<
  JobStatus,
  { label: string; className: string; icon?: React.ReactNode }
> = {
  queued: {
    label: "Queued",
    className:
      "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300",
  },
  processing: {
    label: "Processing",
    className:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    icon: <FaSpinner className="animate-spin" />,
  },
  completed: {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    icon: <FaCheck />,
  },
  failed: {
    label: "Failed",
    className:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    icon: <FaTimes />,
  },
}

export function StatusBadge({ status, tooltip }: StatusBadgeProps) {
  const { label, className, icon } = config[status]
  return (
    <Badge
      title={tooltip}
      className={`inline-flex items-center gap-1 border text-xs font-medium ${className}`}
    >
      {icon}
      {label}
    </Badge>
  )
}
