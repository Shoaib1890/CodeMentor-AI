# CodeMentor AI

**Personalized DSA interview coach** — connect a LeetCode profile, diagnose topic-level weaknesses with AI, and follow a week-by-week study plan paced to a target interview date.

**Live demo:** [https://code-mentor-ai-3db2.vercel.app/](https://code-mentor-ai-3db2.vercel.app/)

---

## Overview

CodeMentor AI is a full-stack web application for software engineers preparing for coding interviews. Instead of grinding random LeetCode problems, users get a **data-driven diagnosis** of their DSA gaps and a **structured curriculum** mapped to their goal (internship, campus placement, or job switch) and deadline.

The product flow is:

1. **Onboard** — LeetCode username, preparation goal, target interview date  
2. **Sync** — live topic and difficulty stats from LeetCode GraphQL  
3. **Diagnose** — LLM + rule-based scoring across 23 canonical DSA topics  
4. **Plan** — week-by-week problem list with LeetCode URLs and completion tracking  
5. **Iterate** — re-sync stats, re-run analysis, or regenerate the plan  

---

## Features

| Area | What it does |
| --- | --- |
| **Onboarding** | 3-step setup: connect public LeetCode username, pick a goal, set a target date |
| **LeetCode sync** | Fetches solved counts, tag/topic breakdowns, difficulty mix, and streak; persists snapshots to avoid repeated scraping |
| **AI weakness analysis** | Ranks topics as critical / moderate / mild with explanations and recommended actions |
| **Study planner** | Generates a weekly roadmap with curated problems, progress %, and check-off completion |
| **Dashboard** | Overview stats, AI summary, difficulty distribution, topic heatmap, recent activity |
| **Profile** | Update username, goal, and interview date; reconnect LeetCode; delete account |
| **Auth** | Clerk when keys are configured; demo/mock mode for local use without auth |
| **Resilience** | Zod-validated LLM JSON; rule-based fallback if the model is down or returns invalid output |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) (App Router, API routes, React Server Components) |
| Language | TypeScript |
| UI | React, Tailwind CSS, Lucide icons |
| Client data | TanStack Query |
| Auth | [Clerk](https://clerk.com/) (optional; mock user fallback) |
| ORM / DB | Prisma + PostgreSQL ([Supabase](https://supabase.com/)) |
| AI | [Groq](https://groq.com/) (OpenAI-compatible fallback) |
| Validation | Zod |
| Deploy | [Vercel](https://vercel.com/) |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Next.js client │────▶│  API routes          │────▶│  LeetCode       │
│  (App Router)   │     │  (serverless)        │     │  GraphQL        │
└────────┬────────┘     └──────────┬───────────┘     └─────────────────┘
         │                         │
         │                         ├────────────────▶  Groq LLM
         │                         │                   (diagnostics + plan)
         │                         │
         │                         └────────────────▶  Prisma
         │                                            (Supabase pooler)
         ▼
    Clerk (optional)
```

**Data model (Prisma):** `User` → `LeetCodeProfile`, `TopicStats`, `WeaknessReport`, `StudyPlan` → `StudyPlanWeek` → `StudyPlanProblem`.

LLM calls run **outside** database transactions. Writes use bulk `createMany` with pre-generated UUIDs so serverless + PgBouncer/Supavisor does not time out on long-held connections.

Production DB access uses Supabase **session-mode pooler (port 5432, IPv4)** because Vercel serverless cannot reliably reach IPv6-only direct hosts.

---

## How it works

### 1. Connect LeetCode

`POST /api/leetcode/connect` pulls a public profile via LeetCode GraphQL, normalizes tag stats into 23 DSA topics, then (if goal + date exist) runs weakness detection and study-plan generation in one onboarding pass.

### 2. Weakness detection

A rule-based pre-scorer computes topic weakness from solved vs attempted ratios and difficulty mix. An LLM then produces a structured report (overall score, summary, ranked topics with severity and actions). Output is validated with Zod; invalid or missing AI output falls back to the rule-based engine so onboarding never depends on a perfect model response.

### 3. Study plan

Given remaining days, goal, and weak topics, the planner builds weekly focus areas and maps problems from a seeded catalog (`src/lib/constants/problems.json`). Users toggle completion via `PATCH /api/study-plan/problems/[problemId]/toggle`. Plans can be regenerated with `POST /api/study-plan/regenerate`.

### 4. Dashboard

`GET /api/dashboard` aggregates profile stats, topic heatmap, AI summary, and recent completed exercises for the overview page.

---

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` / `PATCH` / `DELETE` | `/api/profile` | Read, update, or delete user settings |
| `POST` | `/api/leetcode/connect` | Bind username, sync, generate first analysis + plan |
| `POST` | `/api/leetcode/sync` | Refresh live LeetCode stats |
| `GET` | `/api/dashboard` | Overview analytics |
| `GET` | `/api/analysis/latest` | Latest weakness report |
| `POST` | `/api/analysis/run` | Re-run diagnostics |
| `GET` | `/api/study-plan/current` | Current weekly plan |
| `POST` | `/api/study-plan/regenerate` | Rebuild the plan |
| `PATCH` | `/api/study-plan/problems/[id]/toggle` | Mark a problem done / undone |

---

## Engineering notes

These are the production issues this project was designed around:

- **Unreliable LLM JSON** — Zod schemas (`weaknessReportSchema`, `studyPlanSchema`) plus a deterministic fallback scorer so a malformed model reply cannot crash onboarding.
- **Serverless transaction timeouts** — AI HTTP calls were moved out of `prisma.$transaction`; week/problem inserts use bulk writes instead of sequential loops (transaction time dropped from ~4s+ to ~150ms on a Vercel ↔ Singapore DB path).
- **Vercel + Supabase IPv6** — `DATABASE_URL` points at the IPv4 session pooler; `DIRECT_URL` is used for migrations.

---

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or [Supabase](https://supabase.com/))
- Optional: Clerk, Groq API key

### Setup

```bash
git clone <your-repo-url>
cd "CodeMentor AI"
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"

# Optional — omit to run in demo/mock auth mode
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Optional — omit to use rule-based analysis only
GROQ_API_KEY=""
# OPENAI_API_KEY=""   # alternative if Groq is not set
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Clerk keys, the app uses a seeded mock user so you can walk the dashboard, analysis, and study plan locally.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | `prisma generate` + production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint |

---

## Project structure

```
src/
  app/
    page.tsx                 # Landing
    onboarding/              # Connect profile → goal → date
    (app)/                   # Authenticated shell
      dashboard/
      analysis/
      study-plan/
      profile/
    api/                     # REST handlers
  components/                # Layout + dashboard widgets
  lib/                       # Prisma, auth helpers, constants
  server/
    ai/                      # Weakness detector, study-plan generator, pre-scorer
    integrations/leetcode/   # GraphQL client + normaliser
prisma/schema.prisma
```

---

## License

Private project — built as a portfolio / interview-prep application.
