# Goody Labs — Private Investment Portfolio

A personal dashboard for tracking private (pre-IPO) investments through funding rounds, with full dilution and 20% carry math.

Built with React + Vite + TypeScript + Tailwind + shadcn/ui on the frontend, and Vercel Serverless Functions + Neon Postgres + Drizzle ORM on the backend.

---

## 👉 First time deploying?

**Open [`SETUP_GUIDE.md`](./SETUP_GUIDE.md)** — a beginner-friendly walkthrough with no command line, no Node.js install, and no terminal commands. Everything happens in a web browser (GitHub + Neon + Vercel). ~15 minutes.

The section below is the technical version for users comfortable with `git` and `npm`.

---

## Deploy to Vercel — technical version

You'll need three free accounts: **GitHub**, **Vercel**, and **Neon**. Total time: ~10 minutes.

### 1. Push this code to GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
```

Then create a new repo on github.com (private is fine) and push:

```bash
git remote add origin https://github.com/<your-username>/goody-labs-portfolio.git
git branch -M main
git push -u origin main
```

### 2. Create a Neon Postgres database (free)

1. Go to [console.neon.tech](https://console.neon.tech) and sign in with GitHub.
2. Click **New Project**. Name it `goody-labs-portfolio`. Region: pick the one closest to Sydney (e.g. `Asia Pacific (Sydney)` if available, otherwise `Asia Pacific (Singapore)`).
3. On the project dashboard, find **Connection string** → switch to **Pooled connection** → copy it. It looks like:
   ```
   postgresql://user:password@ep-name-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this tab open — you'll need the string in step 4.

### 3. Push the database schema

Locally, from the project folder:

```bash
# Create a .env.local file with your Neon URL
echo 'DATABASE_URL="paste-your-neon-pooled-url-here"' > .env.local

# Install deps (if you haven't already)
npm install

# Push the schema to Neon — creates the investments and rounds tables
npm run db:push
```

You should see Drizzle confirm `[✓] Changes applied`. (If you forget this step, the deployed site will show "internal server error" on every API call.)

### 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New** → **Project** → select your `goody-labs-portfolio` repo → **Import**.
3. Framework Preset: **Other** (the included `vercel.json` handles configuration).
4. Expand **Environment Variables** and add two:
   - `DATABASE_URL` → paste the Neon pooled connection string from step 2.
   - `DASHBOARD_PASSWORD` → a long random password. Generate one with:
     ```bash
     openssl rand -base64 32
     ```
     Save this somewhere safe — you'll type it into the dashboard to log in.
5. Click **Deploy**. Wait ~1 minute.
6. Vercel gives you a URL like `goody-labs-portfolio.vercel.app`. Open it.

### 5. First-time setup — seed the example investment (optional)

The deployed site starts with an empty database. If you want the Anthropic example investment as a reference, log in, then in a new browser tab visit:

```
https://your-app.vercel.app/api/seed
```

Or run this in the browser console while logged in:

```js
fetch('/api/seed', {
  method: 'POST',
  headers: { Authorization: 'Bearer YOUR-DASHBOARD-PASSWORD' }
}).then(r => r.json()).then(console.log)
```

Skip this if you just want to start adding your own positions immediately.

### 6. (Optional) Add a custom domain

In Vercel → your project → **Settings** → **Domains** → add `portfolio.karlgoody.com` (or any subdomain you own). Vercel will give you a CNAME record to add at your DNS provider.

---

## Local development

```bash
# Install deps once
npm install

# Set DATABASE_URL in .env.local (see step 3 above)

# In one terminal — Vite frontend (port 5173)
npm run dev

# In a second terminal — Vercel serverless functions (port 3000)
# Vite is configured to proxy /api requests to localhost:3000
npx vercel dev
```

Open <http://localhost:5173>. If `DASHBOARD_PASSWORD` is unset locally, the auth gate is bypassed (open mode) so you can iterate without typing the password.

---

## Project structure

```
api/                          # Vercel serverless functions
  _lib/
    auth.ts                   # Password gate middleware
    db.ts                     # Neon Postgres client
    storage.ts                # CRUD operations (Drizzle queries)
  auth/check.ts               # GET — validates the password
  seed.ts                     # POST — one-time example data
  investments/
    index.ts                  # GET (list) / POST (create)
    [id]/
      index.ts                # GET / PATCH / DELETE one investment
      rounds.ts               # POST a new round to an investment
  rounds/
    [id].ts                   # PATCH / DELETE one round

client/                       # React + Vite frontend
  src/
    components/
      AuthGate.tsx            # Login screen
      Logo.tsx                # Goody Labs SVG mark
      ui/                     # shadcn components
    lib/
      calc.ts                 # The calculation engine (single source of truth)
      queryClient.ts          # Auth-aware fetch + TanStack Query setup
      theme.tsx               # Dark/light mode
    pages/
      Dashboard.tsx           # The whole app
    App.tsx                   # Routing + providers
    index.css                 # Tailwind + design tokens

shared/
  schema.ts                   # Drizzle/Zod schema (used by frontend AND backend)

vercel.json                   # Vercel build configuration
drizzle.config.ts             # Drizzle Kit config for `npm run db:push`
.env.example                  # Template for environment variables
```

---

## Calculation methodology

The math is implemented in [`client/src/lib/calc.ts`](./client/src/lib/calc.ts).

**Per round you enter:**
- AUD invested (0 if you skipped)
- FX rate at the time (AUD → USD, e.g. 0.66 means 1 AUD = 0.66 USD)
- Post-money valuation (USD)
- Total raised in the round (USD)

**Entry round (round 1):**
```
ownership = (AUD × FX) / postMoney
```

**Follow-on rounds:**
```
dilutionFactor          = 1 − (totalRaise / postMoney)
ownershipFromExisting   = previousOwnership × dilutionFactor
ownershipFromNew        = (AUD × FX) / postMoney
ownershipAfter          = ownershipFromExisting + ownershipFromNew
```

**Mark-to-today:**
```
currentValueUSD = finalOwnership × latestValuationUSD
currentValueAUD = currentValueUSD / currentFX

grossProfitAUD  = currentValueAUD − totalAUDInvested
performanceFee  = MAX(0, grossProfitAUD) × 0.20    (20% carry on profit only)
netValueAUD     = currentValueAUD − performanceFee
```

Capital is returned in full before carry — standard high-water-mark carry on profit only.

---

## Costs

- **Vercel Hobby** — Free. Covers everything for personal use.
- **Neon free tier** — Free. 0.5 GB storage, plenty for this workload.
- **Custom domain** — Already owned (e.g. karlgoody.com), no extra cost.
- **Ongoing total** — $0 / month.

---

## Security notes

- **Single-user only.** This is built for one person. There is no user accounts or multi-tenancy.
- **Password gate.** The `DASHBOARD_PASSWORD` env var protects every API endpoint. The frontend stores the password in memory only — refreshing re-prompts.
- **No server-side sessions.** The password is sent on every request as a `Bearer` token. Vercel's HTTPS protects it in transit.
- **Database is not exposed.** Neon's connection requires `sslmode=require` and credentials. The connection string lives only in Vercel's encrypted env vars and your local `.env.local` (which is gitignored).

If you ever leak the password, rotate `DASHBOARD_PASSWORD` in Vercel → redeploys automatically. Old sessions are invalidated on next request.
