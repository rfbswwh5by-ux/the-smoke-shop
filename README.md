# Shop Website Template

A ready-made website for a local vape or smoke shop. It has a public catalog site
(home, products, about, FAQ, visit, contact, privacy, terms, and an age check) plus a
private **owner dashboard** at `/admin` where the shop edits everything: name, logo,
colors, photos, products, hours, FAQ, policies, and messages.

There are no online sales and no payments. Customers browse, then visit the store.

Every shop-specific detail lives in the database and is edited from `/admin`.
**Nothing in the code needs to change for a new client.** To launch a new shop, repeat
the checklist below with a fresh GitHub repository and a fresh Vercel project.

All of the services used have free plans: GitHub, Vercel (Hobby), Neon, and Vercel Blob.
Resend is optional.

---

## Deploy checklist (about 15 minutes per client)

### 1. Create the GitHub repository
1. Sign in at https://github.com (use the client's account, or yours).
2. Click **New repository**. Give it a name (for example `joes-vape-site`), choose
   **Private**, and click **Create repository**.

### 2. Upload the files
1. On the new repository's page, click **uploading an existing file**.
2. Unzip the template zip(s) on your computer. Drag in the **contents** of the
   unzipped folder (`package.json`, `src`, `public`, and so on) so they sit at the top
   level of the repository, not inside an extra folder.
3. GitHub accepts at most 100 files per upload. If the template comes in several zips,
   upload them one at a time and click **Commit changes** after each one.

### 3. Import it into Vercel
1. Sign in at https://vercel.com and click **Add New… → Project**.
2. Find the repository and click **Import**.
3. Leave every setting on its default. The framework is detected automatically, and
   you don't need to change the build command or the output folder.
4. Click **Deploy**. The first deploy works, but the site shows sample text until
   the steps below are done.

### 4. Add the database (Neon)
1. In the Vercel project, open the **Storage** tab.
2. Click **Create Database** (or **Connect Database**) → **Neon** → **Continue**.
3. Choose the **Free** plan, pick a region near the shop, and click **Create**.
4. Make sure it is connected to this project for **Production** and **Preview**.
   This adds `DATABASE_URL` automatically. The tables create themselves on first use.

### 5. Add image storage (Blob)
1. Still under **Storage**, click **Create Database** → **Blob** → **Continue**.
2. Name it (for example `shop-images`), choose **Public** access, and click **Create**.
3. Connect it to this project. This adds `BLOB_READ_WRITE_TOKEN` automatically.

### 6. Set the setup key
1. Go to **Settings → Environment Variables**.
2. Add **`ADMIN_SETUP_KEY`**. For the value, make up a long private phrase (20 or more
   characters, for example `blue-tractor-river-4471-sunset`). Tick Production and Preview.
3. Write the key down somewhere safe. You need it to claim the dashboard, and again
   only if the owner ever loses their access code.

### 7. Redeploy
Go to the **Deployments** tab, open the menu (⋯) on the latest deployment, and click
**Redeploy**. The new settings only take effect after a redeploy.

### 8. Claim the dashboard
1. Open `https://YOUR-SITE.vercel.app/admin`.
2. The screen says **Claim this website**. Type an **access code** (8 or more characters),
   type it again to confirm, enter the **setup key** from step 6, and click
   **Set code & enter**.
3. Whoever does this becomes the **owner**. Give the access code to the client, or let
   them do this step themselves.

### 9. Edit the content
Inside the dashboard, work through the **Overview** checklist. Add the shop name and logo,
store address and hours, photos, categories, and products. `CLIENT-GUIDE.md` explains
each page and can be sent to the client.

### 10. (Optional) Custom domain
Vercel project → **Settings → Domains** → add the client's domain and follow the DNS
instructions shown there.

### 11. (Optional) Email replies to customers
Without this, replies to contact-form messages are saved in the dashboard, and the
owner answers by phone or from their own email.
1. Create a free account at https://resend.com and verify the shop's domain.
2. Create an API key.
3. In Vercel, add `RESEND_API_KEY` (the key) and `EMAIL_FROM` (for example
   `hello@theirshop.com`), then redeploy.

---

## Environment variables

| Name | Required? | Where it comes from |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Added automatically by Storage → Neon |
| `BLOB_READ_WRITE_TOKEN` | Yes, for image uploads | Added automatically by Storage → Blob |
| `ADMIN_SETUP_KEY` | Yes | A private phrase you choose (step 6) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional | Resend account (step 11) |
| `SITE_ID` | Rarely | Only if two sites share one database |

No passwords, keys, or project IDs are stored in the code.

## Troubleshooting

- **The site shows "Your Shop Name" and sample text.** That's normal until the owner
  edits it in `/admin`. If saving in the dashboard fails, the database is not connected
  (step 4) or you didn't redeploy (step 7).
- **"This site has no setup key yet."** `ADMIN_SETUP_KEY` is missing. Add it (step 6)
  and redeploy.
- **"Image uploads aren't set up yet."** Connect a Blob store (step 5) and redeploy.
- **The owner lost their access code.** On `/admin`, click **Lost your access code?**,
  enter the setup key and a new code. Every old session is signed out.
- **Someone else claimed the site first.** Reset the owner code with the setup key as
  described above. Then remove any unknown team members under **Team access**.

---

## For developers

- Stack: TanStack Start (React 19, JavaScript), Vite, Tailwind, built by Nitro for Vercel.
- Data: one Postgres table, `records(entity, id, data jsonb, created_date, updated_date)`,
  created automatically (`src/lib/db.server.js`). `src/lib/entities.server.js` provides
  a small entity API (`list`, `filter`, `get`, `create`, `update`, `delete`,
  `deleteMany`, `updateMany`, `bulkUpdate`, `count`) that all server code uses.
  The entities are SiteSettings, Product, ProductCategory, FaqItem, ContactMessage,
  AdminCredential, AdminSession, and AdminAttempt.
- Server logic: `src/lib/store.server.js` (all dashboard actions), `src/lib/server-fns.js`
  (server functions the pages call), `src/lib/admin-security.server.js` (access codes
  with PBKDF2 hashes, 8-hour sessions, and lockout after 5 failures).
- Uploads and email: `src/lib/integrations.server.js` (Vercel Blob, Resend).
- Default text and placeholder images: `src/lib/siteDefaults.js`, `public/media/`.

```bash
npm install
cp .env.example .env    # fill in DATABASE_URL (a Neon connection string) and ADMIN_SETUP_KEY
npm run dev             # http://localhost:3000
npm run build           # production build (VERCEL=1 builds the Vercel output)
```
