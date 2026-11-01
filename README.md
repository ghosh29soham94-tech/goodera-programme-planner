# Goodera Programme Planner

An interview prototype for Goodera, built as an HR tool for large tech companies. A business or HR lead writes a one-paragraph brief ("half a day of our pre-sales offsite, 40 leaders, no lectures, about $120 a head") and gets a costed, purpose-led group programme. They can then take it through details, a proposal for the budget owner, and a post-event impact report.

All companies, people and nonprofits in the demo are fictional (Northwind Tech, Priya, Rahul, Meera, Saathi, Akshara, Annapurna).

## The screens

| # | Screen | What it does |
|---|---|---|
| 0 | **Access** | Asks for an access code. Codes are checked on the server; a signed, httpOnly cookie stores the role (owner or evaluator). Five wrong codes from one IP lock it for 10 minutes. |
| 1 | **Brief** | Brief text (20–600 characters), optional pickers (group size, seniority, location, date, budget, cause), and 3 example briefs. "Build my programme" calls the planner. Out-of-scope briefs stay here and suggest the examples. |
| 2 | **Programme** | "What we understood" tags (assumptions shown dashed; click to edit), a timeline of 2–3 blocks with Swap, a cost panel ("1 partner instead of N vendors"), and Regenerate (costs 1 plan). Shows a callout when over budget or for very large groups. |
| 3 | **Details** | Leadership blocks: nonprofit case brief, mixed teams of about 8 across practices, and a 4-step facilitator guide. Build blocks: what's built, recipient, materials and team split. |
| 4 | **Proposal** | A template proposal for Priya: goal, agenda, outcomes, total cost, and the split between business unit and CSR-countable nonprofit spend. Approve → "Approved by Priya" → "Skip to after the event". |
| 5 | **Impact report** | Business, HR and CSR tabs computed from the plan with fixed sample rates (labelled "Sample results"), a printable impact card, and "Start a new plan". |

Screenshots (placeholders, add your own to `docs/screenshots/`):

| | |
|---|---|
| ![Access](docs/screenshots/0-access.png) | ![Brief](docs/screenshots/1-brief.png) |
| ![Programme](docs/screenshots/2-programme.png) | ![Details](docs/screenshots/3-details.png) |
| ![Proposal](docs/screenshots/4-proposal.png) | ![Impact](docs/screenshots/5-impact.png) |

There's a progress bar on every screen. Back (in-app or the browser's) works everywhere, and state is kept in `sessionStorage`, so a refresh doesn't lose your place.

## How cost control works

Only **one route**, `POST /api/plan`, can call Claude (`claude-sonnet-5-5`). Everything else (prices, totals, swaps, teams, guides, proposal, impact) is computed in code from the catalogue in `data/demo.ts`.

Each plan request goes through these steps in order:

1. **Session check**: every `/api` route except the login needs a valid signed cookie.
2. **Input check** (zod): brief 20–600 characters, group size 5–5,000.
3. **Examples**: the 3 example briefs have pre-built plans in `data/samples.ts` and never call the API.
4. **Cache**: results are keyed by a SHA-256 hash of the normalised brief plus picker values. A cache hit makes no call. Regenerate deliberately skips the cache.
5. **Limits**: the evaluator role gets `EVALUATOR_PLAN_LIMIT` plans in total, and all roles share `DAILY_PLAN_LIMIT` per UTC day. Counters live in memory, plus a JSON file when `DATA_DIR` is set. A plan is counted *before* the call so parallel requests can't overspend.
6. **One call**: thinking is off, effort is low, retries are off, there's a hard 8-second timeout, and the output is constrained to a JSON schema.
7. **Validation**: the answer is parsed with zod. An unknown `catalogueId`, a missing field or a wrong type rejects the whole answer. Picker values override what the model inferred, numbers are clamped, text is clipped and times are re-scheduled. **All prices and totals are recomputed from the catalogue.**
8. **Fallback**: if the call errors, times out, is refused or fails validation, or a limit is hit, the user gets the closest sample plan (keyword match: leadership, team, onboarding, wellbeing) with a "Showing a sample plan" banner.

The header shows the evaluator how many plans they have left.

### AI contract

The model receives the brief, the picker values and the catalogue (ids, names, formats, duration, price, suitable seniority, min/max group). It returns JSON only:

```ts
{
  status: "ok" | "out_of_scope",
  title: string,           // short programme name, max 60 characters
  understood: { goal, groupSize, seniority, location, durationHours, budgetPerHead, cause, practices[] },
  assumptions: string[],   // each starts with the field name, e.g. "durationHours: ..."
  blocks: [{ catalogueId, start, reason }],
  notes: string[]
}
```

## Run locally

Requires Node 20 or later.

```bash
npm install
cp .env.example .env    # then fill in the values below
npm run dev             # http://localhost:3000
```

The app works without `ANTHROPIC_API_KEY`: examples work, and other briefs fall back to sample plans.

Production check:

```bash
npm run build && npm start
```

## Deploy on Railway

1. Push this repo to GitHub, then in Railway choose **New Project → Deploy from GitHub repo**.
2. Railway detects Next.js. The build command is `npm run build` and the start command is `npm start`. `next start` listens on `process.env.PORT`, which Railway sets.
3. Add the environment variables below under **Variables**.
4. Optional: to keep counters and the cache across restarts, add a **Volume** mounted at `/data` and set `DATA_DIR=/data`.
5. Under **Settings → Networking**, generate a domain.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI plans | Anthropic API key. Only `POST /api/plan` uses it. |
| `OWNER_CODE` | Yes | Access code for the owner role (no per-role limit). |
| `EVALUATOR_CODE` | Yes | Access code for evaluators (limited plans). |
| `SESSION_SECRET` | Yes | Long random string (32+ characters) used to sign the session cookie. |
| `EVALUATOR_PLAN_LIMIT` | No | AI plans the evaluator role can make in total. Default `5`. |
| `DAILY_PLAN_LIMIT` | No | AI plans across all roles per UTC day. Default `50`. |
| `DATA_DIR` | No | Folder for `counters.json` and `cache.json`. Memory only when unset. |

Secrets are never committed: `.env` is in `.gitignore`, and `.env.example` has blank values.

## Project layout

```
app/            page (access gate or planner), API routes: access, session, plan
components/     Planner shell, header, progress bar, screens/*
data/           demo.ts (company, people, nonprofits, catalogue, names), samples.ts (examples and fallbacks)
lib/            session, limits, cache, claude, prompt, schema (zod), programme (pricing/swap), teams, impact
```

## Built with Claude Code

This prototype was built with [Claude Code](https://claude.com/claude-code).
