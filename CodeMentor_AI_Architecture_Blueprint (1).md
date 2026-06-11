# CodeMentor AI — Technical Architecture Blueprint
**Version:** 1.0 (MVP)
**Date:** June 2026
**Prepared by:** Senior Staff Engineer / Product Architect
**Target Platform:** Web (Desktop-first, Mobile-responsive)

---

## Table of Contents

1. [Product Breakdown](#1-product-breakdown)
2. [Feature Breakdown](#2-feature-breakdown)
3. [Complete Page List](#3-complete-page-list)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [AI Architecture](#8-ai-architecture)
9. [Development Roadmap](#9-development-roadmap)
10. [Team Allocation](#10-team-allocation)

---

## 1. Product Breakdown

### 1.1 Product Vision

CodeMentor AI is an AI-powered coding interview preparation platform that connects to a user's LeetCode profile and delivers personalized, data-driven study guidance. The core value proposition is AI weakness detection — answering the question: *"Which DSA topics am I weak in, and what should I study next?"*

### 1.2 User Personas

**Persona 1 — The Campus Placement Student**
- Name: Priya, 3rd year B.Tech CSE
- Goal: Get placed at a top product company in campus season
- Pain: Doesn't know which DSA topics to focus on; has solved 150+ problems randomly
- Behaviour: Studies 2-3 hours per day; uses LeetCode daily; needs a structured plan

**Persona 2 — The Internship Seeker**
- Name: Arjun, 2nd year student
- Goal: Land a SWE internship at a startup or mid-size tech company
- Pain: Has limited time (semester is ongoing); needs high-ROI study areas
- Behaviour: Solves problems on weekends; has about 60-80 submissions on LeetCode

**Persona 3 — The Job Switcher**
- Name: Kavya, 2 years SWE experience
- Goal: Switch to a FAANG-tier company; brushing up on DSA after 2 years
- Pain: Knows the theory but is inconsistent in problem-solving speed; needs to identify gaps
- Behaviour: Solves 5-10 problems per week; wants to know exactly where her weak spots are

### 1.3 User Journey

**Stage 1 — Discovery**
User finds the platform via search, social media, or referral. Lands on the landing page and reads the value proposition.

**Stage 2 — Sign Up**
User creates an account via Clerk (Google OAuth or email). Redirected to onboarding after first login.

**Stage 3 — Onboarding**
User provides their LeetCode username and selects their preparation goal (internship / placement / job switch) and a target date. System fetches their LeetCode data and runs the first AI analysis.

**Stage 4 — Dashboard**
User sees their analytics overview: total problems solved, acceptance rate, topic breakdown, overall weakness score, and a top-level AI recommendation summary.

**Stage 5 — AI Analysis**
User opens the AI Analysis page and sees a detailed topic-wise weakness breakdown. The AI explains WHY each topic is flagged as weak (low solve rate, high time-to-solve, difficulty distribution skew).

**Stage 6 — Study Plan**
User views or regenerates their personalized study plan: a week-by-week schedule with specific LeetCode problems to solve. User marks problems as done.

**Stage 7 — Progress Loop**
User syncs LeetCode data periodically (manual refresh or scheduled). As they solve problems, the weakness profile evolves and the study plan updates.

### 1.4 Core Workflows

**Workflow A — First-Time Analysis**
1. User submits LeetCode username during onboarding
2. Backend calls LeetCode GraphQL API and scrapes submission data
3. Data is normalised, stored in the database
4. AI engine runs weakness detection analysis
5. AI generates initial study plan
6. User is redirected to the dashboard with populated data

**Workflow B — Data Refresh**
1. User clicks "Sync LeetCode Data" on the dashboard
2. Backend re-fetches latest submission stats from LeetCode
3. Delta is computed and stored
4. Weakness scores are recalculated
5. Study plan is optionally regenerated (user-triggered)

**Workflow C — Study Plan Regeneration**
1. User clicks "Regenerate Plan" on the Study Plan page
2. System reads current weakness profile from the database
3. AI engine constructs a new prompt with updated weakness data + user goal + remaining days to target date
4. New study plan is generated and stored, replacing the old one

---

## 2. Feature Breakdown

### Feature 1 — Authentication

**Purpose:** Secure user account creation and session management using Clerk.

**User Flow:**
1. User clicks "Get Started" on landing page
2. Redirected to Clerk-hosted sign-up UI (Google OAuth or email)
3. After successful auth, Clerk issues a JWT session token
4. Next.js middleware validates the token on every protected route
5. On first login, user is redirected to `/onboarding`; returning users go to `/dashboard`

**Inputs:** Email + password, or Google OAuth token

**Outputs:** Clerk session cookie, user record created in the `users` table

**Edge Cases:**
- User tries to access `/dashboard` without being logged in → redirect to `/login`
- User signs up with Google but their email already exists via email/password → Clerk handles merging
- Clerk service downtime → show a graceful error page with retry option
- User deletes Clerk account → orphan records in the database must be cleaned via Clerk webhook

---

### Feature 2 — LeetCode Profile Connection

**Purpose:** Fetch and store the user's LeetCode submission history and topic performance data.

**User Flow:**
1. During onboarding, user enters their LeetCode username
2. System validates the username by hitting LeetCode's public GraphQL API
3. If valid, a full data pull is initiated (async, with a loading state shown to the user)
4. Raw data is normalised into topic-wise stats and stored in the database
5. User is shown a success confirmation and redirected to the dashboard

**Inputs:** LeetCode username (string, 3-30 characters, alphanumeric + underscore + hyphen)

**Outputs:**
- `leetcode_profiles` record created/updated
- `topic_stats` records populated (one per DSA topic)
- `submission_snapshots` record created (timestamped raw data)

**Edge Cases:**
- LeetCode username does not exist → show "Username not found" inline error
- LeetCode API is rate-limited or down → show "LeetCode is temporarily unavailable, try again later"; do NOT block onboarding progression
- User has a private LeetCode profile → show a message explaining they need to make it public; provide LeetCode help link
- User enters their own username but has 0 submissions → allow progression with a "No data yet" empty state; show study plan creation anyway
- Username already claimed by another CodeMentor user → this is a data conflict; the second user can still proceed but data will be shared (note: this is a known limitation of relying on a public username rather than OAuth)

---

### Feature 3 — Dashboard Analytics

**Purpose:** Give the user a high-level overview of their LeetCode performance at a glance.

**User Flow:**
1. User lands on `/dashboard` after login
2. Page loads with key metrics, charts, and a top-level AI summary card
3. User can see: total solved, acceptance rate, easy/medium/hard distribution, activity streak, and a topic heatmap
4. User can click on any topic card to drill into that topic
5. User can click "Sync Data" to re-fetch from LeetCode

**Inputs:** `userId` (from session), optional `refreshTrigger` (from sync button)

**Outputs:**
- Aggregate statistics (total solved, acceptance rate, streaks)
- Topic-wise solve counts and accuracy per topic
- AI summary string (cached from the last analysis)
- Last sync timestamp

**Edge Cases:**
- Data not yet fetched (new user, onboarding incomplete) → redirect to `/onboarding`
- LeetCode sync fails mid-way → show stale data with a "Sync failed — last synced X minutes ago" notice
- User has solved 0 problems → show a motivational empty state with a direct link to a recommended first problem

---

### Feature 4 — Topic Breakdown

**Purpose:** Drill into per-topic performance — solve count, accuracy, difficulty distribution, and AI weakness score.

**User Flow:**
1. User clicks a topic from the dashboard heatmap or a topic card
2. Opens the topic detail view (modal or page)
3. Shows: problems attempted, problems solved, acceptance rate for that topic, difficulty distribution (Easy/Medium/Hard bars), and the AI weakness score for this topic
4. Shows a list of problems the user has solved in this topic with their submission status

**Inputs:** `userId`, `topicSlug` (e.g., `dynamic-programming`, `graphs`)

**Outputs:**
- Topic-specific stats
- Problem list with statuses
- AI weakness score (0-100 scale, where 100 = most weak)

**Edge Cases:**
- User has 0 submissions for a topic → show it as "Not attempted" rather than "Weak"
- Topic data is stale (not synced in >7 days) → show a banner prompting a sync

---

### Feature 5 — AI Weakness Detection

**Purpose:** The core differentiator. Analyse the user's LeetCode data and produce a prioritised list of weak DSA topics with explanations.

**User Flow:**
1. User navigates to `/analysis`
2. System fetches the latest weakness analysis from the database (cached from last run)
3. User sees a ranked list of weak topics with:
   - Weakness severity (Critical / Moderate / Mild)
   - Specific reason (e.g., "You've only solved Easy problems in Trees; no Medium/Hard attempts")
   - Recommended action (e.g., "Practice 5 Medium-level Tree problems this week")
4. User can click "Re-analyse" to trigger a fresh AI analysis

**Inputs (to AI):**
- Topic-wise stats: solve count, accuracy, difficulty distribution
- User's preparation goal (internship / placement / FAANG)
- Days remaining to target date
- Topics user has flagged as "comfortable" (optional)

**Outputs:**
- Ranked list of weak topics (up to 10)
- Severity label per topic
- Human-readable explanation per topic
- Recommended action per topic

**Edge Cases:**
- AI API is down → serve the last cached analysis with a timestamp; show a "Live analysis unavailable" notice
- User has insufficient data (< 20 submissions) → AI returns a "Not enough data" message with suggestions to solve at least 5 problems per topic
- AI returns malformed response → backend must validate/parse response and fall back to a rule-based weakness score
- Re-analyse is triggered too frequently → rate limit to once per 24 hours per user; show countdown to next available run

---

### Feature 6 — AI Study Plan Generation

**Purpose:** Generate a personalised, week-by-week study plan based on the user's weakness profile, goal, and target date.

**User Flow:**
1. User navigates to `/study-plan`
2. If a plan exists, it is shown as a week-by-week schedule
3. Each week shows a focus topic and a list of 3-5 recommended LeetCode problems (with links)
4. User can mark each problem as "Done" (stored in the database)
5. User can click "Regenerate Plan" to generate a fresh plan with updated weakness data

**Inputs (to AI):**
- Weakness profile (ranked weak topics with scores)
- Target date and days remaining
- Problems already marked as "Done" (to avoid repetition)
- Preparation goal

**Outputs:**
- A structured plan: N weeks, each with a topic focus, description, and list of 3-5 specific LeetCode problems (with slugs and difficulty levels)

**Edge Cases:**
- Target date has passed → show a "Your target date has passed — update your profile" notice with an edit button
- Days remaining < 7 → generate a single intense week plan instead of a multi-week plan
- User has no weakness data yet → generate a beginner-friendly default plan and prompt them to sync their LeetCode data
- Regeneration rate-limit → once per 24 hours; show last generated timestamp

---

### Feature 7 — User Profile Management

**Purpose:** Allow users to update their preparation settings, LeetCode username, and target date.

**User Flow:**
1. User navigates to `/profile`
2. Sees their name, email (from Clerk), LeetCode username, preparation goal, and target date
3. User can edit LeetCode username (triggers a re-fetch), preparation goal, and target date
4. User can see their account-level stats: member since, total syncs performed, plans generated

**Inputs:** Updated username, goal, target date

**Outputs:** Updated records in `users` and `leetcode_profiles` tables

**Edge Cases:**
- New LeetCode username is invalid → inline validation error; do not save
- User changes target date to the past → show a validation error
- User wants to delete their account → show a confirmation modal; delete all user data and revoke Clerk session

---

## 3. Complete Page List

### 3.1 Landing Page (`/`)

**Purpose:** Convert visitors into registered users. Communicate the product's value proposition clearly.

**Components:**
- `HeroSection` — headline, subheadline, CTA button ("Start for free")
- `FeaturesGrid` — 3-4 feature cards (AI Analysis, Topic Breakdown, Study Plan, Progress Tracking)
- `HowItWorksSection` — 3-step visual flow (Connect LeetCode → Get Analysis → Follow Plan)
- `SocialProofSection` — placeholder testimonials or stats ("Join 1,000+ students")
- `CTABanner` — secondary CTA at the bottom
- `Navbar` — logo, "Sign In" link
- `Footer` — links (Privacy, Terms)

**Data Requirements:** None (fully static)

---

### 3.2 Login Page (`/login`)

**Purpose:** Allow returning users to sign in.

**Components:**
- `ClerkSignInComponent` — Clerk's hosted sign-in UI embedded via `<SignIn />`
- `Navbar` — minimal (logo only)
- Redirect logic: authenticated users → `/dashboard`

**Data Requirements:** None (Clerk handles auth)

---

### 3.3 Sign-Up Page (`/signup`)

**Purpose:** Allow new users to create an account.

**Components:**
- `ClerkSignUpComponent` — Clerk's `<SignUp />` component
- `Navbar` — minimal (logo only)
- Redirect logic: on success → `/onboarding`

**Data Requirements:** None (Clerk handles creation; a webhook fires to create the `users` record)

---

### 3.4 Onboarding Page (`/onboarding`)

**Purpose:** Collect the user's LeetCode username and preparation preferences after first sign-up.

**Components:**
- `OnboardingProgress` — step indicator (Step 1 of 3)
- `Step1_LeetCodeConnect` — username input with live validation ("Checking username…" → "✓ Found: arjun_codes | 247 solved")
- `Step2_GoalSelect` — radio card selection: Internship / Campus Placement / Job Switch
- `Step3_TargetDate` — date picker for target interview/placement date
- `SubmitButton` — triggers the async data fetch and AI analysis
- `LoadingOverlay` — shown during the LeetCode fetch + AI run ("Fetching your data…", "Analysing your profile…")

**Data Requirements:**
- Input: LeetCode username (validated against LeetCode API)
- Output: Creates `users` profile fields, `leetcode_profiles` record, triggers first analysis job

---

### 3.5 Dashboard (`/dashboard`)

**Purpose:** Central hub showing the user's performance overview and directing them to deeper analysis.

**Components:**
- `DashboardNavbar` — logo, nav links (Dashboard, Analysis, Study Plan, Profile), user avatar
- `StatsRow` — 4 metric cards: Total Solved, Acceptance Rate, Current Streak, AI Weakness Score
- `DifficultyDistribution` — horizontal bar chart (Easy / Medium / Hard solved counts)
- `TopicHeatmap` — grid of topic cards, colour-coded by weakness score (green = strong, red = weak)
- `AISummaryCard` — AI-generated one-paragraph summary of the user's current state ("Your biggest gap is Dynamic Programming…")
- `RecentActivityFeed` — last 5-10 problems solved (name, difficulty, topic, date)
- `SyncButton` — triggers LeetCode re-fetch
- `LastSyncedLabel` — "Last synced: 2 hours ago"
- `QuickActions` — buttons: "View Full Analysis", "Open Study Plan"

**Data Requirements:**
- `GET /api/dashboard` → aggregate stats, topic data, AI summary, recent activity
- Stale-while-revalidate with React Query; data freshness is 15 minutes

---

### 3.6 AI Analysis Page (`/analysis`)

**Purpose:** Display the full AI-powered weakness analysis with explanations and recommended actions.

**Components:**
- `AnalysisHeader` — last analysed timestamp, "Re-analyse" button
- `WeaknessRankingList` — ranked list of topics, each card showing:
  - Topic name and icon
  - Severity badge (Critical / Moderate / Mild)
  - AI explanation paragraph
  - Recommended action callout
  - Progress bar (weakness score 0-100)
- `TopicFilter` — filter by severity
- `EmptyState` — shown if no analysis exists yet

**Data Requirements:**
- `GET /api/analysis/latest` → weakness report (topic list with scores, explanations, recommendations)
- `POST /api/analysis/run` → triggers fresh AI analysis (rate-limited)

---

### 3.7 Study Plan Page (`/study-plan`)

**Purpose:** Display the AI-generated personalised weekly study plan with problem tracking.

**Components:**
- `StudyPlanHeader` — plan generated date, target date, days remaining counter, "Regenerate Plan" button
- `WeekAccordion` — expandable week sections, each showing:
  - Week number and focus topic
  - Topic description / why this week
  - `ProblemList` — list of 3-5 problems with:
    - Problem name (linked to LeetCode)
    - Difficulty badge
    - "Mark as Done" toggle
  - Week progress bar (X of 5 done)
- `OverallProgress` — total problems done / total in plan, percentage bar
- `EmptyState` — shown if no plan has been generated

**Data Requirements:**
- `GET /api/study-plan/current` → current plan structure with problem list and completion statuses
- `POST /api/study-plan/regenerate` → regenerates the plan (rate-limited)
- `PATCH /api/study-plan/problems/:id/toggle` → marks a problem as done/undone

---

### 3.8 Profile Page (`/profile`)

**Purpose:** Allow users to view and update their account and preparation settings.

**Components:**
- `ProfileHeader` — user avatar (from Clerk), name, email
- `AccountSection` — member since date, total syncs, plans generated
- `PreferencesForm` — editable: LeetCode username, preparation goal, target date; save button
- `DangerZone` — "Delete Account" button with confirmation modal
- `ConnectedAccounts` — shows LeetCode connection status; option to disconnect (for future)

**Data Requirements:**
- `GET /api/profile` → user fields, LeetCode connection status, account stats
- `PATCH /api/profile` → update goal, target date, LeetCode username
- `DELETE /api/profile` → delete account

---

## 4. Database Design

### 4.1 Entity Relationship Summary

```
users (1) ─────────────── (1) leetcode_profiles
  │
  ├── (1-to-many) ─────── submission_snapshots
  │
  ├── (1-to-1) ────────── weakness_reports
  │
  ├── (1-to-1) ────────── study_plans
  │     └── (1-to-many) ─ study_plan_weeks
  │           └── (1-to-many) ─ study_plan_problems
  │
  └── (1-to-many) ─────── topic_stats
```

### 4.2 Table Definitions

---

#### Table: `users`

Primary user record, linked to Clerk.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal primary key |
| `clerk_id` | `varchar(255)` | UNIQUE, NOT NULL | Clerk user ID (e.g. `user_2abc…`) |
| `email` | `varchar(320)` | UNIQUE, NOT NULL | From Clerk |
| `full_name` | `varchar(255)` | NULLABLE | From Clerk |
| `avatar_url` | `text` | NULLABLE | From Clerk |
| `preparation_goal` | `enum('internship','placement','job_switch')` | NULLABLE | Set during onboarding |
| `target_date` | `date` | NULLABLE | Interview/placement target |
| `onboarding_complete` | `boolean` | DEFAULT false | Set true after onboarding |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | Auto-updated via trigger |

**Indexes:**
- `UNIQUE INDEX` on `clerk_id`
- `UNIQUE INDEX` on `email`

---

#### Table: `leetcode_profiles`

Stores the LeetCode connection and cached aggregate stats.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, UNIQUE | One LeetCode profile per user |
| `leetcode_username` | `varchar(50)` | NOT NULL | |
| `total_solved` | `integer` | DEFAULT 0 | |
| `easy_solved` | `integer` | DEFAULT 0 | |
| `medium_solved` | `integer` | DEFAULT 0 | |
| `hard_solved` | `integer` | DEFAULT 0 | |
| `acceptance_rate` | `decimal(5,2)` | NULLABLE | Percentage, e.g. 64.50 |
| `current_streak` | `integer` | DEFAULT 0 | Days |
| `last_synced_at` | `timestamptz` | NULLABLE | |
| `is_profile_public` | `boolean` | DEFAULT true | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |

**Indexes:**
- `UNIQUE INDEX` on `user_id`
- `INDEX` on `leetcode_username`

---

#### Table: `topic_stats`

One row per DSA topic per user. This is the core analytical table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `topic_slug` | `varchar(100)` | NOT NULL | e.g. `dynamic-programming`, `graphs` |
| `topic_name` | `varchar(100)` | NOT NULL | e.g. `Dynamic Programming` |
| `total_attempted` | `integer` | DEFAULT 0 | |
| `total_solved` | `integer` | DEFAULT 0 | |
| `easy_solved` | `integer` | DEFAULT 0 | |
| `medium_solved` | `integer` | DEFAULT 0 | |
| `hard_solved` | `integer` | DEFAULT 0 | |
| `acceptance_rate` | `decimal(5,2)` | NULLABLE | Per-topic acceptance |
| `weakness_score` | `decimal(5,2)` | NULLABLE | 0-100, computed by AI |
| `last_computed_at` | `timestamptz` | NULLABLE | |
| `created_at` | `timestamptz` | DEFAULT NOW() | |
| `updated_at` | `timestamptz` | DEFAULT NOW() | |

**Indexes:**
- `UNIQUE INDEX` on `(user_id, topic_slug)`
- `INDEX` on `user_id`
- `INDEX` on `weakness_score` (for sorting)

---

#### Table: `submission_snapshots`

Raw point-in-time snapshots of LeetCode data per sync. Enables trend tracking in future versions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, NOT NULL | |
| `raw_data` | `jsonb` | NOT NULL | Full API response stored as JSONB |
| `snapshot_date` | `timestamptz` | DEFAULT NOW() | |

**Indexes:**
- `INDEX` on `(user_id, snapshot_date DESC)`
- Retain only the last 5 snapshots per user (application-level cleanup)

---

#### Table: `weakness_reports`

One active report per user. Replaced on each re-analysis.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, UNIQUE, NOT NULL | |
| `report_data` | `jsonb` | NOT NULL | Full AI output (ranked topics, explanations, recommendations) |
| `ai_summary` | `text` | NOT NULL | One-paragraph summary for the dashboard |
| `overall_weakness_score` | `decimal(5,2)` | NULLABLE | Computed aggregate 0-100 |
| `generated_at` | `timestamptz` | DEFAULT NOW() | |
| `next_allowed_at` | `timestamptz` | NOT NULL | Rate limit: generated_at + 24h |

**Indexes:**
- `UNIQUE INDEX` on `user_id`

---

#### Table: `study_plans`

One active study plan per user.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK → users.id, UNIQUE, NOT NULL | |
| `generated_at` | `timestamptz` | DEFAULT NOW() | |
| `target_date` | `date` | NOT NULL | Copied from user.target_date at generation time |
| `total_weeks` | `integer` | NOT NULL | |
| `next_allowed_at` | `timestamptz` | NOT NULL | Rate limit: generated_at + 24h |

**Indexes:**
- `UNIQUE INDEX` on `user_id`

---

#### Table: `study_plan_weeks`

One row per week in the study plan.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `plan_id` | `uuid` | FK → study_plans.id, NOT NULL | |
| `week_number` | `integer` | NOT NULL | 1-indexed |
| `focus_topic_slug` | `varchar(100)` | NOT NULL | |
| `focus_topic_name` | `varchar(100)` | NOT NULL | |
| `week_description` | `text` | NULLABLE | AI-generated explanation for this week |

**Indexes:**
- `INDEX` on `plan_id`
- `UNIQUE INDEX` on `(plan_id, week_number)`

---

#### Table: `study_plan_problems`

Individual problems recommended within each week.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK | |
| `week_id` | `uuid` | FK → study_plan_weeks.id, NOT NULL | |
| `leetcode_slug` | `varchar(200)` | NOT NULL | e.g. `two-sum`, `climbing-stairs` |
| `problem_title` | `varchar(200)` | NOT NULL | |
| `difficulty` | `enum('easy','medium','hard')` | NOT NULL | |
| `leetcode_url` | `text` | NOT NULL | Full URL to LeetCode problem |
| `is_completed` | `boolean` | DEFAULT false | User-toggled |
| `completed_at` | `timestamptz` | NULLABLE | |
| `display_order` | `integer` | NOT NULL | Order within the week |

**Indexes:**
- `INDEX` on `week_id`
- `INDEX` on `(week_id, is_completed)`

---

### 4.3 DSA Topic Reference (Static / Seeded)

The system will recognise the following canonical LeetCode topics. These are seeded in the application layer (not a database table) and used to normalise incoming topic data:

Arrays, Strings, Linked Lists, Stacks, Queues, Trees, Binary Search Trees, Heaps, Graphs, Dynamic Programming, Greedy, Backtracking, Sorting, Binary Search, Hashing, Two Pointers, Sliding Window, Recursion, Divide and Conquer, Bit Manipulation, Math, Trie, Union Find

---

## 5. API Design

### 5.1 Base URL & Conventions

- All API routes live under `/api/`
- Authentication: Clerk session cookie validated by Next.js middleware on all `/api/*` routes (except public health checks)
- Response format: `{ success: boolean, data?: T, error?: { code: string, message: string } }`
- All timestamps returned as ISO 8601 strings
- IDs are UUIDs

### 5.2 Error Codes

| HTTP Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request payload failed schema validation |
| 401 | `UNAUTHORIZED` | No valid session; user must log in |
| 403 | `FORBIDDEN` | Authenticated but not authorised (e.g. accessing another user's data) |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource already exists (e.g. duplicate LeetCode username) |
| 422 | `LEETCODE_FETCH_ERROR` | LeetCode API returned an error or username is invalid |
| 429 | `RATE_LIMITED` | Action is rate-limited (e.g. re-analysis too frequent) |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 503 | `AI_UNAVAILABLE` | AI service is down; cached data served |

---

### 5.3 Endpoint Definitions

---

#### `POST /api/users/sync-clerk`
Called by Clerk webhook on user.created. Creates the users row.

**Request Body (from Clerk webhook):**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc...",
    "email_addresses": [{ "email_address": "priya@example.com" }],
    "first_name": "Priya",
    "last_name": "S",
    "image_url": "https://..."
  }
}
```

**Response:** `201 Created`
```json
{ "success": true, "data": { "userId": "uuid" } }
```

**Validation:** Webhook secret verified via `svix` library

---

#### `GET /api/profile`
Returns the current user's profile and LeetCode connection status.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "priya@example.com",
    "fullName": "Priya S",
    "avatarUrl": "https://...",
    "preparationGoal": "placement",
    "targetDate": "2026-10-15",
    "onboardingComplete": true,
    "leetcodeProfile": {
      "username": "priya_codes",
      "totalSolved": 247,
      "lastSyncedAt": "2026-06-07T10:00:00Z",
      "isProfilePublic": true
    },
    "accountStats": {
      "memberSince": "2026-05-01T00:00:00Z",
      "totalSyncs": 12,
      "plansGenerated": 3
    }
  }
}
```

---

#### `PATCH /api/profile`
Updates user preferences and optionally their LeetCode username.

**Request Body:**
```json
{
  "preparationGoal": "placement",
  "targetDate": "2026-10-15",
  "leetcodeUsername": "priya_codes_new"
}
```

**Validation:**
- `preparationGoal`: must be one of `internship`, `placement`, `job_switch`
- `targetDate`: must be a future date, ISO 8601 date string
- `leetcodeUsername`: 3-50 chars, alphanumeric + underscores + hyphens; will be validated against LeetCode API if changed

**Response:** `200 OK` with updated profile object

---

#### `DELETE /api/profile`
Deletes the user account and all associated data.

**Response:** `204 No Content`

---

#### `POST /api/leetcode/connect`
Called during onboarding to initiate the first LeetCode data pull.

**Request Body:**
```json
{
  "leetcodeUsername": "priya_codes"
}
```

**Validation:**
- Username format: 3-50 chars, alphanumeric + underscores + hyphens
- Username must resolve successfully against LeetCode API

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "leetcodeUsername": "priya_codes",
    "totalSolved": 247,
    "topicsFound": 18
  }
}
```

**Error cases:**
- LeetCode username not found → `422 LEETCODE_FETCH_ERROR`
- Private profile → `422 LEETCODE_FETCH_ERROR` with message "Profile is private"

---

#### `POST /api/leetcode/sync`
Triggers a re-sync of LeetCode data for the current user.

**Request Body:** Empty

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "syncedAt": "2026-06-07T12:00:00Z",
    "newProblemsSolved": 5,
    "topicsUpdated": 3
  }
}
```

---

#### `GET /api/dashboard`
Returns all data needed to render the dashboard in a single request.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalSolved": 247,
      "easySolved": 98,
      "mediumSolved": 120,
      "hardSolved": 29,
      "acceptanceRate": 64.5,
      "currentStreak": 7
    },
    "overallWeaknessScore": 62.4,
    "aiSummary": "Your strongest areas are Arrays and Strings. Your biggest gap is Dynamic Programming, where you've only attempted Easy problems...",
    "topicStats": [
      {
        "topicSlug": "dynamic-programming",
        "topicName": "Dynamic Programming",
        "totalSolved": 8,
        "weaknessScore": 89.2,
        "severityLabel": "critical"
      }
    ],
    "recentActivity": [
      {
        "problemTitle": "Climbing Stairs",
        "difficulty": "easy",
        "topicName": "Dynamic Programming",
        "solvedAt": "2026-06-06T22:00:00Z"
      }
    ],
    "lastSyncedAt": "2026-06-07T10:00:00Z"
  }
}
```

---

#### `GET /api/analysis/latest`
Returns the most recent weakness analysis report.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "generatedAt": "2026-06-07T08:00:00Z",
    "nextAllowedAt": "2026-06-08T08:00:00Z",
    "overallWeaknessScore": 62.4,
    "weakTopics": [
      {
        "rank": 1,
        "topicSlug": "dynamic-programming",
        "topicName": "Dynamic Programming",
        "weaknessScore": 89.2,
        "severity": "critical",
        "explanation": "You have only solved 8 problems in this topic, all Easy difficulty. Dynamic Programming appears in ~35% of FAANG medium/hard problems.",
        "recommendedAction": "Solve 5 Medium DP problems this week. Start with Coin Change and Longest Common Subsequence."
      }
    ]
  }
}
```

