# Beginner Setup Guide — Goody Labs Portfolio on Vercel

A no-terminal, fully-browser walkthrough. Takes about 15 minutes.

You'll do everything on three websites:
1. **GitHub** — to store your code
2. **Neon** — to host your database (free)
3. **Vercel** — to host the dashboard (free)

**No Node.js, no command line, no install of any kind.**

---

## Part 1 — Get the code onto GitHub (4 min)

### Step 1.1 — Unzip the project

You should have a zip file called `goody-labs-portfolio-vercel.zip`.

- Double-click it to unzip. You'll get a folder called `goody-labs-portfolio-vercel`.
- Leave that folder open in Finder/Explorer — you'll need it in Step 1.3.

### Step 1.2 — Create a new repository on GitHub

1. Go to **<https://github.com/new>**.
2. **Repository name:** type `goody-labs-portfolio` (any name works).
3. **Privacy:** select **Private** (this is your personal data — keep it private).
4. **Do NOT** tick "Add a README file" — we're uploading our own files.
5. Click the green **Create repository** button at the bottom.

You'll land on a page that says *"Quick setup — if you've done this kind of thing before"*. **Ignore everything on that page.**

### Step 1.3 — Upload the project files

On that same page, look for a small link near the top that says:

> *or upload an existing file* — **uploading an existing file**

Click it. You'll see a page that says **Drag files here to add them to your repository**.

1. Open the unzipped `goody-labs-portfolio-vercel` folder in Finder/Explorer.
2. **Select everything inside that folder** (Cmd+A on Mac / Ctrl+A on Windows). You should select files AND subfolders like `api`, `client`, `shared`, `README.md`, `package.json`, etc.
3. **Drag the selection** onto the GitHub page.
4. Wait — GitHub will show "Uploading…" with a progress bar. This takes 30-60 seconds.
5. Scroll down to the **Commit changes** section.
6. Leave the default message ("Add files via upload"). Click the green **Commit changes** button.

Done — your code is now on GitHub. The page will refresh and you'll see a file listing with `api/`, `client/`, `README.md`, etc.

**Important:** make sure you can see folders like `api`, `client`, and `shared` in the file listing. If you only see one folder named `goody-labs-portfolio-vercel`, you uploaded the outer folder by mistake — delete the repo and start Step 1.3 again, this time selecting the *contents* not the folder.

---

## Part 2 — Set up the database on Neon (4 min)

### Step 2.1 — Create a new Neon project

