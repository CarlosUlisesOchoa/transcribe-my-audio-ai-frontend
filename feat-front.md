# feat-front — Whisper Transcription Frontend (Plan)

## Context

we already started implementing this, we paused at step 4 after install lucid-react pkg.

lookup engram under "whisper-frontend/plan"

Remember package manager is "pnpm"

The backend (`api.py`) already exposes a Tailscale-only Whisper transcription API:
- `POST /transcribe` (multipart `file`, optional `language`, header `X-API-Key`) → `{ job_id, status }`
- `GET /jobs/{job_id}` (header `X-API-Key`) → `{ status, filename, result?: { formatted, text }, error?, queue_position? }`
- `GET /health` (no auth)
- Statuses: `queued` | `processing` | `completed` | `failed`

Today the only client is `curl`. Goal: a small browser SPA so the user can upload audio and track jobs visually. No DB — state lives in `localStorage` via zustand `persist`. Kept intentionally simple; complexity comes later.

The frontend is a **separate repo / standalone app** (not committed inside this Python repo). This plan is the spec for that new project.

## Stack

- **Vite** (scaffold: `npm create vite@latest whisper-front -- --template react-ts`)
- **React 19** (Vite default)
- **TypeScript**
- **react-router-dom v7** (routes `/upload`, `/jobs`)
- **zustand** (+ `persist` middleware → `localStorage`)
- **tailwindcss v4** (Vite plugin)
- **shadcn/ui** (components used: `Button`, `Input`, `Select`, `Card`, `Table`, `Badge`, `Sonner` toast, `DropdownMenu`)
- **react-icons** (e.g. `FaDownload`, `FaUpload`, `FaSpinner`, `FaCheck`, `FaTimes`)

## Configuration

`.env` (committed `.env.example`):
```
VITE_API_URL=http://whisper-api:8000
VITE_API_KEY=replace-me
```

Single tiny config module reads `import.meta.env.VITE_API_URL` and `import.meta.env.VITE_API_KEY`. Throws on startup if missing so misconfig fails fast.

## Project Structure

```
whisper-front/
├─ .env.example
├─ index.html
├─ package.json
├─ vite.config.ts
├─ tailwind.config.ts        # if v4 plugin needs it; otherwise omit
├─ components.json           # shadcn config
└─ src/
   ├─ main.tsx               # Router + Toaster providers
   ├─ App.tsx                # Layout shell + <Outlet/>
   ├─ index.css              # tailwind + shadcn tokens
   ├─ config.ts              # API_URL, API_KEY (from import.meta.env)
   ├─ lib/
   │  ├─ utils.ts            # shadcn cn()
   │  ├─ api.ts              # postTranscribe, getJob — fetch wrappers
   │  └─ download.ts         # saveTextFile(name, content)
   ├─ store/
   │  └─ jobs.ts             # zustand store + persist (jobs slice)
   ├─ hooks/
   │  └─ useJobPolling.ts    # polls non-terminal jobs every 10s
   ├─ components/
   │  ├─ Layout.tsx          # nav (Upload / Jobs links) + outlet
   │  ├─ StatusBadge.tsx     # colored badge per status
   │  └─ ui/                 # shadcn generated
   └─ pages/
      ├─ UploadPage.tsx
      └─ JobsPage.tsx
```

## State (zustand `persist`)

`store/jobs.ts`:

```ts
type JobStatus = "queued" | "processing" | "completed" | "failed";

type Job = {
  job_id: string;
  name: string;          // original filename (no extension), used for table column "name"
  filename: string;      // original filename with extension
  status: JobStatus;
  request_date: string;  // ISO timestamp set when POST succeeds
  language: string | null;
  result?: { formatted: string; text: string };
  error?: string;
  queue_position?: number;
};

type JobsState = {
  jobs: Job[];
  addJob: (j: Job) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  removeJob: (id: string) => void;
};
```

Persist key: `whisper-jobs-v1`. Only the `jobs` array is persisted.

## API Layer (`lib/api.ts`)

Two functions — no extra libs, just `fetch`:

```ts
postTranscribe(file: File, language: string | null): Promise<{ job_id: string; status: JobStatus }>
getJob(jobId: string): Promise<JobResponse>
```