---

#### `POST /api/analysis/run`
Triggers a fresh AI weakness analysis.

**Request Body:** Empty

**Rate limit:** Once per 24 hours per user

**Response:** `200 OK` — same structure as `GET /api/analysis/latest`

**Error:** `429 RATE_LIMITED` with `nextAllowedAt` timestamp if rate limit exceeded

---

#### `GET /api/study-plan/current`
Returns the current study plan with all weeks and problems.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "planId": "uuid",
    "generatedAt": "2026-06-07T08:00:00Z",
    "nextAllowedAt": "2026-06-08T08:00:00Z",
    "targetDate": "2026-10-15",
    "daysRemaining": 130,
    "totalWeeks": 10,
    "completedProblems": 4,
    "totalProblems": 42,
    "weeks": [
      {
        "weekId": "uuid",
        "weekNumber": 1,
        "focusTopicName": "Dynamic Programming",
        "weekDescription": "This week focuses on foundational DP patterns. You have a critical gap here based on your LeetCode history.",
        "problems": [
          {
            "id": "uuid",
            "problemTitle": "Climbing Stairs",
            "difficulty": "easy",
            "leetcodeUrl": "https://leetcode.com/problems/climbing-stairs/",
            "isCompleted": true,
            "completedAt": "2026-06-06T22:00:00Z",
            "displayOrder": 1
          }
        ]
      }
    ]
  }
}
```

---

#### `POST /api/study-plan/regenerate`
Triggers AI regeneration of the study plan.

**Rate limit:** Once per 24 hours per user

**Response:** `200 OK` — same structure as `GET /api/study-plan/current`

---

#### `PATCH /api/study-plan/problems/:problemId/toggle`
Marks a problem as completed or incomplete.

**Request Body:**
```json
{ "isCompleted": true }
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isCompleted": true,
    "completedAt": "2026-06-07T14:00:00Z"
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group: unauthenticated
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                    # Route group: authenticated
│   │   ├── layout.tsx            # Authenticated shell: Navbar + Sidebar
│   │   ├── onboarding/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── analysis/page.tsx
│   │   ├── study-plan/page.tsx
│   │   └── profile/page.tsx
│   ├── api/                      # API routes (see Backend section)
│   ├── layout.tsx                # Root layout: fonts, Clerk provider, QueryClientProvider
│   ├── page.tsx                  # Landing page (/)
│   └── globals.css
│
├── components/
│   ├── ui/                       # Shadcn UI primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   └── ...
│   ├── layout/                   # Layout components
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── dashboard/                # Dashboard-specific components
│   │   ├── StatsRow.tsx
│   │   ├── DifficultyChart.tsx
│   │   ├── TopicHeatmap.tsx
│   │   ├── AISummaryCard.tsx
│   │   └── RecentActivity.tsx
│   ├── analysis/                 # Analysis-specific components
│   │   ├── WeaknessCard.tsx
│   │   ├── SeverityBadge.tsx
│   │   └── WeaknessRankingList.tsx
│   ├── study-plan/               # Study Plan components
│   │   ├── WeekAccordion.tsx
│   │   ├── ProblemItem.tsx
│   │   └── PlanProgress.tsx
│   ├── onboarding/               # Onboarding step components
│   │   ├── LeetCodeConnectStep.tsx
│   │   ├── GoalSelectStep.tsx
│   │   └── TargetDateStep.tsx
│   └── common/                   # Shared across pages
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── SyncButton.tsx
│
├── hooks/                        # Custom React hooks
│   ├── useDashboard.ts           # React Query hook for dashboard data
│   ├── useAnalysis.ts
│   ├── useStudyPlan.ts
│   ├── useProfile.ts
│   └── useLeetCodeSync.ts
│
├── lib/
│   ├── api-client.ts             # Typed fetch wrapper (uses native fetch)
│   ├── query-client.ts           # React Query client configuration
│   ├── utils.ts                  # Shared utilities (cn(), formatDate(), etc.)
│   └── constants.ts              # DSA topic list, severity labels, etc.
│
├── types/
│   ├── api.ts                    # API request/response types
│   ├── domain.ts                 # Domain model types (User, WeaknessReport, etc.)
│   └── index.ts                  # Re-exports
│
└── middleware.ts                  # Clerk auth middleware (protects /app/* routes)
```

### 6.2 Component Hierarchy

```
RootLayout (ClerkProvider + QueryClientProvider)
└── (auth) group
│   ├── /login → <SignIn /> (Clerk)
│   └── /signup → <SignUp /> (Clerk)
│
└── (app) group — AppLayout (Navbar + Sidebar)
    ├── /onboarding → OnboardingPage
    │   ├── OnboardingProgress (step indicator)
    │   ├── LeetCodeConnectStep
    │   ├── GoalSelectStep
    │   └── TargetDateStep
    │
    ├── /dashboard → DashboardPage
    │   ├── StatsRow (4 × MetricCard)
    │   ├── DifficultyChart (Shadcn BarChart or Recharts)
    │   ├── TopicHeatmap (grid of TopicCard)
    │   ├── AISummaryCard
    │   └── RecentActivity (list of ActivityItem)
    │
    ├── /analysis → AnalysisPage
    │   ├── AnalysisHeader (timestamp + re-analyse button)
    │   └── WeaknessRankingList
    │       └── WeaknessCard × N
    │           ├── SeverityBadge
    │           ├── AI explanation text
    │           └── RecommendedActionCallout
    │
    ├── /study-plan → StudyPlanPage
    │   ├── StudyPlanHeader (dates + regenerate button)
    │   ├── PlanProgress (overall completion bar)
    │   └── WeekAccordion × N
    │       └── ProblemItem × N (with toggle)
    │
    └── /profile → ProfilePage
        ├── ProfileHeader (avatar, name, email)
        ├── AccountStats
        ├── PreferencesForm
        └── DangerZone
