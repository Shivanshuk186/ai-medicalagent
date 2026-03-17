# Emergency Queue System - Testing & Verification Checklist

## ✅ Pre-Launch Testing Checklist

Use this checklist to verify that all Emergency Queue features are working correctly before going live.

---

## 🔧 Setup Verification (Before Testing)

- [ ] Development server running (`npm run dev`)
- [ ] Database connection active (Drizzle ORM)
- [ ] Clerk authentication configured
- [ ] `.env` file has `OPEN_ROUTER_API_KEY` set
- [ ] All files compiled without errors (`npm run lint`)
- [ ] Package dependencies up to date

---

## 🎯 UI/UX Testing

### Navigation

- [ ] Red **Emergency** button visible in navbar
- [ ] Emergency button click navigates to `/emergency`
- [ ] All navigation links work correctly
- [ ] Button styling is correct (red background when active)
- [ ] Mobile responsive design works

### Registration Page (`/emergency/register`)

- [ ] Page loads without errors
- [ ] All form fields visible and functional
- [ ] Patient Name field accepts text input
- [ ] Age field accepts numbers only
- [ ] Symptoms textarea allows multi-line input
- [ ] Emergency Description field displays
- [ ] Image upload button clickable
- [ ] Image preview shows after upload
- [ ] Image removal button works
- [ ] "Analyze with AI" button enabled when required fields filled
- [ ] "Analyze with AI" button disabled when fields empty
- [ ] Form validation shows error messages
- [ ] Loading spinner shows during analysis

### AI Analysis Review

- [ ] AI analysis modal displays correctly
- [ ] Priority level shows with correct color:
  - 🔴 Red for Critical (Priority 1)
  - 🟠 Orange for Serious (Priority 2)
  - 🟢 Green for Normal (Priority 3)
- [ ] AI reason text displays
- [ ] Severity score visible with progress bar
- [ ] "Back" button returns to form
- [ ] "Submit for Approval" button redirects to status page
- [ ] Success message displays

### Receptionist Page (`/emergency/receptionist`)

- [ ] Page accessible only when logged in
- [ ] Pending cases table displays
- [ ] Case cards show:
  - Patient ID
  - Symptoms
  - AI Priority badge
  - Action buttons
- [ ] Approval button moves case to queue
- [ ] Priority override buttons work
- [ ] Rejection button removes case
- [ ] Toast notifications show for actions
- [ ] Stats section updates after approval/rejection
- [ ] Loading states show during actions

### Doctor Dashboard (`/emergency`)

- [ ] Queue page displays correctly
- [ ] "Now Serving" section shows:
  - Patient name/ID
  - Symptoms
  - Priority badge
  - Estimated duration
- [ ] Queue list displays patients
- [ ] Priority badges show correct colors
- [ ] Estimated wait times display
- [ ] Queue refreshes every 5 seconds
- [ ] "Serve Next" button works
- [ ] "Mark Completed" button works
- [ ] Queue reorders when patients served
- [ ] Empty queue message shows when no patients

### Patient Status Page (`/emergency/status`)

- [ ] Auto-accessible after registration
- [ ] Patient's priority level displays
- [ ] Queue position shows (e.g., "2 of 5")
- [ ] Estimated waiting time calculated correctly
- [ ] Current status shows (pending/waiting/serving/completed)
- [ ] Other patients in queue list visible
- [ ] Page auto-refreshes every 5 seconds
- [ ] Time updates in real-time

---

## 🔌 API Testing

### Registration API

**Test**: `POST /api/emergency/register`

```json
Request:
{
  "patientName": "Test Patient",
  "patientId": "test_patient",
  "age": 45,
  "symptoms": ["chest pain", "sweating"],
  "emergencyDescription": "Sudden chest pain",
  "priority": 1,
  "aiAnalysis": {
    "reason": "Critical symptoms",
    "severity_score": 9.5
  }
}

Expected Response (200):
{
  "success": true,
  "queueItem": {
    "id": 1,
    "status": "pending_approval",
    "patientId": "test_patient"
  }
}
```

