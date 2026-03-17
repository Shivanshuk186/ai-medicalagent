'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import {
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconLoader2,
  IconArrowRight,
  IconClipboardCheck,
} from '@tabler/icons-react';

type PendingCase = {
  id: number;
  patientId: string;
  symptoms: string[];
  priority: number;
  arrivalTime: string;
  status: 'waiting' | 'serving' | 'completed';
};

export default function ReceptionistVerifyPage() {
  const [cases, setCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/emergency/receptionist/pending');
      setCases(res.data?.cases || []);
    } catch (error) {
      console.error('Error fetching pending cases:', error);
      toast.error('Failed to load pending cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleApprovePriority = async (caseId: number, confirmedPriority: number) => {
    try {
      setActionLoading(caseId);
      await axios.post('/api/emergency/receptionist/approve', {
        caseId,
        priority: confirmedPriority,
      });
      toast.success('✓ Case approved to queue');
      fetchCases();
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve case');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCase = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      await axios.post('/api/emergency/receptionist/reject', {
        caseId,
      });
      toast.success('Case rejected and removed');
      fetchCases();
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject case');
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'from-red-600 to-red-700';
    if (priority === 2) return 'from-amber-600 to-amber-700';
    return 'from-emerald-600 to-emerald-700';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'CRITICAL';
    if (priority === 2) return 'SERIOUS';
    return 'NORMAL';
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center'>
        <IconLoader2 className='h-10 w-10 text-red-500 animate-spin' />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8'>
      <div className='mx-auto max-w-5xl px-4'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8'
        >
          <div className='flex items-center gap-3 mb-4'>
            <IconClipboardCheck className='h-6 w-6 text-amber-500' />
            <div className='flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600'>
              <IconAlertTriangle size={16} />
              Receptionist Review
            </div>
          </div>
          <h1 className='text-4xl font-bold text-white'>Emergency Case Approval</h1>
          <p className='text-slate-400 mt-2 text-lg'>Verify AI priority assignments and approve cases to queue</p>
        </motion.div>

        {/* Stats */}
        <div className='grid grid-cols-4 gap-3 mb-8'>
          <div className='rounded-lg border border-slate-700 bg-slate-900/50 p-4'>
            <p className='text-xs text-slate-400'>Pending</p>
            <p className='text-3xl font-bold text-amber-500'>{cases.length}</p>
          </div>
          <div className='rounded-lg border border-slate-700 bg-slate-900/50 p-4'>
            <p className='text-xs text-slate-400'>Critical</p>
            <p className='text-3xl font-bold text-red-500'>{cases.filter(c => c.priority === 1).length}</p>
          </div>
          <div className='rounded-lg border border-slate-700 bg-slate-900/50 p-4'>
            <p className='text-xs text-slate-400'>Serious</p>
            <p className='text-3xl font-bold text-amber-500'>{cases.filter(c => c.priority === 2).length}</p>
          </div>
          <div className='rounded-lg border border-slate-700 bg-slate-900/50 p-4'>
            <p className='text-xs text-slate-400'>Normal</p>
            <p className='text-3xl font-bold text-emerald-500'>{cases.filter(c => c.priority === 3).length}</p>
          </div>
        </div>

        {/* Cases List */}
        <div className='space-y-4'>
          {cases.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='rounded-lg border border-slate-700 bg-slate-900/50 p-12 text-center'
            >
              <IconCheck className='mx-auto h-12 w-12 text-green-500 mb-4' />
              <p className='text-slate-400'>No pending cases</p>
            </motion.div>
          ) : (
            cases.map((caseItem, idx) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`rounded-xl border bg-gradient-to-br ${getPriorityColor(caseItem.priority)}/10 border-slate-700 p-6 backdrop-blur`}
              >
                {/* Main Info Grid */}
                <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                  <div>
                    <p className='text-xs font-semibold text-slate-400 mb-2'>PATIENT ID</p>
                    <p className='font-mono text-sm font-bold text-white break-all'>{caseItem.patientId}</p>
                  </div>

                  <div className='md:col-span-2'>
                    <p className='text-xs font-semibold text-slate-400 mb-2'>SYMPTOMS</p>
                    <p className='text-sm text-slate-200 font-medium'>{caseItem.symptoms.join(', ')}</p>
                  </div>

                  <div>
                    <p className='text-xs font-semibold text-slate-400 mb-2'>AI PRIORITY</p>
                    <div className={`inline-block rounded-full bg-gradient-to-r ${getPriorityColor(caseItem.priority)} px-4 py-2 text-sm font-bold text-white`}>
                      {getPriorityLabel(caseItem.priority)}
                    </div>
                  </div>
                </div>

                {/* Severity Assessment */}
                <div className='mb-6 rounded-lg bg-black/40 p-5 border-l-4' style={{
                  borderColor: caseItem.priority === 1 ? '#ef4444' : caseItem.priority === 2 ? '#f59e0b' : '#10b981'
                }}>
                  <p className='text-xs font-semibold text-slate-400 mb-2'>SEVERITY ASSESSMENT</p>
                  <p className='font-bold text-white text-base'>
                    {caseItem.priority === 1 ? '🔴 LIFE-THREATENING - Immediate intervention required' : 
                     caseItem.priority === 2 ? '🟠 URGENT - Treatment needed within minutes' :
                     '🟢 STANDARD - Regular queue placement'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3'>
                  {/* Approve Current Priority */}
                  <Button
                    onClick={() => handleApprovePriority(caseItem.id, caseItem.priority)}
                    disabled={actionLoading === caseItem.id}
                    className={`flex-1 bg-gradient-to-r ${getPriorityColor(caseItem.priority)} hover:opacity-90 text-white font-semibold`}
                  >
                    {actionLoading === caseItem.id ? (
                      <>
                        <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <IconCheck className='mr-2 h-4 w-4' />
                        Confirm {getPriorityLabel(caseItem.priority)}
                      </>
                    )}
                  </Button>

                  {/* Change Priority Dropdown */}
                  <div className='flex gap-2'>
                    {caseItem.priority !== 1 && (
                      <Button
                        onClick={() => handleApprovePriority(caseItem.id, 1)}
                        disabled={actionLoading === caseItem.id}
                        variant='outline'
                        size='sm'
                        className='border-red-500/30 text-red-600 hover:bg-red-500/10'
                      >
                        <IconArrowRight className='h-4 w-4' />
                      </Button>
                    )}
                    {caseItem.priority !== 2 && caseItem.priority !== 1 && (
                      <Button
                        onClick={() => handleApprovePriority(caseItem.id, 2)}
                        disabled={actionLoading === caseItem.id}
                        variant='outline'
                        size='sm'
                        className='border-amber-500/30 text-amber-600 hover:bg-amber-500/10'
                      >
                        <IconArrowRight className='h-4 w-4' />
                      </Button>
                    )}
                  </div>

                  {/* Reject */}
                  <Button
                    onClick={() => handleRejectCase(caseItem.id)}
                    disabled={actionLoading === caseItem.id}
                    variant='outline'
                    className='border-red-500/30 text-red-600 hover:bg-red-500/10'
                  >
                    {actionLoading === caseItem.id ? (
                      <IconLoader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <IconX className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
