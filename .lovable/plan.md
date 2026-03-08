

# Fix map centering — add invalidateSize after initialization

## Diagnosis
All four map components correctly use `GOLDEN_PARK_CONDO.lat` (-23.4890) and `GOLDEN_PARK_CONDO.lng` (-47.4916) from `src/lib/constants.ts`. The coordinate order `[lat, lng]` is correct for Leaflet.

The likely cause of the map appearing at an incorrect location is a known Leaflet issue: when the map container is not yet fully rendered (e.g. inside a form that animates or expands), Leaflet calculates tile positions incorrectly. The fix is calling `map.invalidateSize()` after initialization to force Leaflet to recalculate.

## Changes

### 1. `src/components/LocationPicker.tsx` (line ~50, after `setMapStatus('ready')`)
Add a short timeout + `invalidateSize()` call:
```typescript
setTimeout(() => map.invalidateSize(), 100);
```

### 2. `src/components/SightingForm.tsx` (line ~64, after `setMapReady(true)`)
Same fix:
```typescript
setTimeout(() => map.invalidateSize(), 100);
```

### 3. `src/components/SightingMiniMap.tsx` (line ~43, after `mapRef.current = map`)
Same fix:
```typescript
setTimeout(() => map.invalidateSize(), 100);
```

### 4. `src/components/AlertMap.tsx` (line ~48, after `mapRef.current = map`)
Same fix:
```typescript
setTimeout(() => map.invalidateSize(), 100);
```

### 5. Add fixed reference marker to SightingMiniMap and AlertMap
Currently only LocationPicker and SightingForm have the amber reference marker. Add it to the other two:

**SightingMiniMap** — after creating the sighting marker, add:
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

**AlertMap** — same marker added after map init, before return cleanup.

### 6. Robust fallback with parseFloat in SightingMiniMap
Change lines 17-18 to handle string/zero values:
```typescript
const lat = parseFloat(String(location.lat)) || GOLDEN_PARK_CONDO.lat;
const lng = parseFloat(String(location.lng)) || GOLDEN_PARK_CONDO.lng;
```

**Files modified:** 4 (LocationPicker, SightingForm, SightingMiniMap, AlertMap)