- [ ] Returns 200 status
- [ ] Creates record in database
- [ ] Status set to `pending_approval`
- [ ] `patientId` unique validation works
- [ ] Error handling for invalid data

### AI Analysis API

**Test**: `POST /api/emergency/analyze`

```json
Request:
{
  "symptoms": "chest pain, sweating, difficulty breathing"
}

Expected Response (200):
{
  "success": true,
  "priority": 1,
  "reason": "Symptoms suggest cardiac emergency",
  "severity_score": 9.2
}
```

- [ ] Returns analysis within 5 seconds
- [ ] Correct priority assigned
- [ ] Severity score between 0-10
- [ ] Reason text provided
- [ ] Error handling for API failures

### Pending Cases API

**Test**: `GET /api/emergency/pending`

- [ ] Requires authentication
- [ ] Requires receptionist role
- [ ] Returns array of pending cases
- [ ] Includes correct fields
- [ ] Filtered by status: `pending_approval`
- [ ] Sorted by arrival time

### Approval API

**Test**: `POST /api/emergency/receptionist/approve`

```json
Request:
{
  "caseId": 1,
  "priority": 1
}

Expected Response (200):
{
  "success": true,
  "queueItem": {
    "status": "waiting",
    "approvedBy": "email@example.com",
    "approvedAt": "2024-03-17T10:30:00Z"
  }
}
```

- [ ] Requires authentication
- [ ] Requires receptionist role
- [ ] Updates status to `waiting`
- [ ] Records approver email
- [ ] Records approval timestamp
- [ ] Case appears in queue after approval
- [ ] Invalid case ID returns 404

### Queue API

**Test**: `GET /api/emergency/queue`

- [ ] Returns all waiting/serving patients
- [ ] Sorted by (priority asc, arrivalTime asc)
- [ ] Includes `estimatedWaitingMinutes` field
- [ ] Correct wait time calculations
- [ ] No pending_approval patients included
- [ ] No completed patients included

### Next Patient API

**Test**: `GET /api/emergency/next`

- [ ] Returns highest priority waiting patient
- [ ] Returns null if no patients waiting
- [ ] Only returns patients in `waiting` status

### Serve Patient API

**Test**: `POST /api/emergency/serve`

```json
Request:
{
  "assignedDoctor": "doctor@example.com"
}

Expected Response (200):
{
  "success": true,
  "nextPatient": {
    "id": 1,
    "status": "serving"
  }
}
```

- [ ] Marks previous serving patient as completed
- [ ] Moves waiting patient to serving
- [ ] Only one patient in serving status
- [ ] Returns null when queue empty
- [ ] Assigns doctor email correctly

### Complete Patient API

**Test**: `POST /api/emergency/complete`

```json
Request:
{
  "patientId": "test_patient"
}

Expected Response (200):
{
  "success": true,
  "completedPatient": {
    "status": "completed",
    "completedAt": "2024-03-17T10:50:00Z"
  }
}
```

- [ ] Updates status to `completed`
- [ ] Records completion timestamp
- [ ] Patient removed from queue
- [ ] Patient accessible in history

---

## 🧪 Workflow Testing

### Workflow 1: Complete Patient Journey

**Setup**: Clear queue (optional)

**Steps**:

1. [ ] Go to `/emergency/register`
2. [ ] Fill form:
   - Name: "John Doe"
   - Age: 52
   - Symptoms: "Chest pain, Sweating, Difficulty breathing"
