# EchoDoc Emergency Queue Management System

## Complete Implementation Guide

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [User Roles & Workflows](#user-roles--workflows)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [Features](#features)
7. [Usage Examples](#usage-examples)
8. [Configuration](#configuration)

---

## 🏥 System Overview

The Emergency Queue Management System is an AI-assisted priority queue system that ensures critical patients are treated first in the EchoDoc medical platform.

**Key Components:**

- **Patient Registration**: Receptionist registers emergency patients
- **AI Triage**: Automatic symptom analysis and priority classification
- **Receptionist Approval**: Human verification before queue entry
- **Priority Queue**: Min-heap based ordering (Critical → Serious → Normal)
- **Doctor Dashboard**: Real-time patient queue and serving interface

---

## 🏗️ Architecture

### Data Flow

```
1. Patient Arrives
   ↓
2. Receptionist Registers → /api/emergency/register
   ↓
3. AI Analyzes Symptoms → /api/emergency/analyze
   ↓
4. System Stores as pending_approval
   ↓
5. Receptionist Reviews → /api/emergency/receptionist/pending
   ↓
6. Approve → /api/emergency/receptionist/approve
   ↓
7. Patient Moves to Waiting Status
   ↓
8. Doctor Views Queue → /api/emergency/queue
   ↓
9. Serve Patient → /api/emergency/serve (POST)
   ↓
10. Complete Service → /api/emergency/complete
```

### Priority System

```
Priority 1 (Critical) - Serve in 5 min
  Keywords: chest pain, breathing difficulty, bleeding, unconscious, etc.

Priority 2 (Serious) - Serve in 15 min
  Keywords: high fever, fracture, severe pain, vomiting, etc.

Priority 3 (Normal) - Serve in 30 min
  Keywords: mild symptoms, minor injuries, common complaints, etc.
```

---

## 👥 User Roles & Workflows

### Receptionist Workflow

**Access Point**: `/emergency/register` or `/emergency/receptionist`

#### Registration Flow:

1. Click **"Emergency"** tab in navigation (red highlight)
2. Click **"Register Patient"**
3. Fill form:
   - Patient Name (required)
   - Age (optional)
   - Symptoms (required) - one per line
   - Emergency Description (optional)
   - Upload patient image (optional)
4. Click **"Analyze with AI"** button
5. Review AI assessment:
   - Severity level (Critical/Serious/Normal)
   - AI reasoning
   - Confidence score
6. Click **"Submit for Approval"**
7. System redirects to status page

#### Approval Flow:

1. Navigate to `/emergency/receptionist`
2. View pending cases with:
   - AI priority assessment
   - Patient ID and symptoms
   - Queue statistics
3. For each case:
   - **Confirm Priority**: Keep AI assessment
   - **Override Priority**: Change to higher/lower level
   - **Reject Case**: Remove from queue
4. Case moves to queue (status: waiting) when approved

---

### Doctor/Staff Workflow

**Access Point**: `/emergency`

1. Navigate to **Emergency** → **View Queue**
2. See queue broken into three sections:
   - **Critical Patients** (Red)
   - **Serious Patients** (Amber)
   - **Normal Cases** (Green)
3. View "Now Serving" patient with:
   - Patient ID
   - Symptoms
   - Priority level
   - Estimated duration
4. Click **"Serve Next"** when ready
5. Patient moves from _waiting_ → _serving_ status
6. After treatment, click **"Mark Completed"**
7. Patient moves to _completed_ status

---

### Patient Workflow

**Access Point**: After registration, `/emergency/status?patientId=...`

1. After successful registration, auto-redirected to status page
2. View personal case information:
   - Priority level
   - Queue position (e.g., "3rd in queue")
   - Estimated waiting time
   - Current status (pending_approval/waiting/serving/completed)
3. View other patients ahead in queue
4. Page auto-refreshes every 5 seconds
5. When status changes to "serving", patient checks in at desk
6. When status changes to "completed", case finished

---

## 🔌 API Endpoints

### Authentication

All endpoints require Clerk authentication via `currentUser()`.

Some endpoints require **Receptionist Role**:

- Admin emails: `shivanshuk186@gmail.com`, `admin@medicalagent.com`

### Patient Registration

**POST** `/api/emergency/register`

```json
{
  "patientName": "John Doe",
  "patientId": "john_doe",
  "age": 45,
  "symptoms": ["chest pain", "sweating", "breathing difficulty"],
  "emergencyDescription": "Sudden onset severe chest pain",
  "priority": 1,
  "aiAnalysis": {
    "reason": "Symptoms indicate possible cardiac emergency",
    "severity_score": 9.2
  }
}
```

**Response:**

```json
{
  "success": true,
  "queueItem": {
    "id": 1,
    "patientId": "john_doe",
    "patientName": "John Doe",
    "priority": 1,
    "status": "pending_approval",
    "arrivalTime": "2024-03-17T10:30:00Z"
  }
}
```

---

### AI Triage Analysis

**POST** `/api/emergency/analyze`

```json
{
  "symptoms": "severe chest pain, sweating, difficulty breathing"
}
```

**Response:**

```json
{
  "success": true,
  "priority": 1,
  "symptoms": ["chest pain", "sweating", "difficulty breathing"],
  "reason": "CRITICAL: Symptoms indicate possible cardiac emergency",
  "severity_score": 9.2,
  "estimatedWaitTime": 5
}
```

---

### Fetch Pending Cases

**GET** `/api/emergency/pending`

**Response:**

```json
{
  "success": true,
  "cases": [
    {
      "id": 1,
      "patientId": "john_doe",
      "symptoms": ["chest pain", "sweating"],
      "priority": 1,
      "status": "pending_approval",
      "arrivalTime": "2024-03-17T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### Approve Case

**POST** `/api/emergency/receptionist/approve`

```json
{
  "caseId": 1,
  "priority": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Case approved and added to queue",
  "queueItem": {
    "id": 1,
    "status": "waiting",
    "approvedBy": "receptionist@email.com",
    "approvedAt": "2024-03-17T10:32:00Z"
  }
}
```

---

### Reject Case

**POST** `/api/emergency/receptionist/reject`

```json
{
  "caseId": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Case rejected and removed from pending"
}
```

---

### Get Full Queue

**GET** `/api/emergency/queue`

**Response:**

```json
{
  "success": true,
  "queue": [
    {
      "id": 1,
      "patientId": "john_doe",
      "symptoms": ["chest pain", "sweating"],
      "priority": 1,
      "status": "waiting",
      "estimatedWaitingMinutes": 0,
      "arrivalTime": "2024-03-17T10:30:00Z"
    },
    {
      "id": 2,
      "patientId": "jane_smith",
      "symptoms": ["broken leg"],
      "priority": 2,
      "status": "waiting",
      "estimatedWaitingMinutes": 20,
      "arrivalTime": "2024-03-17T10:35:00Z"
    }
  ],
  "count": 2,
  "waiting": 2,
  "serving": 0
}
```

---

### Get Next Patient

**GET** `/api/emergency/next`

**Response:**

```json
{
  "success": true,
  "nextPatient": {
    "id": 1,
    "patientId": "john_doe",
    "priority": 1,
    "status": "waiting"
  }
}
```

---

### Serve Next Patient

**POST** `/api/emergency/serve`

```json
{
  "assignedDoctor": "doctor@email.com" // optional
}
```

**Response:**

```json
{
  "success": true,
  "message": "Now serving next patient",
  "nextPatient": {
    "id": 1,
    "status": "serving",
    "assignedDoctor": "doctor@email.com"
  }
}
```

---

### Complete Patient Service

**POST** `/api/emergency/complete`

```json
{
  "patientId": "john_doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Patient service completed",
  "completedPatient": {
    "id": 1,
    "status": "completed",
    "completedAt": "2024-03-17T10:50:00Z"
  }
}
```

---

## 📊 Database Schema

### EmergencyQueueTable

```typescript
{
  id: integer (primary key)
  patientId: varchar (unique)
  patientName: varchar (required)
  age: integer (optional)
  symptoms: json array
  emergencyDescription: text (optional)
  priority: integer (1, 2, or 3)
  aiAnalysis: json (optional)
  aiReason: text (optional)
  imageUrl: varchar (optional)
  arrivalTime: varchar (ISO timestamp)
  status: varchar (pending_approval, waiting, serving, completed)
  assignedDoctor: varchar (optional)
  createdBy: varchar (FK to users.email)
  approvedBy: varchar (optional)
  approvedAt: varchar (optional)
  completedAt: varchar (optional)
  updatedAt: varchar (ISO timestamp)
}
```

**Status Flow:**

```
pending_approval → waiting → serving → completed
```

---

## ✨ Features

### 1. **Patient Registration**

- Multi-field form with validation
- Mandatory: name, symptoms
- Optional: age, description, image
- Step-by-step UX

### 2. **AI Emergency Triage**

- OpenRouter API integration
- Symptom keyword matching
- Priority classification (1-3)
- Confidence scoring
- Fallback logic for API failures

### 3. **Receptionist Verification**

- Case approval interface
- Priority override capability
- Case rejection option
- Stats dashboard

### 4. **Real-Time Queue**

- Live patient updates (5s refresh)
- Automatic reordering
- Three severity sections
- Queue position tracking

### 5. **Waiting Time Calculation**

- Based on queue position
- Consultation duration by priority
- Real-time updates

### 6. **Queue Operations**

- Min-heap ordering
- Dynamic priority updates
- Patient serving workflow
- Completion tracking

### 7. **Patient Status Tracking**

- Real-time position updates
- ETA calculation
- Queue visualization
- Status notifications

---

## 🔄 Usage Examples

### Example 1: Complete Patient Journey

**Step 1: Receptionist Registration**

```
1. Navigate to /emergency
2. Click "Register Patient"
3. Enter:
   - Name: "Rajesh Kumar"
   - Age: 52
   - Symptoms: "Chest pain, sweating, difficulty breathing"
   - Description: "Started 20 minutes ago while at rest"
4. Upload chest X-ray image
5. Click "Analyze with AI"
6. AI returns: Priority 1 (Critical), Score: 9.5/10
7. Review and click "Submit for Approval"
```

**Step 2: Receptionist Approval**

```
1. Navigate to /emergency/receptionist
2. See pending case for Rajesh Kumar
3. AI says: Critical (9.5/10)
4. Click "Confirm CRITICAL"
5. Case moves to queue
```

**Step 3: Patient Status**

```
1. After registration, see: /emergency/status?patientId=rajesh_kumar
2. Queue Position: 1st (highest priority)
3. Estimated Wait: 0 minutes (currently being served)
4. Status: SERVING
```

**Step 4: Doctor Treatment**

```
1. Navigate to /emergency
2. See "Now Serving": Rajesh Kumar
   - Priority: Critical
   - Symptoms: Chest pain, sweating, difficulty breathing
   - Duration: ~20 min
3. Treat patient
4. Click "Mark Completed"
5. Rajesh moves to "Completed"
```

---

### Example 2: Priority Queue in Action

```
Initial Queue:
1. Amit (Priority 1: Chest pain) - Arrived 10:00
2. Ravi (Priority 1: Severe bleeding) - Arrived 10:02
3. Sita (Priority 2: Broken leg) - Arrived 10:01
4. Rahul (Priority 3: Fever) - Arrived 10:03

After sorting by (priority asc, arrivalTime asc):
1. Amit (1, 10:00) ← Critical, earlier
2. Ravi (1, 10:02) ← Critical, later
3. Sita (2, 10:01) ← Serious
4. Rahul (3, 10:03) ← Normal

Doctor serves Amit, mark complete:
1. Ravi (1, 10:02) ← Now next
2. Sita (2, 10:01)
3. Rahul (3, 10:03)
```

---

## ⚙️ Configuration

### Environment Variables

```env
# OpenRouter API for AI Analysis
OPEN_ROUTER_API_KEY=your_open_router_key

# Receptionist Admin Emails
# Edit in API routes:
const ADMIN_EMAILS = ['shivanshuk186@gmail.com', 'admin@medicalagent.com'];
```

### Consultation Times by Priority

```typescript
const CONSULTATION_TIME = {
  1: 20, // Critical: 20 minutes
  2: 15, // Serious: 15 minutes
  3: 10, // Normal: 10 minutes
};
```

### Polling Interval

```typescript
const POLLING_INTERVAL_MS = 5000; // 5 seconds
```

---

## 🔐 Security

1. **Authentication**: All endpoints require Clerk authentication
2. **Role-Based Access**: Receptionist endpoints check admin email list
3. **Data Validation**: Input sanitization on all forms
4. **Unique Patient ID**: Prevents duplicate registrations
5. **Audit Trail**: Records who approved/completed each case

---

## 🐛 Troubleshooting

| Issue                      | Solution                                                |
| -------------------------- | ------------------------------------------------------- |
| Case not showing in queue  | Ensure it's approved (status: waiting)                  |
| AI not analyzing           | Check OPEN_ROUTER_API_KEY environment variable          |
| Receptionist can't approve | Verify email in ADMIN_EMAILS list                       |
| Queue not updating         | Refresh page or wait for 5s auto-refresh                |
| Patient ID conflicts       | Use unique patient names; system converts to unique IDs |

---

## 📈 Monitoring & Analytics

### Queue Metrics

- Total patients: `queue.length`
- Critical cases: Filter where `priority === 1`
- Average wait time: Sum estimated times / total waiting
- Completion rate: Completed cases / total cases

### Performance

- Queue response time: Should be <100ms
- AI analysis: 2-5 seconds
- Approval: <1 second
- Serve operation: <500ms

---

## 🎯 Future Enhancements

1. **Machine Learning**: Train custom model on historical data
2. **Integration**: Connect with hospital management systems
3. **Notifications**: SMS/email alerts for patients
4. **Analytics**: Detailed queue metrics and trends
5. **Mobile App**: Patient real-time queue tracking
6. **Video Consultation**: Pre-consultation video for doctors
7. **Multi-facility**: Support multiple hospital locations
8. **Predictive**: Estimate peak hours and staffing needs

---

## 📞 Support

For implementation questions or issues:

1. Check API response status codes
2. Review browser console for errors
3. Verify database connection
4. Ensure Clerk authentication is working
5. Check OpenRouter API credits

---

## 📄 License & Credits

This system is part of the EchoDoc AI Medical Agent platform.

**Built with:**

- Next.js 15.4
- TypeScript
- Drizzle ORM
- Clerk Authentication
- OpenRouter AI API
- Tailwind CSS

---

**Last Updated**: March 17, 2024
**Version**: 1.0.0
