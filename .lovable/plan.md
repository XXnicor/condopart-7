

# Add fixed reference marker to LocationPicker and SightingForm maps

## Current state
All 5 files already use `GOLDEN_PARK_CONDO` from `src/lib/constants.ts`. Maps center correctly. Fallbacks work. CondoSelection auto-assigns. The only missing piece is the **fixed reference marker** requested in the spec.

## Changes

### 1. `src/components/LocationPicker.tsx` (line ~36, after `setView`)
Add a non-draggable Leaflet marker at `GOLDEN_PARK_CONDO` coords with an amber `divIcon` and popup showing `GOLDEN_PARK_CONDO.name`.

### 2. `src/components/SightingForm.tsx` (line ~50, after `setView`)
Same fixed reference marker.

### 3. No changes needed
- `src/lib/constants.ts` — already correct
- `src/pages/CondoSelection.tsx` — already correct
- `src/components/SightingMiniMap.tsx` — fallback already works
- `src/components/AlertMap.tsx` — fallback already works

### Marker implementation
```typescript
const refIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#f59e0b;border-radius:50%;color:white;font-size:13px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);">🏢</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});
L.marker([GOLDEN_PARK_CONDO.lat, GOLDEN_PARK_CONDO.lng], { icon: refIcon, interactive: true })
  .addTo(map)
  .bindPopup(GOLDEN_PARK_CONDO.name);
```

**Files modified:** 2

