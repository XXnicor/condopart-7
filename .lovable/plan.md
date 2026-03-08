

# Fix GOLDEN_PARK_CONDO constant and standardize condo references

## Changes

### 1. Update `src/lib/constants.ts`
- Rename `name` to `'Residencial Golden Park I'`
- Replace `address` with `neighborhood: 'Jardim Golden Park Residence I'` and `city: 'Sorocaba - SP'`
- Coordinates already correct (-23.4890, -47.4916, zoom 16)

### 2. Update `src/pages/CondoSelection.tsx`
- Line 45: use `GOLDEN_PARK_CONDO.name` (already does)
- Line 48: change hardcoded subtitle to use `GOLDEN_PARK_CONDO.neighborhood` + `GOLDEN_PARK_CONDO.city`

### 3. No changes needed for map components
LocationPicker, SightingForm, SightingMiniMap, and AlertMap already import and use `GOLDEN_PARK_CONDO.lat`/`lng`/`zoom` correctly. No amber markers present (already removed).

### Technical details

**constants.ts new shape:**
```typescript
export const GOLDEN_PARK_CONDO = {
  id: 'deff164a-7586-4607-99da-d30dcbbf1e96',
  name: 'Residencial Golden Park I',
  neighborhood: 'Jardim Golden Park Residence I',
  city: 'Sorocaba - SP',
  lat: -23.4890,
  lng: -47.4916,
  zoom: 16,
} as const;
```

**Files modified:** 2 (`constants.ts`, `CondoSelection.tsx`)

