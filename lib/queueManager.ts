import { db } from '@/config/db';
import { EmergencyQueueTable } from '@/config/schema';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { EmergencyPriority } from './triage';

// Time per consultation by priority (minutes)
export const CONSULTATION_TIME = {
  1: 20, // Critical: 20 min
  2: 15, // Serious: 15 min
  3: 10, // Normal: 10 min
};

type EmergencyQueueItem = typeof EmergencyQueueTable.$inferSelect;
type QueueStatus = 'waiting' | 'serving' | 'completed' | 'pending_approval';

type AddPatientOptions = {
  createdBy?: string;
  assignedDoctor?: string;
};

export async function addPatientToQueue(
  patientId: string,
  patientName: string,
  symptoms: string[],
  priority: EmergencyPriority,
  options?: AddPatientOptions
) {
  const now = new Date().toISOString();

  const inserted = await db
    .insert(EmergencyQueueTable)
    .values({
      patientId,
      patientName,
      symptoms,
      priority,
      arrivalTime: now,
      status: 'pending_approval', // NEW: Start in pending approval
      assignedDoctor: options?.assignedDoctor,
      createdBy: options?.createdBy,
      updatedAt: now,
    })
    .returning();

  return inserted[0];
}

/**
 * Get full queue sorted by priority (1 first), then arrival time
 * Calculates proper ETA based on actual queue ahead
 */
export async function getFullQueue(statusFilter: QueueStatus[] = ['waiting', 'serving']) {
  const queue: EmergencyQueueItem[] = await db
    .select()
    .from(EmergencyQueueTable)
    .where(inArray(EmergencyQueueTable.status, statusFilter))
    .orderBy(
      asc(EmergencyQueueTable.priority),
      asc(EmergencyQueueTable.arrivalTime),
      asc(EmergencyQueueTable.id)
    );

  // Get all waiting patients (those in queue, excluding serving)
  const waitingPatients = queue.filter((item) => item.status === 'waiting');
  const servingPatient = queue.find((item) => item.status === 'serving');

  return queue.map((item) => {
    let estimatedWaitingMinutes = 0;

    if (item.status === 'serving') {
      // Currently being served
      estimatedWaitingMinutes = 0;
    } else if (item.status === 'waiting') {
      // Calculate time for all patients ahead with SAME OR HIGHER PRIORITY (lower number = higher priority)
      let timeAhead = 0;

      for (const other of waitingPatients) {
        if (other.id === item.id) break; // Stop when we reach this patient

        // Only count if they have same or higher priority (same or lower number)
        if (other.priority <= item.priority) {
          timeAhead += CONSULTATION_TIME[other.priority as EmergencyPriority];
        }
      }

      // Add time for current serving patient if they have higher or equal priority
      if (servingPatient && servingPatient.priority <= item.priority) {
        // Assume ~10 minutes already spent
        timeAhead += Math.max(0, CONSULTATION_TIME[servingPatient.priority as EmergencyPriority] - 10);
      }

      estimatedWaitingMinutes = Math.max(0, timeAhead);
    }

    return {
      ...item,
      estimatedWaitingMinutes,
    };
  });
}

/**
 * Get queue position relative to same priority (1-indexed)
 */
export async function getQueuePosition(patientId: string): Promise<number | null> {
  const patient = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.patientId, patientId))
    .orderBy(asc(EmergencyQueueTable.id))
    .limit(1);

  if (!patient.length) return null;

  const thisPatient = patient[0];
  if (thisPatient.status !== 'waiting' && thisPatient.status !== 'serving') return null;

  const ahead = await db
    .select()
    .from(EmergencyQueueTable)
    .where(
      and(
        eq(EmergencyQueueTable.status, 'waiting'),
        inArray(EmergencyQueueTable.status, ['waiting', 'serving'])
      )
    );

  let position = 1;
  for (const item of ahead) {
    if (item.priority < thisPatient.priority) {
      position++;
    } else if (
      item.priority === thisPatient.priority &&
      new Date(item.arrivalTime).getTime() < new Date(thisPatient.arrivalTime).getTime()
    ) {
      position++;
    }
  }

  return position;
}

export async function getPatientsAhead(
  patientId: string
): Promise<{ critical: number; serious: number; normal: number }> {
  const patient = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.patientId, patientId));

  if (!patient.length) {
    return { critical: 0, serious: 0, normal: 0 };
  }

  const thisPatient = patient[0];
  const queue = await db
    .select()
    .from(EmergencyQueueTable)
    .where(inArray(EmergencyQueueTable.status, ['waiting', 'serving']));

  let critical = 0,
    serious = 0,
    normal = 0;

  for (const item of queue) {
    if (item.id === thisPatient.id) break;

    if (item.priority === 1) critical++;
    else if (item.priority === 2) serious++;
    else normal++;
  }

  return { critical, serious, normal };
}

export async function getNextPatient() {
  const serving = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.status, 'serving'))
    .orderBy(asc(EmergencyQueueTable.priority), asc(EmergencyQueueTable.arrivalTime))
    .limit(1);

  if (serving.length > 0) {
    return serving[0];
  }

  const waiting = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.status, 'waiting'))
    .orderBy(asc(EmergencyQueueTable.priority), asc(EmergencyQueueTable.arrivalTime))
    .limit(1);

  return waiting[0] ?? null;
}

export async function markCurrentCompleted() {
  const serving = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.status, 'serving'));

  if (serving.length === 0) {
    return null;
  }

  const updated = await db
    .update(EmergencyQueueTable)
    .set({ status: 'completed', updatedAt: new Date().toISOString() })
    .where(eq(EmergencyQueueTable.id, serving[0].id))
    .returning();

  return updated[0] ?? null;
}

export async function serveNextPatient(assignedDoctor?: string) {
  const now = new Date().toISOString();

  // Mark current serving as completed
  const serving = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.status, 'serving'));

  if (serving.length > 0) {
    await db
      .update(EmergencyQueueTable)
      .set({ status: 'completed', completedAt: now, updatedAt: now })
      .where(eq(EmergencyQueueTable.id, serving[0].id));
  }

  // Get next waiting patient (by priority then arrival time)
  const waiting = await db
    .select()
    .from(EmergencyQueueTable)
    .where(eq(EmergencyQueueTable.status, 'waiting'))
    .orderBy(asc(EmergencyQueueTable.priority), asc(EmergencyQueueTable.arrivalTime))
    .limit(1);

  if (waiting.length === 0) {
    return null;
  }

  const updated = await db
    .update(EmergencyQueueTable)
    .set({
      status: 'serving',
      serveStartTime: now,
      assignedDoctor: assignedDoctor ?? waiting[0].assignedDoctor,
      updatedAt: now,
    })
    .where(eq(EmergencyQueueTable.id, waiting[0].id))
    .returning();

  return updated[0] ?? null;
}

export async function overridePriority(id: number, priority: EmergencyPriority, assignedDoctor?: string) {
  const updated = await db
    .update(EmergencyQueueTable)
    .set({
      priority,
      assignedDoctor,
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(EmergencyQueueTable.id, id), inArray(EmergencyQueueTable.status, ['waiting', 'serving'])))
    .returning();

  return updated[0] ?? null;
}
