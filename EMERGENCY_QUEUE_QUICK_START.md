# Emergency Queue System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites

- ✅ EchoDoc app running (`npm run dev`)
- ✅ Clerk authentication configured
- ✅ OpenRouter API key set in `.env`
- ✅ Database connected with Drizzle ORM

### Step 1: Verify Navigation (1 min)

1. Open http://localhost:3000/dashboard
2. Look at the navbar - you should see:
   - Home | **🔴 Emergency** | Pricing | History | Profile
3. The Emergency button should have **red highlight**
4. Click it - you're navigated to `/emergency`

✅ **Navigation working!**

---

### Step 2: Register a Test Patient (2 min)

1. Click "Emergency" → Click "Register Patient"
2. Or go directly to `/emergency/register`
3. Fill the form:

```
Patient Name: John Doe
Age: 52
Symptoms:
  Chest pain
  Sweating
  Difficulty breathing

Emergency Description:
  Sudden severe chest pain started 15 minutes ago at rest

Upload Image: (skip for now)
```

4. Click "Analyze with AI"
5. Wait 3-5 seconds for AI analysis
6. You should see:
   - 🔴 **CRITICAL** priority
   - Reason: "Symptoms indicate possible cardiac emergency"
   - Severity Score: 9.2/10
7. Click "Submit for Approval"
8. You're redirected to `/emergency/status`

✅ **Registration & AI working!**

---

### Step 3: Approve Case as Receptionist (1 min)

1. Go to `/emergency/receptionist`
2. You should see **1 Pending Case** from step 2
3. See the case card with:
   - Patient ID: john_doe
   - Symptoms listed
   - AI Priority: CRITICAL (red badge)
4. Click the red "Confirm CRITICAL" button
5. Case disappears from pending
6. Toast says: "✓ Case approved to queue"

✅ **Receptionist approval working!**

---

### Step 4: View Queue as Doctor (1 min)

1. Go to `/emergency` (Doctor/Staff Dashboard)
2. You should see:
   - **Section 1**: "Now Serving" - John Doe (Critical)
     - Priority badge: 🔴 CRITICAL
     - Symptoms: Chest pain, Sweating, Difficulty breathing
     - "Serve Next" button (greyed out - no more patients)
   - **Section 2**: List of patients in queue
     - Shows john_doe in table
     - Est. Wait: 0 min (highest priority)

✅ **Queue visualization working!**

---

### Step 5: Add Second Patient & See Queue Order

1. Back to `/emergency/register`
2. Register another patient:

```
Patient Name: Jane Smith
Age: 34
Symptoms:
  Broken left leg
  Severe pain
  Swelling
```

3. Click "Analyze with AI"
4. Should get: 🟠 **SERIOUS** priority (2)
5. Click "Submit for Approval"
6. Go to `/emergency/receptionist`
7. Click "Confirm SERIOUS"
8. Go to `/emergency` queue page

You should now see queue ordered as:

```
1. John Doe (Critical) - Highest Priority
2. Jane Smith (Serious) - Lower Priority
```

✅ **Priority sorting working!**

---

### Step 6: Patient Status Tracking

1. After registering Jane Smith, you're at `/emergency/status?patientId=jane_smith`
2. You should see:
   - Your Case: Jane Smith
   - Queue Position: **2 of 2**
   - Priority: 🟠 SERIOUS
   - Est. Wait Time: **20 minutes**
     - (Because John is ahead and takes 20 min for critical case)
   - Status: WAITING
3. "Other Patients in Queue (1)": Shows John Doe ahead of you
4. Refresh page - wait time should update as John's case progresses

✅ **Patient status tracking working!**

---

### Step 7: Doctor Serves Patient

1. Go to `/emergency` (Doctor view)
2. Click "Serve Next" button under "Now Serving"
3. John Doe moves from "Now Serving" to the completed list
4. Queue updates - Jane Smith now at top "Now Serving"
5. Toast: "✓ Now serving next patient"

✅ **Serve workflow working!**

---

## 🧪 Testing Different Scenarios

### Scenario 1: Critical Case

```
Name: Accident Victim
Symptoms: Choking, Unconscious, Severe bleeding
Expected: Priority 1 (Critical)
Queue Position: 1st
```

### Scenario 2: Serious Case

```
Name: Fever Patient
Symptoms: High fever 104F, Severe headache, Vomiting
Expected: Priority 2 (Serious)
Queue Position: 2nd (after critical cases)
```

### Scenario 3: Normal Case

```
Name: Common Cold
Symptoms: Mild cough, Runny nose, Slight fatigue
Expected: Priority 3 (Normal)
Queue Position: 3rd (after critical & serious)
```

