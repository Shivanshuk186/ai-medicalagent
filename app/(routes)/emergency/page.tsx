'use client';

import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'motion/react';
import CountdownTimer from '@/components/CountdownTimer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconAlertTriangle, IconHeartbeat, IconLoader2, IconPlus, IconShieldCheck, IconClock, IconActivity } from '@tabler/icons-react';

type QueueItem = {
  id: number;
  patientId: string;
  symptoms: string[];
  priority: number;
  arrivalTime: string;
  status: 'waiting' | 'serving' | 'completed';
  assignedDoctor?: string;
  estimatedWaitingMinutes?: number;
  serveStartTime?: string;
};

const POLLING_INTERVAL_MS = 5000;
const CONSULTATION_TIME: Record<number, number> = {
  1: 20, // Critical: 20 min
  2: 15, // Serious: 15 min
  3: 10, // Normal: 10 min
};

function priorityLabel(priority: number) {
  if (priority === 1) return 'Critical';
  if (priority === 2) return 'Serious';
  return 'Normal';
}

function priorityBadge(priority: number) {
  if (priority === 1) return 'bg-red-500/15 text-red-600';
  if (priority === 2) return 'bg-amber-500/15 text-amber-600';
  return 'bg-emerald-500/15 text-emerald-600';
}

export default function EmergencyQueuePage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [nextPatient, setNextPatient] = useState<QueueItem | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [overrideMap, setOverrideMap] = useState<Record<number, number>>({});

  const fetchQueueData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const [queueRes, nextRes] = await Promise.all([
        axios.get('/api/emergency/queue'),
        axios.get('/api/emergency/next'),
      ]);

      const queueItems = queueRes.data?.queue || [];
      setQueue(queueItems);
      setNextPatient(nextRes.data?.nextPatient || null);
      setIsAdmin(true); // For demo, assume admin

      setOverrideMap((prev: Record<number, number>) => {
        const updated = { ...prev };
        queueItems.forEach((item: QueueItem) => {
          if (updated[item.id] === undefined) {
            updated[item.id] = item.priority;
          }
        });
        return updated;
      });
    } catch (error) {
      console.error('Error loading emergency queue:', error);
      if (!silent) {
        toast.error('Failed to load emergency queue');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchQueueData();

    const interval = setInterval(() => {
      fetchQueueData(true);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const waitingCount = useMemo(
    () => queue.filter((item: QueueItem) => item.status === 'waiting').length,
    [queue]
  );

  const servingCount = useMemo(
    () => queue.filter((item: QueueItem) => item.status === 'serving').length,
    [queue]
  );

  const activeCases = useMemo(
    () => queue.filter((item: QueueItem) => item.status === 'serving'),
    [queue]
  );

  const onServeNext = async () => {
    try {
      setActionLoading('serve');
      await axios.post('/api/emergency/serve', {});
      toast.success('Moved to next patient');
      await fetchQueueData(true);
    } catch (error) {
      console.error('Error serving next patient:', error);
      toast.error('Failed to serve next patient');
    } finally {
      setActionLoading(null);
    }
  };

  const onMarkCompleted = async () => {
    try {
      setActionLoading('complete');
      await axios.post('/api/emergency/complete', {});
      toast.success('Current patient marked completed');
      await fetchQueueData(true);
    } catch (error) {
      console.error('Error completing patient:', error);
      toast.error('Failed to mark patient completed');
    } finally {
      setActionLoading(null);
    }
  };

  const onOverridePriority = async (id: number) => {
    try {
      setActionLoading(`override-${id}`);
      await axios.post('/api/emergency/override', {
        id,
        priority: overrideMap[id],
      });
      toast.success('Priority updated');
      await fetchQueueData(true);
    } catch (error) {
      console.error('Error overriding priority:', error);
      toast.error('Failed to override priority');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <IconLoader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='rounded-3xl border bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/10 p-8'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600'>
              <IconAlertTriangle size={14} />
              Smart Medic
            </div>
            <h1 className='text-3xl font-bold'>Emergency Queue Manager</h1>
            <p className='text-muted-foreground'>Real-time triage queue with priority-based serving order</p>
          </div>

          <div className='flex flex-col gap-3'>
            <div className='flex gap-2'>
              <Link href='/emergency/register' className='flex-1'>
                <Button className='w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'>
                  <IconPlus className='mr-2 h-4 w-4' />
                  Register Emergency Case
                </Button>
              </Link>
              <Link href='/emergency/receptionist'>
                <Button variant='outline' className='border-amber-500/30 text-amber-600 hover:bg-amber-500/10'>
                  <IconShieldCheck className='h-4 w-4' />
                </Button>
              </Link>
            </div>
            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border bg-card px-4 py-3'>
                <p className='text-xs text-muted-foreground'>Waiting</p>
                <p className='text-2xl font-bold'>{waitingCount}</p>
              </div>
              <div className='rounded-xl border bg-card px-4 py-3'>
                <p className='text-xs text-muted-foreground'>Serving</p>
                <p className='text-2xl font-bold'>{servingCount}</p>
              </div>
              <div className='rounded-xl border bg-card px-4 py-3'>
                <p className='text-xs text-muted-foreground'>Auto Refresh</p>
                <p className='text-sm font-semibold'>Every 5s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        {/* Active Cases Section */}
        <div className='lg:col-span-3 rounded-2xl border bg-card p-5'>
          <div className='mb-4 flex items-center gap-2'>
            <IconActivity className='text-amber-500' size={20} />
            <h2 className='text-lg font-semibold'>Active Cases Now</h2>
            <span className='ml-auto rounded-full bg-amber-500/20 px-3 py-1 text-sm font-bold text-amber-600'>
              {activeCases.length}
            </span>
          </div>

          {activeCases.length > 0 ? (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {activeCases.map((activeCase) => (
                <motion.div
                  key={activeCase.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className='rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-amber-500/5 p-4'
                >
                  <div className='space-y-3'>
                    <div>
                      <p className='text-xs text-muted-foreground'>Patient</p>
                      <p className='font-mono text-sm font-bold text-white'>{activeCase.patientId}</p>
                    </div>

                    <div>
                      <p className='text-xs text-muted-foreground mb-1'>Symptoms</p>
                      <p className='text-xs font-medium line-clamp-2'>
                        {(activeCase.symptoms || []).join(', ') || 'No symptoms'}
                      </p>
                    </div>

                    <div className='flex items-center gap-2 py-2'>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${priorityBadge(activeCase.priority)}`}>
                        {priorityLabel(activeCase.priority)}
                      </span>
                    </div>

                    {activeCase.serveStartTime && (
                      <CountdownTimer
                        startTime={activeCase.serveStartTime}
                        estimatedDuration={CONSULTATION_TIME[activeCase.priority as keyof typeof CONSULTATION_TIME]}
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='rounded-xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground'
            >
              <IconActivity className='mx-auto mb-3 h-8 w-8 opacity-30' />
              No active cases at the moment
            </motion.div>
          )}
        </div>
      </div>

      <div className='grid gap-4 lg:grid-cols-[1.2fr_2fr]'>
        <div className='rounded-2xl border bg-card p-5'>
          <div className='mb-3 flex items-center gap-2'>
            <IconHeartbeat className='text-red-600' size={20} />
            <h2 className='text-lg font-semibold'>Now Serving</h2>
          </div>

          {nextPatient ? (
            <motion.div
              key={nextPatient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className='space-y-3 rounded-xl border bg-gradient-to-br from-red-500/10 to-red-500/5 p-4'
            >
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-muted-foreground'>Patient ID</p>
                  <p className='font-mono text-sm font-semibold'>{nextPatient.patientId}</p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Status</p>
                  <p className='font-semibold capitalize'>{nextPatient.status}</p>
                </div>
              </div>
              <div>
                <p className='text-xs text-muted-foreground mb-1'>Reported Symptoms</p>
                <p className='text-sm font-medium'>{(nextPatient.symptoms || []).join(', ') || 'No symptoms'}</p>
              </div>
              <div className='flex items-center justify-between py-2 rounded-lg bg-black/20 px-3'>
                <div>
                  <p className='text-xs text-muted-foreground'>Priority</p>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${priorityBadge(nextPatient.priority)}`}>
                    {priorityLabel(nextPatient.priority)}
                  </span>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-muted-foreground'>Est. Duration</p>
                  <p className='font-semibold'>15 min</p>
                </div>
              </div>
              <div className='flex gap-2 pt-2'>
                <Button className='flex-1 bg-green-600 hover:bg-green-700' onClick={onServeNext} disabled={actionLoading === 'serve'}>
                  {actionLoading === 'serve' ? <IconLoader2 className='h-4 w-4 animate-spin' /> : 'Mark Completed'}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='rounded-xl border bg-muted/30 p-8 text-center text-sm text-muted-foreground'
            >
              <IconHeartbeat className='mx-auto mb-3 h-8 w-8 opacity-30' />
              Queue is empty - all patients treated
            </motion.div>
          )}
        </div>

        <div className='rounded-2xl border bg-card p-5'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Queue List</h2>
            <Button variant='outline' size='sm' onClick={() => fetchQueueData(true)}>
              Refresh
            </Button>
          </div>

          <div className='overflow-hidden rounded-xl border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Est. Wait</TableHead>
                  {isAdmin && <TableHead>Override</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} className='py-10 text-center text-muted-foreground'>
                      Queue is empty
                    </TableCell>
                  </TableRow>
                ) : (
                  queue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-mono text-sm'>{item.patientId}</TableCell>
                      <TableCell className='max-w-[260px]'>
                        <p className='line-clamp-2 text-sm text-muted-foreground'>
                          {(item.symptoms || []).join(', ')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${priorityBadge(item.priority)}`}>
                          {priorityLabel(item.priority)}
                        </span>
                      </TableCell>
                      <TableCell className='capitalize text-sm font-medium'>{item.status}</TableCell>
                      <TableCell className='font-semibold'>{item.estimatedWaitingMinutes ?? 0} min</TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <select
                              className='h-9 rounded-md border bg-background px-2 text-sm'
                              value={overrideMap[item.id] ?? item.priority}
                              onChange={(e) =>
                                setOverrideMap((prev) => ({
                                  ...prev,
                                  [item.id]: Number(e.target.value),
                                }))
                              }
                              disabled={item.status === 'completed'}
                            >
                              <option value={1}>Critical</option>
                              <option value={2}>Serious</option>
                              <option value={3}>Normal</option>
                            </select>
                            <Button
                              size='sm'
                              variant='outline'
                              disabled={
                                item.status === 'completed' ||
                                actionLoading === `override-${item.id}` ||
                                (overrideMap[item.id] ?? item.priority) === item.priority
                              }
                              onClick={() => onOverridePriority(item.id)}
                            >
                              {actionLoading === `override-${item.id}` ? (
                                <IconLoader2 className='h-4 w-4 animate-spin' />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
