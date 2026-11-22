# BoardPrep Papers — CBSE 2026-27 practice paper store

A premium store for CBSE Class 10 and Class 12 practice papers: 22 subjects × 30 sets, each sold as
a **Word file (question paper)** and a **PDF (question paper + answer key)**.

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4) — deploy on **Vercel**
- **Supabase** — sign-in, database, private file storage
- **Razorpay** — payments (UPI, cards, net banking, wallets)

The site works immediately in **placeholder mode**: all classes, subjects and "Paper N · Set N" slots
are listed as *Coming soon* until Supabase and Razorpay are connected and files are uploaded.

## Pages

| Route | What it is |
|---|---|
| `/` | Home: hero, classes, features, pricing, FAQ |
| `/classes/10`, `/classes/12` | All subjects of a class, grouped by stream |
| `/classes/[level]/[subject]` | 30 sets with Word / PDF slots, per-set purchase and subject bundle |
| `/login` | Email + password, magic link, optional Google |
| `/account` | "My papers" — downloads for everything bought |
| `/admin` | Upload files, set prices, put sets on sale (admins only) |
| `/terms`, `/privacy`, `/refund-policy`, `/delivery-policy`, `/contact` | Policy pages Razorpay requires |

## 1 · Supabase

1. Create a project at supabase.com.
2. **SQL Editor** → run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`
   (creates all subjects and the 30 placeholder sets; creates the private `papers` storage bucket).
3. **Authentication → URL Configuration**: Site URL = your Vercel URL; add
   `https://<your-domain>/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs.
4. Copy **Project URL**, **anon key** and **service_role key** into the environment variables.
5. Optional: enable Google under Authentication → Providers and set `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true`.

## 2 · Razorpay

1. Dashboard → Account & Settings → **API Keys** → generate (start with **Test mode**).
2. Put `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the environment.
3. Dashboard → **Webhooks** → add `https://<your-domain>/api/razorpay/webhook`, events
   `payment.captured` and `order.paid`, choose a secret → `RAZORPAY_WEBHOOK_SECRET`.
4. For activation Razorpay checks the policy pages — fill in your business name, address,
   email and phone through the `NEXT_PUBLIC_*` variables.

## 3 · Vercel

1. Import this GitHub repository in Vercel (framework preset: Next.js, no extra settings).
2. Add every variable from `.env.example` under Project → Settings → Environment Variables.
3. Deploy. Then set `NEXT_PUBLIC_SITE_URL` to the final domain and redeploy.

## 4 · Uploading papers

Sign in with an email listed in `ADMIN_EMAILS`, open **/admin**, pick a subject and upload for each set:

- **Question Paper** — `.docx`
- **Question Paper + Answer Key** — `.pdf`
- *(optional)* separate **Answer Key** — `.pdf`

A set goes on sale automatically once a file is uploaded. Prices per set and per subject bundle are
editable there (defaults ₹49 per set, ₹999 per subject bundle — see `src/lib/site.ts`).

## How purchases are protected

- Prices are read from the database on the server; the browser never decides the amount.
- Payment is confirmed by Razorpay's signature (checkout) and by the signed webhook.
- Files live in a **private** bucket; buyers get a 2-minute signed link only after the purchase is checked.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys (optional — placeholder mode works without them)
npm run dev
```

To change subjects or the number of sets, edit `src/lib/catalog.ts` / `src/lib/site.ts`, then
regenerate the seed with `node scripts/generate-seed.mjs`.
