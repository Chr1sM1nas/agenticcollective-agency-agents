# Digital Fan Zone Platform – React UI

A comprehensive React + TypeScript UI for the **Digital Fan Zone Platform**: a sports fan engagement app featuring predictions, a personalised content feed, collectibles, leaderboards, and progressive identity flows.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Utility-first styling |
| Redux Toolkit | Global state management |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Forms & validation |
| Axios | HTTP client (wired to mock data) |
| Lucide React | Icons |

---

## Getting Started

```bash
# From the fan-zone-ui/ directory:
npm install
npm run dev        # starts dev server at http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

---

## Deploy to Vercel

The project includes a `vercel.json` that configures Vercel for this Vite app.

### Steps

1. Push the repository to GitHub (already done).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. **Important – set the Root Directory** to `fan-zone-ui` (the subdirectory containing `package.json`).

   ![Root Directory setting](https://vercel.com/docs/static/images/root-directory.png)

4. Vercel will automatically detect the Vite framework from `vercel.json` and use:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.

> **Why is the Root Directory needed?**  
> This repo contains multiple projects. The React app lives inside `fan-zone-ui/`, so Vercel must be told to look there for `package.json` rather than the repo root.

### What `vercel.json` does

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- **`framework: "vite"`** – tells Vercel this is a Vite project (not Next.js), preventing the *"No Next.js version detected"* error.
- **`outputDirectory: "dist"`** – where Vite writes its production bundle.
- **`rewrites`** – sends every URL to `index.html` so React Router can handle client-side navigation without 404s on refresh.

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # LoginForm, AgeVerificationForm, SocialAuthButtons
│   ├── feed/          # ContentCard, VideoCard, PollCard, FeedFilter
│   ├── predictions/   # PredictionBuilder, OddsDisplay, PredictionHistory
│   ├── profile/       # ProfileHeader, ActivityStats
│   ├── collectibles/  # CollectiblesGallery, CollectibleCard
│   ├── leaderboard/   # LeaderboardTable
│   └── common/        # Navbar, ProtectedRoute, LoadingSpinner, ErrorBoundary
├── pages/             # LoginPage, DashboardPage, PredictionsPage,
│                      # ProfilePage, CollectiblesPage, LeaderboardPage
├── store/             # Redux slices: authSlice, feedSlice
├── types/             # TypeScript interfaces (User, Prediction, ContentItem, …)
├── constants/         # API endpoints, app-wide constants
├── hooks/             # useAuth, useFeed
├── utils/             # mockData (stub data for all features)
├── App.tsx            # Route definitions
└── main.tsx           # React entry point
```

---

## Pages & Routes

| Route | Page | Auth required |
|---|---|---|
| `/login` | Login / social auth | No |
| `/age-verify` | Date-of-birth entry | Logged in |
| `/dashboard` | Main content feed | Logged in |
| `/predictions` | Prediction builder & history | Logged in |
| `/profile` | User profile & settings | Logged in |
| `/collectibles` | Collectibles gallery | Age verified |
| `/leaderboard` | Global / Club / Friends tabs | Logged in |

Protected routes redirect to `/login` when unauthenticated, and to `/age-verify` when age verification is required.

---

## Features

### Authentication & Identity
- Social auth buttons (Google, Apple, Facebook, X, Email)
- Email + password login with Zod validation
- Progressive identity flow: Anonymous → Logged In → Age Verified → Premium
- Age-gated content protection via `<ProtectedRoute>`

### Content Feed
- Mixed feed: videos, articles, polls, UGC
- Filter tabs by content type
- Loading and empty states

### Prediction Engine
- Match selection cards
- Prediction types: Match Result, Correct Score, First Goalscorer, Cards, Possession
- XP reward preview per prediction
- Prediction history table with status badges

### Fan Profile
- XP score, level bar, prediction accuracy, collectibles count
- Editable team affinity and favourite players
- Account settings panel

### Collectibles (Phase 2 stub)
- Grid gallery with rarity filters (Common → Legendary)
- Limited-time drop notification banner
- Collectible detail cards

### Leaderboard
- Global / Club / Friends tab switcher
- Top-3 medal highlighting
- User's own rank pinned

---

## Development Notes

- **No real API calls** – all data comes from `src/utils/mockData.ts` with simulated `setTimeout` loading delays.
- **Mock login** – enter any email/password on the login page; the Redux `authSlice` accepts any credentials.
- All components include ARIA labels for WCAG 2.1 AA compliance.
