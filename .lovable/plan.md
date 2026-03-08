

# Seed Test Data to Enable Full Flow Testing

## Problem
The `condos` table has 0 records, so you can't proceed past the condo selection screen. No condos means no alerts can be created, and the sharing/public page features can't be tested.

## Plan

### Step 1 — Insert a test condominium
Run a database migration to insert a sample condo record.

### Step 2 — Verify the flow works
After seeding, the flow becomes testable:
1. Select the test condo on `/condo-selection`
2. Create a lost pet alert
3. Test the Share button (WhatsApp + Copy link)
4. Open `/p/alert/:id` in incognito to test the public page

### Technical Details

**SQL migration:**
```sql
INSERT INTO public.condos (name) VALUES ('Residencial Golden Park');
```

That single insert unblocks the entire flow. No schema changes needed.

### Also fix: RLS policy is RESTRICTIVE

Looking at the RLS policies on `alerts`, the "Public can read active and found alerts" policy is set as `Permissive: No` (RESTRICTIVE). All existing policies are also RESTRICTIVE. For the anon role to read alerts, the public policy needs to be PERMISSIVE, otherwise it requires ALL restrictive policies to pass (which fails for anon users since the condo-scoped policy requires `auth.uid()`).

**Fix SQL:**
```sql
DROP POLICY "Public can read active and found alerts" ON public.alerts;
CREATE POLICY "Public can read active and found alerts"
  ON public.alerts FOR SELECT
  TO anon
  USING (status = 'active' OR status = 'found');
```

This time ensuring it's created as PERMISSIVE (the default), so anon users can actually read public alerts.