```

### 6.3 State Management Strategy

The MVP uses **React Query (TanStack Query)** as the primary remote state manager. There is no global client-side state library (no Redux, no Zustand) — all server state lives in React Query's cache.

**Local UI state** (form inputs, accordion open/closed, modal visibility) is managed with `useState` and `useReducer` at the component level.

**Onboarding multi-step state** is managed with `useReducer` in the `OnboardingPage` component and is not persisted to the server until the user completes the final step.

**React Query Configuration:**
- `staleTime`: 5 minutes for dashboard data (re-fetch in background after 5 minutes)
- `cacheTime`: 30 minutes
- `refetchOnWindowFocus`: false (to avoid spurious LeetCode API calls)
- `retry`: 2 attempts for network failures, no retry for 4xx responses

### 6.4 API Integration Strategy

All API calls are made through a typed `api-client.ts` module that wraps the native `fetch` API. This module:
- Attaches the `Content-Type: application/json` header
- Reads Clerk's session token from the client side and attaches it as a cookie (Clerk handles this automatically via the SDK)
- Handles non-2xx responses by throwing a typed `ApiError` with the `code` and `message` from the response body
- Provides typed request/response signatures for every endpoint

Each page's data fetching logic lives in a dedicated custom hook in `/hooks/`. The hook uses `useQuery` for GET requests and `useMutation` for POST/PATCH/DELETE requests. Components receive data and mutation callbacks via these hooks and never call `fetch` directly.

---

## 7. Backend Architecture

### 7.1 Folder Structure

```
src/
└── app/
    └── api/
        ├── users/
        │   └── sync-clerk/route.ts      # Clerk webhook handler
        ├── profile/
        │   └── route.ts                  # GET, PATCH, DELETE
        ├── leetcode/
        │   ├── connect/route.ts          # POST: initial connection
        │   └── sync/route.ts             # POST: re-sync
        ├── dashboard/
        │   └── route.ts                  # GET: dashboard aggregate
        ├── analysis/
        │   ├── latest/route.ts           # GET: last report
        │   └── run/route.ts              # POST: trigger analysis
        └── study-plan/
            ├── current/route.ts          # GET: current plan
            ├── regenerate/route.ts       # POST: regenerate
            └── problems/
                └── [problemId]/
                    └── toggle/route.ts   # PATCH: mark done

