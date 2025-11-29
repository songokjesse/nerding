# Mobile App SIL Implementation - Quick Reference

## 📱 What You're Building

Add support for **SIL (house-based) shifts** to your React Native mobile app, where workers can document care for multiple residents at a single location.

---

## 🎯 Key Changes

### 1. **Shift Types**
- **Traditional**: Worker → Single Client
- **SIL**: Worker → House (with multiple residents)

### 2. **UI Updates**
- Shift list: Show "SIL House" badge
- Shift detail: Display resident list
- Add note: Resident selector dropdown
- Add observation: Resident selector (filtered by modules)

### 3. **API Changes**
- `shift.client` can now be `null`
- New `shift.site` object with residents
- Must send `clientId` when creating notes/observations for SIL shifts

---

## 📋 Implementation Checklist

### Phase 1: Types (1 hour)
- [ ] Add `Resident` interface
- [ ] Add `Site` interface  
- [ ] Make `Shift.client` nullable
- [ ] Add `isSILShift()` type guard

### Phase 2: Components (4-6 hours)
- [ ] Create `ResidentSelector` component
- [ ] Update `ShiftCard` to show SIL badge
- [ ] Update `ShiftDetailScreen` with resident list
- [ ] Update `AddNoteScreen` with resident selector
- [ ] Update `AddObservationScreen` with resident selector

### Phase 3: API (1 hour)
- [ ] Add `clientId` to `createNote()` request
- [ ] Add `clientId` to `createObservation()` request

### Phase 4: Testing (2-3 hours)
- [ ] Test traditional shift flow (unchanged)
- [ ] Test SIL shift with resident selection
- [ ] Test error handling (no resident selected)

---

## 🔑 Critical Code Snippets

### Type Guard
```typescript
function isSILShift(shift: Shift): shift is Shift & { site: Site } {
  return shift.client === null && shift.site !== undefined
}
```

### Resident Selector Usage
```tsx
{isSILShift(shift) && (
  <ResidentSelector
    residents={shift.site.residents}
    selectedResidentId={selectedResidentId}
    onSelect={setSelectedResidentId}
  />
)}
```

### API Call with clientId
```typescript
await api.createNote(shiftId, {
  noteText: 'Care provided',
  clientId: selectedResidentId  // Required for SIL
})
```

---

## 📚 Documentation

- **API Spec**: [MOBILE_API.md](file:///Users/codelab/Desktop/Projects/nerding/MOBILE_API.md)
- **Detailed Plan**: [mobile_implementation_plan.md](file:///Users/codelab/.gemini/antigravity/brain/e7ecc814-e060-49b2-a00b-789976000547/mobile_implementation_plan.md)
- **Backend Docs**: [SIL_ARCHITECTURE.md](file:///Users/codelab/Desktop/Projects/nerding/SIL_ARCHITECTURE.md)

---

## ⏱️ Timeline

**Total**: 8-11 hours
- Types: 1h
- UI: 4-6h  
- API: 1h
- Testing: 2-3h

---

## ✅ Success Criteria

- [ ] Traditional shifts work unchanged
- [ ] SIL shifts display site name and residents
- [ ] Workers can select resident when adding notes
- [ ] Workers can select resident when adding observations
- [ ] App doesn't crash when `client` is null
- [ ] Validation prevents submitting without resident selection

---

**Ready to start?** Begin with Phase 1 (types) in the detailed plan!
