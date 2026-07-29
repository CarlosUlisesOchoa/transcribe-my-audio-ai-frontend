# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm**. Node **22** (`.nvmrc` + `engines`).

```bash
pnpm install
pnpm dev      # Vite dev server pinned to http://localhost:8001 (not the 5173 default)
pnpm build    # tsc -b && vite build  — the tsc -b step is the only typecheck gate
pnpm lint     # eslint .
pnpm preview
```

There is **no test framework** in this project — no test runner, no test files. Don't invent a `pnpm test`. Verification is manual/end-to-end against a live backend (see `feat-front.md` → "Verification").

To typecheck without producing a build: `pnpm exec tsc -b`.

## What this app is

A single-page frontend for a self-hosted Whisper transcription API. It is a **standalone repo**; the backend (`api.py`) lives elsewhere. Backend contract this app is written against:

- `POST /transcribe` — multipart `file`, optional `language`, optional booleans `diarize` / `align` / `enroll_unknown`, header `X-API-Key` → `{ job_id, status }`. The **Speaker diarization** toggle in `UploadPage` drives all three: ON sends `diarize=true` + `enroll_unknown=true` + `align=true` (enrolled voices tagged by name, unrecognized speakers auto-labeled `unknown-NN`, per-word alignment splits mixed segments); OFF sends `diarize=false` (plain transcription + timestamps). Omitting `diarize` lets the backend fall back to its `ENABLE_DIARIZATION` env default — the toggle always sends it explicitly so the choice is never ambiguous.
- `GET /jobs/{job_id}` — header `X-API-Key` → `{ status, filename, result?, error?, queue_position? }`
- `GET /health` — no auth
- Statuses: `queued | processing | completed | failed`

There is **no list endpoint**. The backend has no per-user job history — so the browser's localStorage *is* the job list.

## Architecture

**Job lifecycle is the whole app.** Everything else is presentation.

1. `pages/UploadPage.tsx` POSTs the file, then writes the returned `job_id` into the zustand store with a client-generated `request_date`, and navigates to `/jobs`.
2. `store/jobs.ts` — zustand + `persist` middleware, localStorage key **`whisper-jobs-v1`**, only the `jobs` array persisted. This store is the sole source of truth for what jobs exist. Removing a row is local-only; it does not call the backend.
3. `hooks/useJobPolling.ts` — mounted once in `components/Layout.tsx` so it runs on every route. Every 10s it re-fetches each non-terminal job (`status !== completed && !== failed`) and merges via `updateJob`. Fetch failures are swallowed deliberately — the next tick retries.
4. `pages/JobsPage.tsx` renders the store, sorted by `request_date` desc, and downloads results client-side via `lib/download.ts` (Blob + object URL).

Consequences worth knowing before changing things:
- The polling `useEffect` depends on the `jobs` array, so it tears down and recreates the interval on every store write. Intentional for now, but it means the 10s clock resets on each update.
- Wiping localStorage loses all job history irrecoverably — jobs cannot be re-listed from the server.
- `Layout.tsx` separately polls `/health` every 5 minutes to drive the header status dot.

**Backend field-name drift is handled in the UI, not the API layer.** `JobsPage.resolveTranscripts()` reads `result.text ?? result.transcription` and `result.formatted ?? result.transcription_with_time`. `JobResult` fields are all optional for this reason. Keep both spellings working unless the backend is confirmed unified.

**Config fails fast.** `src/config.ts` reads `VITE_API_URL` / `VITE_API_KEY` and **throws at module load** if either is missing — a missing `.env` gives a blank page with a console error, not a degraded UI. Copy `.env.example` to `.env` before `pnpm dev`.

**CORS is a backend concern.** The backend `api.py` now installs `CORSMiddleware` (default `allow_origins=*`, `allow_headers=*`), so cross-origin browser calls — including the `X-API-Key` header — work out of the box; tighten it via `CORS_ALLOW_ORIGINS` on the Python side. Any remaining CORS change means editing the Python repo, not this one.

## Conventions

- Path alias `@/*` → `./src/*`, configured in **both** `vite.config.ts` and `tsconfig.*.json`. Changing it requires editing both.
- `verbatimModuleSyntax` is on — type-only imports must use `import type { … }`.
- `strict` is **not** enabled, but `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, and `noFallthroughCasesInSwitch` are. Unused variables break the build.
- **shadcn/ui here is built on `@base-ui/react`, not Radix** (`components.json` style `base-nova`). Radix-based shadcn snippets found online will not drop in. Add components through the shadcn CLI so the configured style/registry is respected; hand-porting Radix code will break.
- Two icon sets coexist by design: application code uses `react-icons/fa`; generated `components/ui/*` use `lucide-react`. Match whichever file you're in.
- User-facing errors go through `sonner` toasts (`toast.error(...)`) at the call site — `lib/api.ts` only throws `Error` with the HTTP status and body text. There is no error boundary.
- Tailwind v4 via `@tailwindcss/vite`; there is no `tailwind.config.*`. Design tokens are CSS variables declared in `src/index.css` under `@theme inline`.

## Reference

`feat-front.md` is the original implementation plan/spec. It is mostly accurate but predates the codebase — where the two disagree, the code wins (e.g. download menu labels and result field names have since changed). `README.md` is the untouched Vite template boilerplate and carries no project-specific information.
