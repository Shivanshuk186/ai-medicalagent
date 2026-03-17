'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import {
  IconAlertTriangle,
  IconHeartbeat,
  IconLoader2,
  IconArrowRight,
  IconClock,
  IconDoor,
} from '@tabler/icons-react';

type QueueItem = {
  id: number;
  patientId: string;
  symptoms: string[];
  priority: number;
  arrivalTime: string;
  status: 'waiting' | 'serving' | 'completed';
  estimatedWaitingMinutes?: number;
  assignedDoctor?: string;
};

export default function EmergencyStatusPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [yourCase, setYourCase] = useState<QueueItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const initPage = async () => {
      try {
        // Get queue data
        const queueRes = await axios.get('/api/emergency/queue');
        const allQueue = queueRes.data?.queue || [];
        setQueue(allQueue);

        // Try to find user's case (assuming userEmail is in patientId or we pass it)
        // For now, just show the queue
        setYourCase(allQueue[0] || null);
      } catch (error) {
        console.error('Error loading queue:', error);
        toast.error('Failed to load queue status');
      } finally {
        setLoading(false);
      }
    };

    initPage();

    // Auto-refresh every 5 seconds
    const interval = setInterval(initPage, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'bg-red-500/15 text-red-600';
    if (priority === 2) return 'bg-amber-500/15 text-amber-600';
    return 'bg-emerald-500/15 text-emerald-600';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'Critical';
    if (priority === 2) return 'Serious';
    return 'Normal';
  };

  const getStatusColor = (status: string) => {
    if (status === 'serving') return 'bg-blue-500/15 text-blue-600';
    if (status === 'completed') return 'bg-green-500/15 text-green-600';
    return 'bg-slate-500/15 text-slate-600';
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-3xl border bg-gradient-to-br from-red-500/5 via-orange-500/5 to-amber-500/10 p-8'
      >
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-sm font-medium text-red-600'>
              <IconAlertTriangle size={14} />
              SmartMedic Queue Status
            </div>
            <h1 className='text-3xl font-bold'>Your Emergency Case Status</h1>
            <p className='text-muted-foreground'>Real-time queue position and estimated wait time</p>
          </div>
          <Button onClick={() => router.push('/emergency')} className='bg-primary hover:bg-primary/90'>
            <IconArrowRight className='mr-2 h-4 w-4' />
            View Full Queue
          </Button>
        </div>
      </motion.div>

      {/* Your Case - At Top */}
      {yourCase ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-500/10 to-red-500/5 p-8'
        >
          <div className='mb-4 flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20'>
                <IconHeartbeat className='h-6 w-6 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Your Emergency Case</p>
                <h2 className='text-2xl font-bold'>{yourCase.patientId}</h2>
              </div>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-sm font-semibold ${getPriorityColor(yourCase.priority)}`}
            >
              {getPriorityLabel(yourCase.priority)}
            </span>
          </div>

          <div className='mb-6 space-y-3'>
            <div>
              <p className='text-xs text-muted-foreground mb-1'>Chief Complaint</p>
              <p className='text-sm'>{(yourCase.symptoms || []).join(', ')}</p>
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <div className='rounded-lg bg-background/50 p-3'>
                <p className='text-xs text-muted-foreground mb-1'>Queue Position</p>
                <p className='text-2xl font-bold text-primary'>
                  {queue.findIndex((item) => item.id === yourCase.id) + 1}
                </p>
              </div>
              <div className='rounded-lg bg-background/50 p-3'>
                <p className='text-xs text-muted-foreground mb-1'>Est. Wait Time</p>
                <p className='text-2xl font-bold text-amber-600'>{yourCase.estimatedWaitingMinutes ?? 0} min</p>
              </div>
              <div className='rounded-lg bg-background/50 p-3'>
                <p className='text-xs text-muted-foreground mb-1'>Status</p>
                <p className={`font-semibold capitalize ${getStatusColor(yourCase.status).split(' ')[0]}`}>
                  {yourCase.status}
                </p>
              </div>
            </div>
          </div>

          <div className='rounded-lg border bg-background/50 p-4'>
            <p className='text-sm'>
              {yourCase.status === 'serving' ? (
                <span className='text-blue-600'>
                  <strong>Your case is being served now.</strong> Please check in at the reception desk.
                </span>
              ) : yourCase.status === 'completed' ? (
                <span className='text-green-600'>
                  <strong>Your case has been completed.</strong> Thank you for visiting SmartMedic Emergency.
                </span>
              ) : (
                <span className='text-amber-600'>
                  <strong>Your case is in queue.</strong> We are attending to {queue.length - 1} other patient(s)
                  before you.
                </span>
              )}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className='rounded-2xl border border-dashed bg-muted/50 p-8 text-center'>
          <p className='text-muted-foreground'>No emergency case found for your account</p>
        </div>
      )}

      {/* Other Severe Patients */}
      {queue.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className='mb-4 text-xl font-bold'>Other Patients in Queue ({queue.length - 1})</h3>

          <div className='space-y-3'>
            {queue.filter((item) => item.id !== yourCase?.id).map((patient, idx) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className='rounded-xl border bg-card p-4'
              >
                <div className='flex items-center justify-between gap-4'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <span className='flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold text-sm'>
                        {idx + 1}
                      </span>
                      <div>
                        <p className='font-semibold'>{patient.patientId}</p>
                        <p className='text-xs text-muted-foreground line-clamp-1'>
                          {(patient.symptoms || []).slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3'>
                    <div className='text-right'>
                      <p className='text-xs text-muted-foreground'>Wait Time</p>
                      <p className='text-sm font-semibold flex items-center gap-1'>
                        <IconClock size={14} />
                        {patient.estimatedWaitingMinutes ?? 0} min
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityColor(patient.priority)}`}
                    >
                      {getPriorityLabel(patient.priority)}
                    </span>
                  </div>
                </div>

                {patient.status === 'serving' && (
                  <div className='mt-2 rounded bg-blue-500/10 p-2 text-xs text-blue-600'>Now being served</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Info Box */}
      <div className='rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6'>
        <h4 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>How SmartMedic Queue Works</h4>
        <ul className='space-y-2 text-sm text-blue-900/70 dark:text-blue-100/70'>
          <li>✓ AI automatically prioritizes critical cases to be served first</li>
          <li>✓ Queue auto-updates every 5 seconds with latest position</li>
          <li>✓ Estimated wait time is calculated based on queue position</li>
          <li>✓ Critical patients are moved to top automatically</li>
        </ul>
      </div>
    </div>
  );
}