### Scenario 4: Receptionist Overrides

1. Register a patient as Normal (Priority 3)
2. Receptionist sees it as Normal
3. In approval, click "⬆️" to change to Serious (Priority 2)
4. Submit with higher priority
5. In queue, patient now comes before other Normal cases

✅ **Override working!**

---

## ✅ Full System Test Checklist

- [ ] **Navigation**: Emergency tab appears with red highlight
- [ ] **Registration**: Form accepts patient data
- [ ] **Image Upload**: Can upload and preview images
- [ ] **AI Analysis**: Analyze button triggers AI triage
- [ ] **Priority Assessment**: Critical/Serious/Normal classification correct
- [ ] **Pending Cases**: Receptionist sees pending in `/emergency/receptionist`
- [ ] **Approval**: Case moves to queue when approved
- [ ] **Queue Visualization**: Shows patients in priority order
- [ ] **Real-Time Updates**: Queue refreshes every 5 seconds
- [ ] **Wait Time**: Calculated based on queue position
- [ ] **Patient Status**: Patient sees their position and wait time
- [ ] **Doctor Workflow**: Can serve and complete patients
- [ ] **Queue Reordering**: New critical cases go to top

---

## 🔧 Debugging Tips

### Case not appearing in queue?

```
✓ Check: Is it in "waiting" status? (not "pending_approval")
✓ Check: Did receptionist actually approve it?
✓ Check: Database has the record
Solution: Go to /emergency/receptionist and approve
```

### AI analysis not working?

```
✓ Check: OPEN_ROUTER_API_KEY in .env
✓ Check: Browser console for error messages
✓ Check: API response in Network tab
Solution: Verify API key has credits and is valid
```

### Queue not updating?

```
✓ Check: Refresh page (manual refresh)
✓ Check: Wait 5 seconds (auto-refresh interval)
✓ Check: browser DevTools Network tab
Solution: Check for JS errors in console
```

### Patient ID conflicts?

```
Issue: "Patient ID already registered"
Solution: Use different patient name
(Names like "John Doe" → "john_doe" must be unique)
```

---

## 📊 Expected Performance

| Operation       | Expected Time   |
| --------------- | --------------- |
| Load queue      | <100ms          |
| Analyze with AI | 2-5 seconds     |
| Approve case    | <500ms          |
| Fetch queue     | <100ms          |
| Auto-refresh    | Every 5 seconds |

---

## 🎯 Common Workflows

### For Receptionist

1. Patient arrives
2. Click Emergency → Register
3. Fill form and click "Analyze"
4. Review AI assessment
5. Click "Submit for Approval"
6. Go to Receptionist tab
7. Review and approve cases
8. Back to registration when new patient arrives

### For Doctor

1. Navigate to Emergency tab
2. See "Now Serving" section
3. Note patient details (symptoms, priority, duration)
4. Treat the patient
5. Click "Mark Completed"
6. System automatically loads next patient
7. Repeat

### For Patient

1. After registration, view `/emergency/status` automatically
2. See their queue position
3. Estimated wait time updates in real-time
4. When status is "serving", check in at desk
5. When status is "completed", case is done

---

## 🚨 Troubleshooting

### Problem: "Receptionist access required" error

**Solution:**

1. Check your email matches admin emails in code:
   - `shivanshuk186@gmail.com`
   - `admin@medicalagent.com`
2. Update in `/app/api/emergency/receptionist/approve/route.ts`:
   ```typescript
   const ADMIN_EMAILS = ["your-email@example.com"];
   ```

### Problem: Queue appears empty

**Solution:**

1. Register a patient first
2. Approve it in receptionist panel
3. Approved cases have `status: 'waiting'`
4. Only waiting/serving patients show in queue

### Problem: AI always gives same priority

**Solution:**

1. Check OPEN_ROUTER_API_KEY is set
2. Try different symptoms (e.g., "chest pain" → Priority 1)
3. Check API credits haven't expired
4. Fallback logic may be triggering - check browser console

---

## 📈 Next Steps

Once system is verified working:

1. **Add more API endpoints** for additional features
2. **Create patient mobile app** for real-time tracking
3. **Add notifications** (SMS/email updates)
4. **Set up analytics** dashboard for queue metrics
5. **Implement** video consultation pre-call
6. **Scale** to multiple hospital locations
7. **Train custom** ML model on historical data

---

## 📞 You're Ready! 🎉

The Emergency Queue System is now fully operational. Start using it:

- **Receptionist**: Go to `/emergency/register`
- **Doctor**: Go to `/emergency`
- **Patient**: After registration, view `/emergency/status`

**Test the complete workflow end-to-end!**

---

**Last Updated**: March 17, 2024