3. [ ] Click "Analyze with AI"
4. [ ] Verify AI returns Priority 1 (Critical)
5. [ ] Review assessment shows correct details
6. [ ] Click "Submit for Approval"
7. [ ] Redirected to `/emergency/status?patientId=john_doe`
8. [ ] Status shows "WAITING FOR APPROVAL"
9. [ ] Go to `/emergency/receptionist`
10. [ ] See pending case for John Doe
11. [ ] Click "Confirm CRITICAL"
12. [ ] Case disappears from pending
13. [ ] Go to `/emergency`
14. [ ] See John Doe in "Now Serving"
15. [ ] Click "Serve Next"
16. [ ] John moves to serving
17. [ ] All steps completed ✅

### Workflow 2: Multiple Patients Priority Sorting

**Setup**: Register 3 patients

**Patient A**:

- Name: "Alice"
- Symptoms: "Choking" → Priority 1 (Critical)

**Patient B**:

- Name: "Bob"
- Symptoms: "Fever" → Priority 3 (Normal)

**Patient C**:

- Name: "Charlie"
- Symptoms: "Broken leg" → Priority 2 (Serious)

**Steps**:

1. [ ] Register all 3 patients
2. [ ] Approve all in receptionist
3. [ ] Check `/emergency` queue
4. [ ] Verify order: Alice (1), Charlie (2), Bob (3)
5. [ ] Order is NOT arrival time but PRIORITY
6. [ ] Critical comes before Serious
7. [ ] Serious comes before Normal ✅

### Workflow 3: Waiting Time Calculation

**Setup**: Have 2+ patients in queue

**Steps**:

1. [ ] Register Patient A (Critical)
2. [ ] Register Patient B (Serious)
3. [ ] Approve both
4. [ ] Patient A: est. wait = 0 min (next to serve)
5. [ ] Patient B: est. wait = 20 min (Critical takes 20 min)
6. [ ] Serve Patient A (click "Serve Next")
7. [ ] Patient A: now serving
8. [ ] Patient B: est. wait = 0 min (now next)
9. [ ] Wait times update dynamically ✅

### Workflow 4: Receptionist Priority Override

**Setup**: Ready to test override

**Steps**:

1. [ ] Register patient with normal symptoms → Priority 3
2. [ ] Go to receptionist
3. [ ] See patient with Priority 3 (Normal)
4. [ ] Click "⬆️" button to upgrade to Priority 2
5. [ ] Click "Confirm SERIOUS"
6. [ ] Approve
7. [ ] Go to queue
8. [ ] Patient appears in Serious section
9. [ ] Comes before other Normal cases ✅

### Workflow 5: Case Rejection

**Steps**:

1. [ ] Register a patient
2. [ ] Go to receptionist
3. [ ] See pending case
4. [ ] Click "❌" (reject button)
5. [ ] Toast: "Case rejected"
6. [ ] Case disappears from pending
7. [ ] Patient NOT in queue
8. [ ] Patient NOT in doctor dashboard ✅

---

## 📊 Data Integrity Testing

### Database Validation

- [ ] Patient IDs are unique (duplicate test should fail)
- [ ] Priority values only 1, 2, or 3
- [ ] Status values only: pending_approval, waiting, serving, completed
- [ ] Timestamps in ISO format
- [ ] Foreign keys valid

### Status Transitions

- [ ] New patients: start as `pending_approval` ✓
- [ ] After approval: `pending_approval` → `waiting` ✓
- [ ] Start serving: `waiting` → `serving` ✓
- [ ] Complete: `serving` → `completed` ✓
- [ ] No backward transitions allowed

### Data Consistency

- [ ] Only one patient in `serving` status at a time
- [ ] `approvedBy` and `approvedAt` set together
- [ ] `completedAt` only set when status = `completed`
- [ ] `createdBy` same for registration flow
- [ ] Arrival time same across all steps

---

## 🔐 Security Testing

### Authentication

- [ ] Unauthenticated users redirected to login
- [ ] Non-authenticated requests return 401
- [ ] Clerk user info retrieved correctly

### Authorization