Both inject header `X-API-Key: ${API_KEY}`. `postTranscribe` builds `FormData` with `file` and (if not auto) `language`. Errors surface via `toast.error` at the call site.

## Polling (`hooks/useJobPolling.ts`)

Single hook mounted in `Layout.tsx` so it runs across both pages. Logic:

- Every **10s**, find jobs whose `status !== "completed" && status !== "failed"`.
- For each, call `getJob(id)` and merge into store via `updateJob`.
- Use a single `setInterval`; clear on unmount.
- No polling if list is empty (interval still ticks but does nothing — fine for simplicity).

## Pages

### `/upload` — UploadPage

Single shadcn `Card` containing a form:

- **Dropzone-style area** (a styled `<label>` wrapping a hidden `<input type="file" accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac">`). Click to pick. Show selected filename + size. Drag-and-drop is a nice-to-have — implement with simple `onDragOver`/`onDrop` on the same label.
- **Language `Select`**: `Auto-detect` (default, value `""`), `English` (`en`), `Spanish` (`es`).
- **Button** `Transcribe` (disabled when no file or while submitting). On click:
  1. `postTranscribe(file, language || null)`.
  2. On success: `addJob({...})` with `request_date = new Date().toISOString()`, `status = "queued"`.
  3. `toast.success("Job queued")`.
  4. `navigate("/jobs")`.
  5. On failure: `toast.error(err.message)`.

### `/jobs` — JobsPage

shadcn `Table` with columns:

| name | status | request_date | actions |
|------|--------|--------------|---------|

- **name**: `job.name` (original filename without extension).
- **status**: `<StatusBadge status={job.status} />`. Colors: queued = gray, processing = blue (with spinner icon), completed = green, failed = red. Tooltip shows `error` on failed, `queue_position` on queued if present.
- **request_date**: formatted (e.g. `Intl.DateTimeFormat` with locale, short date + time). Sort table desc by this.
- **actions**:
  - `DropdownMenu` triggered by `FaDownload` icon button. Disabled unless `status === "completed"`.
    - **Download formatted (.txt)** → `saveTextFile(${name}.txt, job.result.formatted)`.
    - **Download plain (.txt)** → `saveTextFile(${name}-plain.txt, job.result.text)`.
  - `FaTimes` icon button → remove the row from the store (local only — does not call backend).

Empty state: card with message "No transcriptions yet" + link to `/upload`.

## Layout / Navigation

`Layout.tsx`: top bar with app title and two `NavLink`s (`Upload`, `Jobs`). Active link styled. Below: `<Outlet />`. `<Toaster />` from shadcn `sonner` mounted once here. `useJobPolling()` called once here so it runs regardless of route.

## Download Helper (`lib/download.ts`)

```ts
export function saveTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
```

## CORS Note (backend follow-up, NOT part of this plan)

`api.py` does not currently set CORS headers. Browser calls from a different origin will fail. After this frontend exists, a small backend change is needed: add `CORSMiddleware` allowing the frontend origin. Flagged here so it is not forgotten — implementation lives in the Python repo, not this one.

## Verification (manual, end-to-end)

1. `npm install && npm run dev` → app loads at `http://localhost:5173`.
2. Set `VITE_API_URL` to a reachable Whisper API and `VITE_API_KEY` to a valid key.
3. `/upload`: pick a small `.mp3`, leave language Auto-detect, click Transcribe → toast appears, redirect to `/jobs`, new row visible with status `queued`.
4. Within ~10s polling tick, status flips to `processing` then `completed`.
5. Click download icon → dropdown shows two options. Both save valid `.txt` files; formatted has the `===` header + `[start - end]` segments, plain does not.
6. Hard reload the browser → table still shows previous jobs (zustand persist works).
7. Delete a row → it disappears and stays gone after reload.
8. Stop the API and submit → `toast.error` with a readable message, no row added.
9. Submit a non-audio file → backend returns 400, toast shows the error.

## Out of Scope (for now)

- Auth UI for entering API key at runtime (env var is enough).
- Progress bar / file streaming UI.
- Multi-file batch upload.
- Server-side persistence — table is per-browser only.
- CORS configuration on the backend (separate task).
- Deployment / hosting of the frontend (separate task).