src/
└── server/
    ├── services/                         # Business logic layer
    │   ├── user.service.ts
    │   ├── leetcode.service.ts
    │   ├── analysis.service.ts
    │   ├── study-plan.service.ts
    │   └── profile.service.ts
    │
    ├── repositories/                     # Database access layer (Prisma)
    │   ├── user.repository.ts
    │   ├── leetcode-profile.repository.ts
    │   ├── topic-stats.repository.ts
    │   ├── weakness-report.repository.ts
    │   └── study-plan.repository.ts
    │
    ├── ai/                               # AI integration layer
    │   ├── ai-client.ts                  # OpenAI / Groq client initialisation
    │   ├── prompts/
    │   │   ├── weakness-detection.prompt.ts
    │   │   └── study-plan-generation.prompt.ts
    │   ├── weakness-detector.ts          # Orchestrates weakness detection
    │   └── study-plan-generator.ts       # Orchestrates plan generation
    │
    ├── integrations/
    │   └── leetcode/
    │       ├── leetcode-client.ts        # GraphQL + REST calls to LeetCode
    │       ├── leetcode-normaliser.ts    # Maps raw API response to domain types
    │       └── leetcode.types.ts         # Raw API response types
    │
    ├── validation/
    │   ├── profile.schema.ts             # Zod schemas for profile endpoints
    │   ├── leetcode.schema.ts
    │   └── study-plan.schema.ts
    │
    └── lib/
        ├── prisma.ts                     # Prisma client singleton
        ├── rate-limiter.ts               # Simple DB-backed rate limiter
        └── errors.ts                     # AppError class and error codes
