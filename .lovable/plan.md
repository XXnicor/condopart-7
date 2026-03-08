

# WhatsApp Sharing + Public Alert Page + Vercel Deploy Prep

## Overview

Three parts: (1) share button + bottom sheet on AlertDetail, (2) new public page at `/p/alert/:id` accessible without login, (3) Vercel deployment config.

## Part 1 — Share Button on AlertDetail

**File: `src/pages/AlertDetail.tsx`**

- Add `Share2` icon button in the header, between the title and status badge
- On click, open a bottom sheet (framer-motion overlay, same pattern as `ResolveAlertModal`)
- Bottom sheet contains:
  - WhatsApp button (green, full-width, inline SVG icon) — opens `wa.me` with pre-filled text including public URL `/p/alert/${id}`
  - Separator + "Copiar link" outline button with copy-to-clipboard, toast feedback, temporary "Copiado" state
- Close sheet after action

**New component: `src/components/ShareAlertSheet.tsx`**
- Receives `isOpen`, `onClose`, `alertId`, `alertTitle`, `alertDescription`
- Encapsulates the bottom sheet UI and sharing logic

## Part 2 — Public Alert Page

**Database: New RLS policy needed**

The current `alerts` SELECT policy requires `auth.uid()`. We need a new policy allowing anonymous reads for the public page. Options:
- Add a `SELECT` policy for `anon` role: `USING (status IN ('active', 'found'))` — this allows unauthenticated access to active/found alerts only (not cancelled)
- This is safe since the public page only shows non-sensitive alert data

SQL migration:
```sql
CREATE POLICY "Public can read active and found alerts"
  ON public.alerts FOR SELECT
  TO anon
  USING (status = 'active' OR status = 'found');
```

**New file: `src/pages/PublicAlert.tsx`**
- Fetches alert by ID using supabase client (no auth required, anon key)
- Layout: simple header with "PetAlert" branding, no BottomNav
- Photo display (or placeholder), status badge (pulsing for active, static for found), pet name, location, date, expandable description
- CTA card: if active → "Registrar avistamento" button redirecting to `/auth?redirect=/alert/${id}`; if found → celebration card
- Footer with app tagline + "Criar conta" link
- Dynamic OG meta tags via `useEffect` (set on mount, clean on unmount)
- Loading skeleton and error state for invalid IDs

**File: `src/App.tsx`**
- Add route: `<Route path="/p/alert/:id" element={<PublicAlert />} />` (no ProtectedRoute)

**File: `src/pages/Auth.tsx`**
- Read `?redirect=` query param
- After successful login, navigate to `redirect` value instead of `/`

## Part 3 — Vercel Deploy Prep

**New file: `vercel.json`**
- SPA rewrite rule: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

**New file: `.env.example`**
- Template with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` placeholders

`vite.config.ts` — already fine, no `base` path set.

## Files Changed

| File | Action |
|------|--------|
| `src/components/ShareAlertSheet.tsx` | Create |
| `src/pages/PublicAlert.tsx` | Create |
| `src/pages/AlertDetail.tsx` | Add share button in header |
| `src/pages/Auth.tsx` | Add redirect query param support |
| `src/App.tsx` | Add `/p/alert/:id` route |
| `vercel.json` | Create |
| `.env.example` | Create |
| Migration SQL | Add anon SELECT policy on alerts |

## Security Note

The public RLS policy only exposes active/found alerts (not cancelled). No user PII is exposed — only pet name (title), description, photo, location label, status, and timestamps.