- [ ] Only receptionist emails can approve/reject
- [ ] Using wrong email shows 403 error
- [ ] Doctor can view queue (no role check needed)
- [ ] Patient can only see their own status

### Input Validation

- [ ] Empty name rejected
- [ ] Empty symptoms rejected
- [ ] Invalid age numbers rejected
- [ ] Large images rejected (>5MB)
- [ ] SQL injection attempts blocked
- [ ] XSS attempts in text fields blocked

---

## ⚡ Performance Testing

### Response Times

- [ ] Queue load: <200ms
- [ ] AI analysis: 2-5 seconds
- [ ] Approval: <1 second
- [ ] Serve next: <500ms
- [ ] Complete: <500ms

### Load Testing

- [ ] With 5 patients: System responsive
- [ ] With 20 patients: Still under 500ms load
- [ ] Queue sorting: O(n) performance acceptable
- [ ] Auto-refresh: No lag after 10+ refreshes

### Browser Testing

- [ ] Page renders in Chrome
- [ ] Page renders in Firefox
- [ ] Page renders in Safari
- [ ] Mobile responsiveness works
- [ ] No console errors/warnings

---

## 🐛 Bug Hunt Checklist

### Common Issues to Check

- [ ] Form fields clear after submission
- [ ] Loading spinners appear/disappear correctly
- [ ] Toast notifications display and auto-close
- [ ] Buttons disabled during loading
- [ ] Modal overlays work properly
- [ ] Back buttons navigate correctly
- [ ] Page refresh doesn't lose state
- [ ] Emoji and special characters display
- [ ] Long text truncates properly
- [ ] Dates format consistently

### Edge Cases

- [ ] Patient name with spaces: "John Doe" → "john_doe" ✓
- [ ] Very long symptoms (500+ chars) handled
- [ ] Multiple rapid API calls handled
- [ ] Offline/poor connection handled
- [ ] Very old timestamps display correctly
- [ ] Future dates don't break system
- [ ] Leap years handled in timestamps

---

## 📝 Documentation Verification

- [ ] EMERGENCY_QUEUE_SYSTEM_GUIDE.md is complete
- [ ] EMERGENCY_QUEUE_QUICK_START.md is accurate
- [ ] All API examples work as documented
- [ ] Code comments are clear
- [ ] README updated with emergency system info
- [ ] Deployment guide created (if needed)
- [ ] Environment variables documented

---

## 🎯 Sign-Off Checklist

**Before marking as complete:**

- [ ] All tests passed
- [ ] No errors in console
- [ ] No TypeScript errors
- [ ] Code review completed
- [ ] Documentation reviewed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Mobile tested
- [ ] Cross-browser tested
- [ ] Stakeholder review done

---

## 📊 Test Results Summary

| Category       | Status | Notes |
| -------------- | ------ | ----- |
| UI Components  | ✅/❌  |       |
| API Endpoints  | ✅/❌  |       |
| Workflows      | ✅/❌  |       |
| Data Integrity | ✅/❌  |       |
| Security       | ✅/❌  |       |
| Performance    | ✅/❌  |       |
| Documentation  | ✅/❌  |       |
| **Overall**    | ✅/❌  |       |

---

## 🚀 Launch Criteria

System is ready for launch when:

- [x] All tests passed
- [x] No critical bugs found
- [x] Documentation complete
- [x] Performance acceptable (<500ms)
- [x] Security verified
- [x] Stakeholder approved

**Launch Date**: ******\_\_\_******
**Tested By**: ******\_\_\_******
**Approved By**: ******\_\_\_******

---

## 📞 Post-Launch Monitoring

Monitor these metrics after launch:

- API response times (target: <500ms)
- Queue processing speed
- Patient satisfaction (if surveys available)
- Error frequency (target: <0.5%)
- System uptime (target: >99%)
- AI accuracy (check manual approvals)
- User feedback on usability

---

**Document Version**: 1.0
**Last Updated**: March 17, 2024