```

### 7.2 Layer Responsibilities

**Route Handlers (API layer)**
- Parse and validate incoming request body using Zod schemas
- Extract the authenticated user ID from Clerk session (`auth()` from `@clerk/nextjs/server`)
- Call the appropriate service function
- Format the response into the standard `{ success, data, error }` envelope
- Catch `AppError` instances and return the correct HTTP status code

**Service Layer**
- Contains all business logic and orchestration
- Does NOT interact with the database directly — calls repositories
- Does NOT call the AI directly — calls AI wrapper functions
- Enforces rate limits via the `rate-limiter` utility
- Throws typed `AppError` instances for expected failures

**Repository Layer**
- Contains all Prisma queries
- Returns typed domain objects (not raw Prisma types)
- No business logic lives here — only query composition

**Validation Layer**
- Zod schemas for all request bodies
- Schemas are shared between frontend (for form validation) and backend (for server validation) via a `/shared/schemas/` directory

**Error Handling Strategy**
- All unexpected errors caught at the route handler level
- A try-catch wrapper utility `withErrorHandler()` wraps every route handler
- `AppError` instances → formatted JSON error response
- Unknown errors → logged, returned as `500 INTERNAL_ERROR`
- No stack traces exposed in production responses

### 7.3 LeetCode Data Fetching Strategy

LeetCode does not have an official public API. Data is fetched via:

1. **Primary: LeetCode GraphQL API** — LeetCode's own front-end uses a GraphQL API at `https://leetcode.com/graphql`. The following queries are used:
   - `userPublicProfile(username)` — profile existence check, total solved, streak
   - `userProblemsSolvedByTag(username)` — topic-wise solved counts
   - `userSubmitStats(username)` — difficulty distribution

