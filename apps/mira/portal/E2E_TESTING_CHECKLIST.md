# MIRA Portal — E2E Testing Checklist (Session 2)

## Pre-Test Setup
- [ ] Deploy to Vercel: `vercel --prod` from `apps/mira/portal`
- [ ] Verify 3 users can login (Natalia, Carlos, Alessandro)
- [ ] Verify each user sees their assigned client

---

## Test 1: Multi-Tenant Auth ✅
- [ ] **Login as Natalia** → should see Dadybox
- [ ] **Login as Carlos** → should see Salsa Burgers
- [ ] **Login as Alessandro** → should see Discoolver
- [ ] **Cross-client isolation** → Natalia cannot access Carlos's data via URL manipulation

---

## Test 2: Brand Brain Editor
- [ ] **Navigate to /brand-brain**
- [ ] **Edit Brand Name** → save → reload → value persists
- [ ] **Edit Mission** → save → verify in quick action generation
- [ ] **Add Tone of Voice attributes** → save → verify
- [ ] **Edit Values** → add 3+ values → save → reload → all persist

---

## Test 3: Quick Actions with Real Data
- [ ] **Go to Comercial department**
- [ ] **Click "Crear Campaña"** → fill form → Generate
  - [ ] Loading state shows "Generating..."
  - [ ] Result appears with real Claude data
  - [ ] Output type detected correctly (document/json)
  - [ ] Success card shows "Ready"
  
- [ ] **Click "Save to Memory"**
  - [ ] Loading state activates
  - [ ] Success message appears
  - [ ] Can close and reopen, action still shows success state
  
- [ ] **Click "Save to Google Drive"** (if MCP configured)
  - [ ] Opens file in Google Drive
  - [ ] Document contains generated content
  - [ ] Filename includes timestamp

---

## Test 4: Project Memory System
- [ ] **Navigate to /project-memory**
- [ ] **Filter by category**
  - [ ] "All" shows all saved actions
  - [ ] "Action" shows only action-type items
  - [ ] "Insight" shows only insight-type items
  - [ ] Other filters work
  
- [ ] **Pin an item**
  - [ ] Pinned items float to top
  - [ ] Pin icon shows filled
  
- [ ] **Archive an item**
  - [ ] Item disappears from list
  - [ ] Count updates
  
- [ ] **View memory across multiple quick actions**
  - [ ] Create 5 different quick actions
  - [ ] Save each to memory
  - [ ] All 5 appear on /project-memory page

---

## Test 5: Document Upload
- [ ] **Navigate to /documents**
- [ ] **Drag & drop a file** → document appears in list
- [ ] **Upload via "Choose File"** → same result
- [ ] **Delete document** → confirm → disappears
- [ ] **File metadata displayed** → type, size, date all show

---

## Test 6: Brand Brain + Toolkit Integration
- [ ] **Set Brand Brain data** (mission, tone, values)
- [ ] **Generate a toolkit action** (any tool)
- [ ] **Verify Brand Brain is referenced in prompt**
  - [ ] Mission appears in generation
  - [ ] Tone is followed in output
  - [ ] Values influence content

---

## Test 7: Multi-Department Actions
- [ ] **Test one action from each department:**
  - [ ] Comercial: Crear Campaña
  - [ ] Marketing: Crear Post
  - [ ] Strategy: Generar Reporte
  - [ ] Community: Responder Ticket
  
- [ ] **Save each to Project Memory** (4 actions)
- [ ] **Verify on /project-memory**
  - [ ] All 4 appear
  - [ ] Department tags visible
  - [ ] Categories correct

---

## Test 8: Build & Performance
- [ ] **Run `npm run build`** → no errors
- [ ] **Check Lighthouse** (mobile)
  - [ ] FCP < 2.5s
  - [ ] LCP < 4s
  - [ ] CLS < 0.1
- [ ] **Check page load** on /toolkit, /brand-brain, /documents, /project-memory
  - [ ] All load within 3s

---

## Test 9: Error Handling
- [ ] **Try to access /toolkit as unauthorized user** → 401 or redirect
- [ ] **Try invalid form submission** → validation errors show
- [ ] **Disconnect network mid-save** → graceful error message
- [ ] **Save without Brand Brain data** → warning or uses defaults

---

## Pass/Fail Criteria
- ✅ **PASS** if 90%+ tests pass
- ⚠️ **CONDITIONAL** if 75-90% pass (document blockers)
- ❌ **FAIL** if <75% pass (do not deploy)

---

## Blockers Found
- [ ] _None yet_

## Notes
- Tests should run as each user (Natalia, Carlos, Alessandro)
- Test on desktop Chrome + mobile Safari for best coverage
- Verify timestamps match UTC in database

---

**Date Tested:** _______________  
**Tested By:** _______________  
**Result:** ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL
