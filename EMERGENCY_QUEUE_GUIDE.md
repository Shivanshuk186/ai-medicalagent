# SmartMedic Emergency Queue System - Complete Integration Guide

This document outlines the **AI-powered emergency triage and smart patient queue management** system integrated into EchoDoc AI.

---

## 🚀 System Overview

The SmartMedic Emergency Queue system provides:

- **AI-Powered Symptom Analysis** using Gemini API (OpenRouter)
- **Automatic Priority Classification** (Critical, Serious, Normal)
- **Smart Patient Queue Management** with real-time updates
- **Receptionist Verification Flow** for approval/rejection
- **Doctor Dashboard** showing next patient and queue status
- **Patient Details** including estimated wait time, room, floor, assigned doctor

---

## 📋 Feature Components

### 1. **Emergency Registration Page** (`/emergency/register`)

**What it does:**

- Collects patient name and symptom description
- Sends symptoms to Gemini AI for analysis
- Shows AI-generated priority classification and reasoning
- Guides patient through submission process

**User Flow:**

1. Patient enters name and describes symptoms in detail
2. Click "Proceed to AI Analysis"
3. Gemini AI analyzes symptoms and assigns priority (1-3)
4. System shows AI explanation and reasons
5. Patient confirms and submits
6. Case added to emergency queue

**Technology:**

- Frontend: Next.js with React, motion animations
- AI: Gemini API via OpenRouter
- Backend: Next.js API routes

---

### 2. **Emergency Queue Display** (`/emergency`)

**What it shows:**

- Real-time emergency queue status
- Waiting and serving patient counts
- Next patient details (name, symptoms, priority, ETA)
- Full queue list with priority sorting
- Auto-refresh every 5 seconds
- Register emergency case button

**Features:**

- **Smart Sorting**: Patients automatically sorted by priority then arrival time
- **Estimated Wait Time**: Calculated based on queue position and avg. 15-min consultation
- **Live Updates**: Automatic polling every 5 seconds
- **Doctor Controls**: Serve next patient, mark completed (admin only)
- **Priority Override**: Receptionists can adjust priorities if needed

---

### 3. **Receptionist Verification Page** (`/emergency/verify`)

**What it does:**

- Shows pending emergency cases awaiting approval
- Displays AI analysis and reasoning
- Allows receptionist to approve or reject cases
- Moves approved cases to active queue

**Receptionist Workflow:**

1. Access `/emergency/verify` (admin only)
2. See list of pending cases with AI classifications
3. Review AI explanation and priority assignment
4. Approve case → adds to queue immediately
5. Reject case → removes from system

**Access Control:**

- Admin email: `shivanshuk186@gmail.com` (set in environment)
- Uses Clerk authentication

---

## 🔧 API Endpoints

### Patient Registration

```
POST /api/emergency/register
Body: {
  symptoms: string[],
  priority: 1 | 2 | 3,
  patientId: string
}
Response: { success: true, queueItem: {...} }
```

### AI Symptom Analysis

```
POST /api/emergency/analyze
Body: {
  symptoms: string,
  patientName: string
}
Response: {
  priority: 1 | 2 | 3,
  symptoms: string[],
  reason: string,
  estimatedWaitTime: number,
  roomNumber: string,
  floorNumber: number,
  assignedDoctor: string
}
```

### Get Emergency Queue

```
GET /api/emergency/queue
Response: { queue: QueueItem[] }
```

### Get Next Patient

```
GET /api/emergency/next
Response: { nextPatient: QueueItem | null }
```

### Serve Next Patient (Doctor)

```
POST /api/emergency/serve
Body: { assignedDoctor?: string }
Response: { success: true }
```

### Mark Patient Completed

```
POST /api/emergency/complete
Response: { success: true }
```

### Approve Emergency Case (Receptionist)

```
POST /api/emergency/approve
Body: { caseId: number }
Response: { success: true }
```

### Reject Emergency Case (Receptionist)

```
POST /api/emergency/reject
Body: { caseId: number }
Response: { success: true }
```

---

## 🎯 Priority Classification Rules

### Priority 1 - **CRITICAL** (Life-Threatening)

Red badge, immediately treated

- Chest pain / Cardiac symptoms
- Severe bleeding / Trauma
- Unconsciousness
- Severe breathing difficulty
- Estimated wait: 5 minutes

### Priority 2 - **SERIOUS** (Urgent)

Amber badge, treated soon

- High fever
- Severe pain
- Fracture
- Severe headache / Dizziness
- Vomiting / Dehydration
- Estimated wait: 15 minutes

### Priority 3 - **NORMAL** (Non-Urgent)

Green badge, treated in order

- Mild pain
- Cough / Cold
- Minor injuries
- Estimated wait: 30 minutes

---

## 📊 AI-Powered Triage Engine

The system uses **Gemini API** (via OpenRouter) to:

1. **Parse Symptoms**: Extract individual symptoms from patient description
2. **Classify Priority**: Analyze severity and assign 1-3 level
3. **Generate Explanation**: Provide doctor-friendly reasoning
4. **Estimate Wait Time**: Calculate based on priority and queue

**Sample Gemini Prompt:**

```
Analyze these patient symptoms for emergency priority:
- Chest pain
- Sweating
- Breathing difficulty

Priority classification:
- 1 (Critical): Life-threatening
- 2 (Serious): Urgent but not life-threatening
- 3 (Normal): Non-urgent

Return JSON with priority, symptoms array, and explanation.
```

---

## 💾 Database Schema

### EmergencyQueueTable

```typescript
{
  id: number (primary key),
  patientId: string,
  symptoms: string[] (JSON),
  priority: 1 | 2 | 3,
  arrivalTime: string (ISO date),
  status: 'waiting' | 'serving' | 'completed',
  assignedDoctor?: string,
  createdBy?: string (email),
  updatedAt: string (ISO date)
}
```

---

## 🔄 Patient Flow Diagram

```
Patient Submits Symptoms
    ↓
Gemini AI Analysis
    ↓
Priority Classification (1-3)
    ↓
Receptionist Reviews
    ↓
Case Approved?
  ├→ Yes: Added to Queue
  └→ No: Rejected
    ↓
Queue Display (Real-time)
    ↓
Doctor Gets Next Patient
    ↓
Patient Treated
    ↓
Mark Completed
    ↓
Auto-move to Next Patient
```

---

## 🚀 Testing the Feature

### 1. Patient Emergency Registration

```
1. Go to http://localhost:3000/emergency/register
2. Enter patient name: "John Doe"
3. Enter symptoms: "Chest pain, sweating, breathing difficulty"
4. Click "Proceed to AI Analysis"
5. Should see Priority: Critical
6. Click "Confirm & Submit"
7. Redirected to queue status
```

### 2. View Emergency Queue

```
1. Go to http://localhost:3000/emergency
2. See "Register Emergency Case" button (red)
3. View "Next Patient" section
4. See full queue list with priorities
5. Auto-refresh every 5 seconds
```

### 3. Doctor Actions (Admin)

```
1. On Emergency Queue page (as admin)
2. Click "Serve Next Patient" → moves to serving
3. Click "Mark Completed" → moves to completed
4. Next patient auto-displays
```

### 4. Receptionist Approval (Admin)

```
1. Go to http://localhost:3000/emergency/verify
2. See pending cases (if any)
3. Review AI classification
4. Click "Approve" or "Reject"
5. Approved cases → appear in queue
```

---

## 🔑 Environment Variables Required

```env
# Already configured in .env
DATABASE_URL=...              # Neon PostgreSQL
OPEN_ROUTER_API_KEY=...       # Gemini API via OpenRouter
NEXT_PUBLIC_VAPI_API_KEY=...  # For voice calls (optional)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
```

---

## 📈 Smart Priority Queue Algorithm

1. **Sorting Rules**:
   - Primary: Sort by priority (1 before 2, 2 before 3)
   - Secondary: Sort by arrival time (FIFO within same priority)

2. **Wait Time Calculation**:

   ```
   Wait Time = (Number of Higher Patients) × 15 minutes

   Example:
   - 2 Critical patients ahead = 30 minutes wait
   - 1 Serious patient ahead = 15 minutes wait
   ```

3. **Automatic Reordering**:
   - When new patient added, queue re-sorts
   - No manual intervention needed
   - Critical patients always jump to top

---

## 🎨 UI Components Used

- **Button**: Custom styled buttons (primary, outline, gradient)
- **Textarea**: Multi-line symptom input
- **Table**: Queue display with sorting
- **Dialog**: Modal confirmations (if needed)
- **Motion/Framer**: Smooth animations and transitions
- **Toast**: Success/error notifications (Sonner)
- **Icons**: Tabler Icons for visual elements

---

## ⚠️ Future Enhancements

1. **Pending Cases Storage**: Create `pending_cases` table for receptionist workflow
2. **Room Assignment**: Dynamic room/floor allocation from hospital system
3. **Doctor Assignment**: AI-based doctor specialty matching
4. **Patient History**: Link emergency cases to patient records
5. **SMS Notifications**: Notify patients of wait times
6. **Analytics Dashboard**: Track emergency trends and metrics
7. **Multi-hospital Support**: Queue management across locations

---

## 🐛 Troubleshooting

### "VAPI API key not configured"

- Check `.env` file has `NEXT_PUBLIC_VAPI_API_KEY`
- Ensure key is from [vapi.ai](https://vapi.ai)

### "Failed to analyze symptoms"

- Check OpenRouter API key in `.env`
- Verify `OPEN_ROUTER_API_KEY` is valid
- Check internet connection

### "Receptionist access required"

- Only `shivanshuk186@gmail.com` can access `/emergency/verify`
- Sign in with that email
- Check admin panel at `/admin`

### Queue not updating

- Check if polling is working (every 5s)
- Verify database connection
- Check browser console for errors

---

## 📞 Support

For questions or issues with the SmartMedic Emergency Queue system:

1. Check the troubleshooting section above
2. Review API responses in browser DevTools
3. Check server logs for errors
4. Verify all environment variables are set correctly

---

**System Status**: ✅ Production Ready

Last Updated: March 2026