2. **No authentication required** for public profile queries. The `Referer: https://leetcode.com` and a standard browser `User-Agent` header must be included to avoid basic bot detection.

3. **Fallback:** If the GraphQL API is unavailable, the system gracefully degrades — it stores the last known data and shows a "LeetCode temporarily unavailable" message.

4. **Respect rate limits:** All LeetCode requests must include a 500ms delay between calls. Implement exponential back-off on 429 responses. Never parallelise multiple LeetCode API calls for the same user.

---

## 8. AI Architecture

### 8.1 Overview

The AI layer uses a single LLM provider (OpenAI GPT-4o or Groq Llama 3.1 70B) for two functions:
1. Weakness Detection Analysis
2. Study Plan Generation

The provider is abstracted behind an `AIClient` interface so it can be swapped without changing the calling code.

### 8.2 Weakness Detection — How It Works

**Input Construction:**
The `weakness-detector.ts` module reads the user's `topic_stats` from the database and constructs a structured data object:

```
For each of the 23 canonical DSA topics:
  - Total attempted
  - Total solved
  - Easy / Medium / Hard solved
  - Acceptance rate (%)
  - Relative volume (% of total problems that belong to this topic)

Additionally:
  - User's preparation goal (internship / placement / job switch)
  - Days remaining to target date
```

