# Emergency Queue System - Quick Test Guide

## 🧪 Step-by-Step Testing

### Test 1: Register Patient with Rabies (CRITICAL)

**Step 1:** Go to Emergency Registration Page

```
Navigate to: http://localhost:3000/emergency
Click "Register Emergency Case" or similar button
```

**Step 2:** Fill in Registration Form

```
Patient ID: test_rabies_001
Symptoms: "rabies, excessive salivation, fever, muscle spasms"
```

**Step 3:** Verify AI Analysis

```
Expected CPU result:
✅ Priority: 1 (CRITICAL)
✅ Severity Assessment: Life-threatening
✅ Estimated Wait: 5 minutes
```

**Step 4:** Verify Receptionist Can See It

```
Navigate to: http://localhost:3000/emergency/receptionist
Should show:
✅ Case from test_rabies_001
✅ Status: Pending Review
✅ AI Priority: CRITICAL (red badge)
✅ Symptoms: rabies, excessive_salivation, fever, muscle_spasms
```

**Step 5:** Receptionist Approves

```
Click "Approve" button
Expected: Case moves from pending to waiting queue
```

**Step 6:** Doctor Queue Shows It

```
Navigate to: http://localhost:3000/emergency
Expected:
✅ Patient appears at TOP of queue
✅ Queue Position: 1
✅ Wait Time: ~5 minutes (not 30!)
```

---

### Test 2: Register Normal Patient (NORMAL)

**Step 1:** Register with mild symptoms

```
Symptoms: "mild headache"
```

**Step 2:** Verify AI Analysis

```
Expected:
✅ Priority: 3 (NORMAL)
✅ Wait Time: 30 minutes
```

**Step 3:** Receptionist Approves

**Step 4:** Verify Queue Order

```
Expected:
✅ If Rabies patient is already approved: appears AFTER rabies
✅ Rabies patient (P1) serves first
✅ Headache patient (P3) waits 30+ minutes
```

---

### Test 3: Receptionist Priority Override

**Step 1:** Register a Serious case (food poisoning)

```
Symptoms: "food poisoning, severe nausea, vomiting"
AI says: Priority 2 (SERIOUS)
```

**Step 2:** Receptionist Changes Priority

```
In receptionist panel:
Click "Approve as Critical" or change priority button
Select: Priority 1 (CRITICAL)
```

**Step 3:** Verify Updated Queue

```
Expected:
✅ Patient now has Priority 1
✅ Moved ABOVE other serious patients
✅ ETA recalculated
```

---

### Test 4: Receptionist Rejects Fake Case

**Step 1:** Register invalid symptoms

```
Symptoms: "just want attention"
```

**Step 2:** Receptionist Reviews

```
Appears in pending list as Priority 3 (low priority triage catches it)
```

**Step 3:** Click Reject

```
Expected: Case completely deleted from system
✅ No longer in pending
✅ Not in queue
```

---

## 🔍 Database Verification (Optional)

### Check if pending_approval status is being used:

#### Via SQL (if you have database access):

```sql
-- Check all patients in system
SELECT id, patientId, priority, status, arrivalTime
FROM emergency_queue
ORDER BY status, priority, arrivalTime;

-- Expected to see:
-- id | patientId | priority | status | arrivalTime
-- 1  | test_rabies_001 | 1 | pending_approval | 2024-...
```

#### Via API (easier):

```bash
# Get pending cases (receptionist view)
curl http://localhost:3000/api/emergency/receptionist/pending

# Get active queue (doctor view)
curl http://localhost:3000/api/emergency/queue

# Get next patient to serve
curl http://localhost:3000/api/emergency/next
```

---

## 📊 Expected Queue Behavior

### Scenario: 3 Patients Already in System

```
1. Patient A: Rabies (P1, arrived 10:00 AM)
2. Patient B: Backache (P3, arrived 10:05 AM)
3. Patient C: Food poisoning (P2, arrived 10:10 AM)
```

**Doctor sees queue (sorted correctly):**

