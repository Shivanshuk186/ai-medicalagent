# Countdown Timer Feature Implementation

## Overview

Added a real-time countdown timer feature to track active emergency cases with visual progress indicators and time tracking.

## Files Created

### 1. `components/CountdownTimer.tsx` (NEW)

A reusable React component that displays:

- **Elapsed Time**: Shows time spent on current case (formatted as MM:SS)
- **Progress Bar**: Visual indicator with color transitions:
  - 🟢 Green (0-50% progress)
  - 🟡 Amber (50-80% progress)
  - 🔴 Red (80-100% progress)
- **Remaining Time**: Shows estimated time left
- **Auto-refresh**: Updates every 1 second for real-time accuracy

**Props:**

- `startTime`: ISO datetime when patient started being served
- `estimatedDuration`: Duration in minutes
- `onTimeUp?`: Optional callback when time runs out

**Features:**

- Clock icon from Tabler Icons
- Responsive layout
- Smooth progress bar animation
- Color-coded remaining time (red if < 5 minutes)

### 2. `app/not-found.tsx` (NEW)

Standard Next.js 404 error page with:

- Dark gradient background matching app theme
- Centered "404" heading
- Link back to home
- Styled button component

**Purpose:** Fixed Next.js build error related to missing \_not-found page

## Files Modified

### 1. `config/schema.tsx`

**Changes:**

- Added `serveStartTime?: varchar()` - Tracks when patient started being served
- Column added to `EmergencyQueueTable`

**Purpose:** Store timestamp when patient transitions from "waiting" to "serving" status

### 2. `lib/queueManager.ts`

**Changes in `serveNextPatient()` function:**

- Set `serveStartTime` to current ISO timestamp when marking patient as "serving"
- Added `completedAt` timestamp when marking previous case as "completed"

**Before:**

```typescript
status: 'serving',
assignedDoctor: assignedDoctor ?? waiting[0].assignedDoctor,
updatedAt: now,
```

**After:**

```typescript
status: 'serving',
serveStartTime: now,  // NEW: Track when serving started
assignedDoctor: assignedDoctor ?? waiting[0].assignedDoctor,
updatedAt: now,
```

### 3. `app/(routes)/emergency/page.tsx`

**New Imports:**

- `CountdownTimer` component
- `IconClock` and `IconActivity` from Tabler Icons
- Added `CONSULTATION_TIME` constant

**New State:**

- Added `activeCases` computed value (all items with status === 'serving')

**New UI Section: "Active Cases Now"**

- Displays all currently serving patients in a grid layout (3 columns on large screens)
- Each card shows:
  - Patient ID (monospace font)
  - Reported symptoms (line-clamped to 2 lines)
  - Priority badge (color-coded)
  - CountdownTimer component
  - Amber/orange theme to distinguish from "Now Serving" (red theme)
- Shows count of active cases in badge
- Empty state message when no active cases

**Layout Changes:**

- Added full-width "Active Cases Now" section above existing grid
- Maintains existing "Now Serving" and "Queue List" sections
- Responsive: shows fewer columns on smaller screens

### 4. `migrations/add_countdown_timer_columns.sql` (NEW)

**Migration Query:**

```sql
ALTER TABLE emergency_queue
ADD COLUMN IF NOT EXISTS serve_start_time VARCHAR,
ADD COLUMN IF NOT EXISTS completed_at VARCHAR;

CREATE INDEX IF NOT EXISTS idx_emergency_queue_serve_start_time
ON emergency_queue(serve_start_time);
```

**Purpose:**

- Adds `serve_start_time` and `completed_at` columns
- Creates index on `serve_start_time` for efficient queries
- Uses `IF NOT EXISTS` to prevent errors if columns already exist

## Migration Applied

✅ Successfully ran: `npx drizzle-kit push`

- Database schema updated
- New columns available for queue management

## Build Status

✅ Build successful with `npm run build`

- Fixed build error by creating `app/not-found.tsx`
- No TypeScript errors
- All new components compile correctly

## Test Status

✅ Dev server running on port 3002 (note: port 3000 was already in use)

- Application starts successfully
- Ready for testing

## Usage Example

### Displaying Active Case with Countdown:

```tsx
<CountdownTimer
  startTime={activeCase.serveStartTime}
  estimatedDuration={CONSULTATION_TIME[activeCase.priority]}
/>
```

## Features & Benefits

1. **Real-time Tracking**: See exactly how long each case has been ongoing
2. **Visual Progress**: Color-coded progress bar shows status at a glance
3. **Time Management**: Alerts staff when cases exceed estimated duration
4. **Queue Insight**: "Active Cases Now" section shows current workload
5. **Responsive Design**: Works well on all screen sizes
6. **Performance**: Efficient polling (every 5 seconds) + smooth 1-second UI updates

## Future Enhancements (Optional)

- Sound alert when time runs out
- Email/SMS notifications for cases exceeding duration
- Historical analytics on case completion times
- Ability to extend consultation time with one click
- Patient waiting time predictions based on active cases
- Doctor assignment optimization based on current load