**Scoring Logic (Pre-AI, Rule-Based, deterministic):**
Before calling the AI, a rule-based pre-scorer assigns a raw weakness score to each topic using these signals:
- **Coverage score**: fewer problems solved relative to the topic's typical interview frequency → higher weakness
- **Difficulty distribution score**: if all solved problems are Easy and no Medium/Hard attempted → higher weakness
- **Accuracy score**: acceptance rate below 50% → higher weakness
- **Recency score**: no problems solved in this topic in the last 30 days → mild weakness boost

The pre-scorer produces a raw 0-100 score per topic. This is passed to the AI — it is NOT shown to the user directly.

**AI Prompt Strategy:**

The AI is given the raw scores and asked to:
1. Validate and refine the weakness ranking (it can re-order based on contextual knowledge)
2. Generate a human-readable explanation for each weak topic (2-3 sentences, specific and actionable)
3. Generate a recommended action for each topic (1-2 sentences)
4. Write an overall 2-paragraph summary for the dashboard

The prompt uses XML-structured input and instructs the model to respond with valid JSON only. The response is validated against a Zod schema before being stored.

**Fallback:** If the AI returns malformed JSON or fails, the pre-computed rule-based scores are used to generate a minimal report without AI-written explanations.

### 8.3 Study Plan Generation — How It Works

**Input Construction:**

```
- Weakness report (ordered list of weak topics with scores)
- Total days remaining to target date
- Preparation goal
- Problems already marked as "Done" in the current plan (to avoid repeating)
- List of currently "comfortable" topics (user-flagged, future feature — not in MVP but the prompt supports it)
```

**Week Calculation:**
- `totalWeeks = Math.floor(daysRemaining / 7)`
- Capped at a maximum of 16 weeks (sufficient for any preparation timeline)
- Minimum of 1 week (for last-minute cramming scenarios)

**Topic Allocation Algorithm (pre-AI, deterministic):**
Weak topics are distributed across weeks in proportion to their weakness score. The top 3 most critical topics get 2 weeks each if the total weeks allow it.

**AI Prompt Strategy:**

The AI is given the week-topic allocation and asked to:
1. For each week: write a 2-sentence description explaining why this topic is the focus this week
2. For each week: recommend exactly 3-5 specific LeetCode problems — ordered by difficulty (easy first), with the problem's LeetCode slug and title
3. Problems must be real, well-known LeetCode problems (the model is instructed to only use problems it is confident exist)

**Problem Validation:**
After the AI response, the backend validates each problem slug by checking it against a curated seed database of ~500 known LeetCode problems (stored in `/lib/constants/problems.json`). Unrecognised slugs are filtered out and replaced with known problems from the topic.

### 8.4 Prompt Engineering Principles

**System Prompt (both endpoints):**
```
You are a DSA coaching expert specialising in coding interview preparation.
You provide specific, practical, data-driven advice.
You respond ONLY with valid JSON matching the provided schema.
You never fabricate LeetCode problem names or slugs.
```

**User Prompt structure:**
```
[Task description]
[Structured user data as JSON]
[Output schema with field-by-field description]
[Hard constraints list]
```

**Constraints enforced in the prompt:**
- Explanations must reference the user's actual data (e.g. "You've solved X problems…")
- Problems must be real and from the specified topic
- Severity labels must be from the approved set: `critical`, `moderate`, `mild`
- JSON response only — no preamble, no markdown fences

**Temperature:** 0.3 (low temperature for deterministic, structured output; not 0 because slight variation in explanation wording is acceptable and desirable)

**Max tokens:** 3000 for weakness detection, 4000 for study plan generation

### 8.5 Data Flow Diagrams

**Weakness Detection Flow:**
```
Route Handler → AnalysisService.runAnalysis(userId)
  → TopicStatsRepository.findAllForUser(userId)
  → RuleBasedPreScorer.compute(topicStats)          [deterministic]
  → WeaknessDetector.detect(preScores, userContext)  [AI call]
  → ResponseValidator.validate(aiResponse)
  → WeaknessReportRepository.upsert(userId, report)
  → Return report to client
```

**Study Plan Generation Flow:**
```
Route Handler → StudyPlanService.generate(userId)
  → WeaknessReportRepository.findLatest(userId)
  → WeekAllocator.allocate(weaknessReport, daysRemaining) [deterministic]
  → StudyPlanGenerator.generate(allocation, userContext)   [AI call]
  → ProblemValidator.validateSlugs(problems)
  → StudyPlanRepository.upsert(userId, plan)
  → Return plan to client
```

---

## 9. Development Roadmap

### Phase 1 — Foundation (Week 1-2)

**Goal:** Establish the project skeleton with proper tooling, configuration, and CI.

Tasks:
- Initialise Next.js 15 project with TypeScript strict mode
- Configure Tailwind CSS and Shadcn UI (component library setup)
- Set up Prisma with Neon PostgreSQL; write the initial schema and run migrations
- Integrate Clerk for authentication (provider, middleware)
- Set up React Query with the global QueryClient
- Establish the folder structure as defined in section 6.1 and 7.1
- Set up ESLint, Prettier, Husky pre-commit hooks
- Create GitHub repository with branch protection rules
- Set up Vercel project with environment variable configuration (development + production)
- Write the `AppError` class and the `withErrorHandler` route wrapper

**Deliverables:** Running Next.js app on Vercel; empty dashboard protected by Clerk auth; DB schema deployed to Neon

---

### Phase 2 — Authentication (Week 2-3)

**Goal:** Complete auth flow including landing page and Clerk webhook integration.

Tasks:
- Build the Landing Page (all sections, fully responsive)
- Build `/login` and `/signup` pages using Clerk's `<SignIn />` and `<SignUp />` components
- Implement the Clerk webhook handler (`POST /api/users/sync-clerk`) to create user records on sign-up
- Implement Next.js middleware to protect all `(app)` routes
- Implement the post-login redirect logic (first-time → `/onboarding`, returning → `/dashboard`)
- Deploy and test the full sign-up → login → redirect flow

**Deliverables:** Complete auth flow; users can sign up via Google or email; user record is created in the DB

---

### Phase 3 — LeetCode Integration (Week 3-5)

**Goal:** Build the LeetCode data pipeline — fetching, normalising, and storing submission data.

Tasks:
- Implement `leetcode-client.ts` with the 3 required GraphQL queries
- Implement `leetcode-normaliser.ts` to map raw API responses to `topic_stats` domain types
- Implement `LeetcodeService` with `connect()` and `sync()` methods
- Build the Onboarding page (3-step flow: username input → goal selection → target date)
- Implement `POST /api/leetcode/connect` and `POST /api/leetcode/sync` endpoints
- Implement `PATCH /api/profile` for username/goal/target-date updates
- Implement `POST /api/profile` delete flow with Clerk account deletion

**Deliverables:** A user can sign up, enter their LeetCode username, and have their topic data stored in the database

---

### Phase 4 — Dashboard (Week 5-7)

**Goal:** Build the full dashboard with charts, topic heatmap, and data display.

Tasks:
- Implement `GET /api/dashboard` with the aggregate query
- Build `StatsRow`, `DifficultyChart`, `TopicHeatmap`, `RecentActivity` components
- Implement the `useDashboard` React Query hook
- Build `AISummaryCard` (shows cached AI summary from the weakness report)
- Implement `SyncButton` with optimistic UI (shows "Syncing…" while the request is in flight)
- Add skeleton loading states for all dashboard sections
- Build the empty state for users with no LeetCode data
- Build the Profile page (`GET /api/profile`, `PATCH /api/profile`)

**Deliverables:** Fully functional dashboard; users can see their LeetCode stats and sync data

---

### Phase 5 — AI Analysis (Week 7-9)

**Goal:** Build the AI weakness detection engine and the Analysis page.

Tasks:
- Set up `ai-client.ts` with OpenAI (or Groq) SDK
- Implement the rule-based pre-scorer (`rule-based-pre-scorer.ts`)
- Write the weakness detection prompt (`weakness-detection.prompt.ts`)
- Implement `WeaknessDetector.detect()` with proper error handling and fallback
- Implement `POST /api/analysis/run` with rate limiting
- Implement `GET /api/analysis/latest`
- Build the `WeaknessRankingList` and `WeaknessCard` components
- Build the Analysis page with the re-analyse button and rate limit countdown
- Test the AI output quality with 5+ different user profiles; iterate on the prompt

**Deliverables:** AI produces a ranked list of weak topics with explanations; analysis page is fully functional

---

### Phase 6 — Study Plans (Week 9-11)

**Goal:** Build the AI study plan generation engine and the Study Plan page.

Tasks:
- Write the study plan generation prompt (`study-plan-generation.prompt.ts`)
- Implement `WeekAllocator.allocate()` (deterministic, no AI needed)
- Implement `StudyPlanGenerator.generate()` with the problem validator
- Seed the `/lib/constants/problems.json` file with known LeetCode problems
- Implement `POST /api/study-plan/regenerate` with rate limiting
- Implement `GET /api/study-plan/current`
- Implement `PATCH /api/study-plan/problems/:id/toggle`
- Build the `WeekAccordion`, `ProblemItem`, `PlanProgress` components
- Build the full Study Plan page with completion tracking
- End-to-end test: onboarding → analysis → study plan → mark problems done

**Deliverables:** AI generates a personalised weekly study plan; users can track problem completion

---

### Phase 7 — Deployment & Polish (Week 11-13)

**Goal:** Production-ready deployment with monitoring, error tracking, and UX polish.

Tasks:
- Set up error tracking (Sentry or Vercel's built-in error monitoring)
- Set up uptime monitoring
- Add structured logging for all API routes (log: userId, endpoint, duration, status)
- Implement the 5-snapshot cleanup job for `submission_snapshots`
- Full cross-browser and mobile responsiveness testing
- Add meta tags (title, description, OG tags) to all pages for SEO
- Write a Privacy Policy and Terms of Service (basic, for a portfolio project)
- Configure production environment variables in Vercel
- Conduct a security review: check for exposed API keys, validate all Clerk webhook signatures, confirm all routes are properly protected
- Perform a final round of UX review and bug fixes
- Record a demo video for the portfolio

**Deliverables:** Production-deployed application; demo-ready; all known bugs resolved

---

## 10. Team Allocation

### Assumptions

- Two developers: one Frontend-focused, one Backend-focused
- Both developers are comfortable with TypeScript and the basic stack
- The Backend Developer sets up the initial project (they have the broader context)
- Pair programming sessions scheduled for: LeetCode integration (complex), AI prompt tuning, and the study plan generator

### Developer A — Backend Developer

**Core responsibilities:**
- Project scaffolding, Neon DB setup, Prisma schema management
- All API route handlers and middleware
- Service layer and repository layer
- LeetCode API integration (`leetcode-client.ts`, `leetcode-normaliser.ts`)
- AI engine (`weakness-detector.ts`, `study-plan-generator.ts`, all prompts)
- Clerk webhook handler
- Rate limiter implementation
- Error handling infrastructure
- Zod validation schemas
- Data seeding (`problems.json`)
- CI/CD pipeline configuration

**Phase ownership:**
- Phase 1: Lead (scaffolding, DB, tooling)
- Phase 2: Backend (Clerk webhook, middleware)
- Phase 3: Lead (LeetCode integration)
- Phase 4: Backend (API endpoints, DB queries)
- Phase 5: Lead (AI analysis engine)
- Phase 6: Lead (study plan engine)
- Phase 7: Lead (security review, logging, deployment)

---

### Developer B — Frontend Developer

**Core responsibilities:**
- All UI component development
- Landing page (all sections, fully responsive)
- Onboarding page (3-step flow)
- Dashboard page (all components, charts)
- Analysis page
- Study Plan page
- Profile page
- React Query hooks (`useDashboard`, `useAnalysis`, `useStudyPlan`, `useProfile`)
- `api-client.ts` typed wrapper
- Clerk `<SignIn />` and `<SignUp />` page integration
- Skeleton loading states and empty states
- Mobile responsiveness
- Shadcn UI component customisation

**Phase ownership:**
- Phase 1: Support (folder structure, Shadcn setup)
- Phase 2: Lead (landing page, auth pages, Clerk component integration)
- Phase 3: Lead (onboarding 3-step UI)
- Phase 4: Lead (full dashboard UI, charts, topic heatmap)
- Phase 5: Lead (analysis page UI)
- Phase 6: Lead (study plan page UI, problem completion tracking)
- Phase 7: Lead (UX polish, cross-browser testing, demo video)

---

### Shared Responsibilities

- Daily stand-up (15 minutes) to surface blockers
- Code review: every PR requires at least one review from the other developer
- Pair programming: LeetCode API integration, AI prompt tuning, end-to-end testing
- API contract: both developers agree on the exact request/response shape before either implements; the contract is documented in `/docs/api-contract.ts` as TypeScript types

---

### Timeline Summary

| Phase | Weeks | Dev A Focus | Dev B Focus |
|---|---|---|---|
| 1 — Foundation | 1-2 | Scaffolding, DB, Prisma | Shadcn, folder structure |
| 2 — Authentication | 2-3 | Clerk webhook, middleware | Landing page, auth pages |
| 3 — LeetCode Integration | 3-5 | LeetCode client + API routes | Onboarding UI |
| 4 — Dashboard | 5-7 | Dashboard API, DB queries | Dashboard UI, charts |
| 5 — AI Analysis | 7-9 | AI engine, analysis API | Analysis page UI |
| 6 — Study Plans | 9-11 | Plan generator, plan API | Study plan UI |
| 7 — Deployment | 11-13 | Security, logging, deploy | UX polish, testing |

**Total estimated duration:** 13 weeks for 2 developers working part-time (~20 hrs/week each), or approximately 6-7 weeks for full-time effort.

---

*End of Architecture Document — CodeMentor AI v1.0 MVP*
