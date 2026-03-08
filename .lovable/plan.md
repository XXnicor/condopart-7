

# Use GOLDEN_PARK_CONDO constant across the app

## Changes

### 1. `src/pages/CondoSelection.tsx` — Auto-assign condo, no selection UI
- Remove all condo list fetching, role selection, and selection UI
- On mount, automatically `UPDATE profiles SET condominium_id = GOLDEN_PARK_CONDO.id, role = 'resident'` for the current user
- Show a centered loading screen: Building2 icon (amber-500, 48px), condo name, address subtitle, spinner, "Configurando seu acesso..."
- On success: `refreshProfile()` then `navigate('/')`
- On failure: show error message with "Tentar novamente" button

### 2. `src/components/LocationPicker.tsx` — Center on Golden Park
- Import `GOLDEN_PARK_CONDO` from constants
- Replace all hardcoded `-23.5015, -47.4526` fallbacks with `GOLDEN_PARK_CONDO.lat` / `GOLDEN_PARK_CONDO.lng`
- Set initial view to `[GOLDEN_PARK_CONDO.lat, GOLDEN_PARK_CONDO.lng]` at zoom `GOLDEN_PARK_CONDO.zoom`
- Remove the Nominatim fetch for the hardcoded address (it was just resolving to the same coords)
- Set `minZoom: 14` on the map options
- Add a fixed (non-draggable) reference marker at the condo center with amber color and popup showing the condo name

### 3. `src/components/SightingForm.tsx` — Center on Golden Park
- Import `GOLDEN_PARK_CONDO` from constants
- Replace hardcoded `-23.5015, -47.4526` fallbacks with `GOLDEN_PARK_CONDO.lat` / `GOLDEN_PARK_CONDO.lng`
- Use `GOLDEN_PARK_CONDO.zoom` for default zoom
- Set `minZoom: 14`
- Add the same fixed reference marker

### 4. `src/components/SightingMiniMap.tsx` — Golden Park fallback
- Import `GOLDEN_PARK_CONDO` from constants
- If `location.lat` / `location.lng` are falsy (0 or undefined), use Golden Park coords as fallback

### 5. `src/components/AlertMap.tsx` — Golden Park fallback
- Import `GOLDEN_PARK_CONDO` from constants
- When no sightings have locations, use Golden Park coords as center fallback instead of returning null

### Technical details

**CondoSelection simplified logic:**
```typescript
useEffect(() => {
  if (!user) return;
  const assignCondo = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({ condominium_id: GOLDEN_PARK_CONDO.id, role: 'resident' })
      .eq('id', user.id);
    if (error) { setFailed(true); return; }
    await refreshProfile();
    navigate('/');
  };
  assignCondo();
}, [user]);
```

**Reference marker (Leaflet divIcon):**
```typescript
const refIcon = L.divIcon({
  className: '',
  html: `<div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:#f59e0b;border-radius:50%;color:white;font-size:14px;">🏢</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});
L.marker([GOLDEN_PARK_CONDO.lat, GOLDEN_PARK_CONDO.lng], { icon: refIcon, interactive: true })
  .addTo(map)
  .bindPopup(GOLDEN_PARK_CONDO.name);
```

**Files modified:** 5 files, 0 new files, 0 DB migrations needed.