1. Go to **<https://console.neon.tech>** and sign in.
2. Click **New Project** (top right, or "Create a project" if it's your first time).
3. Fill in:
   - **Project name:** `goody-labs-portfolio`
   - **Postgres version:** leave as default (latest)
   - **Region:** pick **Asia Pacific (Sydney) — aws-ap-southeast-2** if available. If not, **Asia Pacific (Singapore)**.
4. Click **Create project**.

### Step 2.2 — Create the tables

After the project is created, you'll land on the project dashboard.

1. In the left sidebar, click **SQL Editor** (icon looks like a database with a pencil).
2. You'll see a code area in the middle of the screen.
3. **In the unzipped project folder on your computer**, find the file called **`schema.sql`** and open it with any text editor (Notepad, TextEdit, VS Code — anything).
4. Copy **everything** in `schema.sql`.
5. Paste it into the Neon SQL Editor.
6. Click the **Run** button (top right of the editor, or press Cmd/Ctrl + Enter).

You should see: **"Query ran successfully"** with no rows returned. Both tables are now created.

### Step 2.3 — Copy the connection string (you'll need it in Part 3)

1. In the Neon left sidebar, click **Dashboard** (or the home/house icon at the top).
2. Find the **Connection string** section in the middle of the page.
3. Look for a small toggle that says **Pooled connection** — make sure it's **ON** (this is important for Vercel).
4. Click the **copy icon** next to the connection string.
5. **Paste it temporarily into a Notes file or sticky note** — you'll paste it into Vercel in 2 minutes.

It should look like:
```
postgresql://neondb_owner:abc123XYZ@ep-cool-name-12345-pooler.ap-southeast-2.aws.neon.tech/neondb?sslmode=require
```

⚠️ Treat this string like a password — anyone with it can read/edit your database.

---

## Part 3 — Generate a dashboard password (1 min)

This is the password you'll type to log in to your dashboard. Make it long and random.

**Easiest option:** Open a new browser tab and go to:

**<https://1password.com/password-generator>**

(Or any password generator — even Apple Keychain's suggested password works.)

- Set length to **32 characters**.
- Set type to **Random Password** (with letters + numbers; symbols optional).
- Click **Copy**.
- **Save this password somewhere safe** — your password manager, Notes app, or a sticky note. You will need it every time you log in to your dashboard.

---

## Part 4 — Deploy to Vercel (4 min)

### Step 4.1 — Import your GitHub repo

1. Go to **<https://vercel.com/new>** and sign in.
2. You'll see a list of your GitHub repositories. Find `goody-labs-portfolio` and click **Import**.
   - If you don't see it, click **Adjust GitHub App Permissions** → grant Vercel access to that repo → come back.

### Step 4.2 — Configure the project

You'll see a **Configure Project** page.

1. **Framework Preset:** leave it as whatever it auto-detected (usually "Other" or "Vite"). The `vercel.json` file in your repo handles the configuration regardless.
2. **Project Name:** leave the default or rename it (e.g. `goody-portfolio`). This becomes part of your URL.
3. **Build and Output Settings:** leave on defaults — don't override anything.
4. **Environment Variables:** this is the important part. You need to add two variables.

Click the small arrow next to **Environment Variables** to expand it. Then add:

**Variable 1:**
- **Name:** `DATABASE_URL`
- **Value:** paste the Neon connection string you copied in Step 2.3
- Click **Add**

**Variable 2:**
- **Name:** `DASHBOARD_PASSWORD`
- **Value:** paste the password you generated in Part 3
- Click **Add**

You should now see both variables listed.

### Step 4.3 — Deploy

Click the big **Deploy** button at the bottom.

Vercel will:
1. Pull your code from GitHub
2. Install dependencies (~30 seconds)
3. Build the frontend (~30 seconds)
4. Deploy your API routes
5. Show a confetti animation when done 🎉

You'll be redirected to a success page with a preview of your site and a URL like:
```
https://goody-portfolio.vercel.app
```

### Step 4.4 — Open your dashboard

Click the preview thumbnail or the URL.

You should see the **Goody Labs login screen**. Type the password you generated in Part 3 → click **Unlock**.

You're in. The dashboard starts empty — no investments yet.

---

## Part 5 — (Optional) Load the example data

If you want the Anthropic example investment loaded so you can see how everything works before entering your own data:

1. While you're logged in to your dashboard, **right-click anywhere on the page** → **Inspect** (Mac: Cmd+Option+I, Windows: F12).
2. A developer panel opens. Click the **Console** tab at the top.
3. Paste this (replace `YOUR-PASSWORD` with your actual dashboard password):

```javascript
fetch('/api/seed', {
  method: 'POST',
  headers: { Authorization: 'Bearer YOUR-PASSWORD' }
}).then(r => r.json()).then(console.log)
```

4. Press Enter. You should see `{ seeded: true, investmentId: 1 }`.
5. Refresh the page — the Anthropic example will appear in your portfolio.

You can edit or delete it once your own data is in.

---

## Part 6 — (Optional) Add your custom domain

If you want `portfolio.karlgoody.com` instead of `goody-portfolio.vercel.app`:

1. In Vercel → your project → **Settings** → **Domains**.
2. Type `portfolio.karlgoody.com` → **Add**.
3. Vercel will show you a CNAME record to add at your DNS provider.
4. Go to wherever you bought `karlgoody.com` (GoDaddy, Namecheap, etc.) → DNS settings.
5. Add a CNAME record:
   - **Type:** CNAME
   - **Name/Host:** `portfolio`
   - **Value/Target:** `cname.vercel-dns.com`
   - **TTL:** Auto (or 3600)
6. Save. Wait 5-30 minutes for DNS propagation.
7. Vercel will automatically issue an SSL certificate. Done.

---

## You're done

Your dashboard is live, password-protected, and accessible from any device with a browser. Bookmark the URL on your phone's home screen for one-tap access.

---

## Common issues

**"This site can't be reached" after deploy**

Usually means the build failed. Go to Vercel → your project → **Deployments** tab → click the failed deployment → check the build log for the error. Most common cause: typo in `DATABASE_URL` (missing `?sslmode=require` at the end).

**"Internal server error" when logging in or loading data**

Means the API can reach the database but something's wrong with the schema or env vars.
- Double-check that `schema.sql` was actually run in Neon (Part 2). Go to Neon → **Tables** in the sidebar — you should see `investments` and `rounds`.
- Double-check that `DATABASE_URL` in Vercel uses the **Pooled connection** string (it must contain `-pooler` in the hostname).

**"Incorrect password" but I'm sure it's right**

- Make sure there are no trailing spaces in `DASHBOARD_PASSWORD` in Vercel.
- If you change the env var, Vercel needs to redeploy. Go to **Deployments** → click the three-dot menu on the latest deploy → **Redeploy**.

**I want to change the password**

Vercel → **Settings** → **Environment Variables** → find `DASHBOARD_PASSWORD` → **Edit** → save → trigger a redeploy (Deployments tab → three-dot menu → Redeploy).

**How do I update the code later if you send me an improved version?**

GitHub → your repo → click into any file → click the pencil edit icon → paste the new content → commit. Or just delete the whole repo and redo Part 1.3 with a new zip. Vercel auto-deploys on every commit.

**My data is gone after I logged out**

Your data lives in Neon, not in your browser. It's still there. You probably just need to refresh — log back in and your investments should reappear. If they truly are gone, go to Neon → SQL Editor → run `SELECT * FROM investments;` to confirm. The only way to actually lose data is if you delete the Neon database itself or run a DELETE query.

---

## What this costs you

| Service | Plan | Monthly cost |
|---|---|---|
| Vercel | Hobby | **$0** |
| Neon | Free | **$0** |
| GitHub | Free | **$0** |
| Custom domain (optional) | You already own karlgoody.com | $0 (already paid) |
| **Total** | | **$0** |

You'd only start paying if you exceeded Neon's 0.5 GB storage limit, which for a personal portfolio dashboard would take decades.
