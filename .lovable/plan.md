

# Update default map coordinates

## Change
Update `GOLDEN_PARK_CONDO.lat` and `GOLDEN_PARK_CONDO.lng` in `src/lib/constants.ts` to the correct values. All other files already import from this constant.

**`src/lib/constants.ts`:**
```typescript
lat: -23.451977706207774,
lng: -47.51101172883554,
```

**Files already using `GOLDEN_PARK_CONDO`** (no coordinate changes needed, they import the constant):
- `src/components/LocationPicker.tsx`
- `src/components/SightingForm.tsx`
- `src/components/SightingMiniMap.tsx`
- `src/components/AlertMap.tsx`

**`src/components/SightingMiniMap.tsx`** — update parseFloat fallbacks:
```typescript
const lat = parseFloat(String(location.lat)) || GOLDEN_PARK_CONDO.lat;
const lng = parseFloat(String(location.lng)) || GOLDEN_PARK_CONDO.lng;
```
(Already uses this pattern, but will verify the fallback values reference the constant, not hardcoded numbers.)

**Files modified:** 1–2 (constants.ts, possibly SightingMiniMap.tsx if fallbacks are hardcoded)