```
Position 1: Patient A (Rabies, P1) - ETA: 0 min (now serving)
Position 2: Patient C (Food poison, P2) - ETA: 20 min (wait for A to finish)
Position 3: Patient B (Backache, P3) - ETA: 35 min (wait for A+C)
```

**Why these ETAs?**

```
P1 (Critical) = 20 min consultation
P2 (Serious) = 15 min consultation
P3 (Normal) = 10 min consultation

Patient C ETA = A's time = 20 min
Patient B ETA = A's time + C's time = 20 + 15 = 35 min
```

---

## ❌ Common Issues & Fixes

### Issue 1: Receptionist Page Shows No Cases

**Cause:** Cases might still be in `waiting` status (old data)
**Fix:** Clear database and test with fresh registration

```sql
DELETE FROM emergency_queue;
```

### Issue 2: AI Still Shows Priority 3 for Rabies

**Cause:** Cache issue or API not restarted
**Fix:**

1. Check that `/lib/triage.ts` has "rabies" in CRITICAL_KEYWORDS
2. Restart development server: `npm run dev`
3. Try again

### Issue 3: ETA Still Shows 30 Minutes for Critical Patient

**Cause:** `/lib/queueManager.ts` may not be updated
**Fix:**

1. Verify `CONSULTATION_TIME` object exists with different priorities
2. Verify `getFullQueue()` uses proper priority weighting
3. Restart server

### Issue 4: Can't Approve in Receptionist Page

**Cause:** API endpoints might not exist
**Fix:** Verify these files exist:

- ✅ `/app/api/emergency/receptionist/pending/route.ts`
- ✅ `/app/api/emergency/receptionist/approve/route.ts`
- ✅ `/app/api/emergency/receptionist/reject/route.ts`

---

## 🚀 What to Test For (Checklist)

- [ ] Rabies patient AI analysis shows Priority 1 (Critical)
- [ ] Rabies patient appears in receptionist pending list
- [ ] Receptionist can click "Approve" without errors
- [ ] After approval, patient moves to doctor queue
- [ ] Rabies patient is at TOP of doctor queue (Position 1)
- [ ] Wait time shows ~5 minutes (not 30)
- [ ] If add normal patient after, rabies stays above
- [ ] Receptionist can change priority on override
- [ ] Receptionist can reject fake cases
- [ ] Rejected cases don't appear in any list

### ✅ All Passing = System is FIXED!

---

## 📞 Need Help?

If something doesn't work:

1. **Check Files Modified:**
   - `/lib/triage.ts` - Has "rabies" keyword?
   - `/lib/queueManager.ts` - Has CONSULTATION_TIME object?
   - `/app/api/emergency/analyze/route.ts` - Temperature is 0.1?
   - `/config/schema.tsx` - Default status is 'pending_approval'?

2. **Check API Responses:**

   ```bash
   # Test analyze endpoint
   curl -X POST http://localhost:3000/api/emergency/analyze \
     -H "Content-Type: application/json" \
     -d '{"symptoms": ["rabies", "fever"]}'

   # Should return: priority: 1
   ```

3. **Restart Everything:**

   ```bash
   # Stop dev server (Ctrl+C)
   npm run dev
   ```

4. **Check Console for Errors:**
   - Open browser DevTools (F12)
   - Check Console tab for JavaScript errors
   - Check Network tab for API failures

---

## 📝 Success Criteria

| Test                         | Expected           | Status     |
| ---------------------------- | ------------------ | ---------- |
| Rabies patient AI shows P1   | ✅ P1 Critical     | ⏳ Test it |
| Appears in receptionist list | ✅ Yes             | ⏳ Test it |
| Can approve                  | ✅ No errors       | ⏳ Test it |
| Moves to doctor queue        | ✅ Yes, Position 1 | ⏳ Test it |
| Wait time is 5-30 min        | ✅ ~5 min          | ⏳ Test it |
| NOT 30 min for single P1     | ✅ Correct         | ⏳ Test it |

---

**Once all tests pass → System is PRODUCTION READY!**
