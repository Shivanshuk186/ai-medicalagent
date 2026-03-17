'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { IconCheck, IconX, IconLoader2, IconAlertTriangle } from '@tabler/icons-react';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PendingCase = {
  id: number;
  patientId: string;
  symptoms: string[];
  priority: number;
  arrivalTime: string;
  request?: {
    patientName: string;
    analysisData: {
      reason: string;
      estimatedWaitTime: number;
    };
  };
};

export default function ReceptionistApprovalPage() {
  const [cases, setCases] = useState<PendingCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    try {
      const adminRes = await axios.get('/api/admin/check');
      if (!adminRes.data.isAdmin) {
        toast.error('Receptionist access required');
        return;
      }
      setIsAdmin(true);
      await fetchPendingCases();
    } catch (error) {
      console.error('Failed to verify admin status:', error);
      toast.error('Unauthorized access');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCases = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/emergency/pending');
      setCases(response.data.cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      await axios.post('/api/emergency/approve', { caseId });
      toast.success('Case approved and added to queue');
      setCases(cases.filter((c) => c.id !== caseId));
    } catch (error: any) {
      console.error('Error approving case:', error);
      toast.error(error.response?.data?.error || 'Failed to approve case');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (caseId: number) => {
    try {
      setActionLoading(caseId);
      await axios.post('/api/emergency/reject', { caseId });
      toast.success('Case rejected');
      setCases(cases.filter((c) => c.id !== caseId));
    } catch (error: any) {
      console.error('Error rejecting case:', error);
      toast.error('Failed to reject case');
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

  if (!isAdmin) {
    return (
      <div className='flex min-h-[60vh] flex-col items-center justify-center gap-4'>
        <IconAlertTriangle className='h-12 w-12 text-amber-500' />
        <h2 className='text-2xl font-bold'>Receptionist Access Required</h2>
        <p className='text-muted-foreground'>Only hospital staff can access this page</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='rounded-3xl border bg-gradient-to-br from-blue-500/5 via-cyan-500/5 to-emerald-500/10 p-8'
      >
        <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600'>
          <IconAlertTriangle size={14} />
          Receptionist Panel
        </div>
        <h1 className='text-3xl font-bold'>Emergency Case Verification</h1>
        <p className='text-muted-foreground'>Review and approve AI-classified emergency cases</p>
      </motion.div>

      {cases.length === 0 ? (
        <div className='rounded-2xl border border-dashed flex flex-col items-center justify-center py-12 text-center'>
          <IconCheck className='mb-2 h-12 w-12 text-emerald-500' />
          <h3 className='text-lg font-semibold'>All cases reviewed!</h3>
          <p className='text-muted-foreground'>No pending cases at this moment</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='rounded-2xl border overflow-hidden'
        >
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Symptoms</TableHead>
                  <TableHead>AI Priority</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Est. Wait</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((caseItem) => (
                  <TableRow key={caseItem.id}>
                    <TableCell className='font-medium'>{caseItem.patientId}</TableCell>
                    <TableCell>
                      <div className='max-w-xs'>
                        {caseItem.symptoms.slice(0, 2).join(', ')}
                        {caseItem.symptoms.length > 2 && ` +${caseItem.symptoms.length - 2}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                          caseItem.priority === 1
                            ? 'bg-red-500/15 text-red-600'
                            : caseItem.priority === 2
                              ? 'bg-amber-500/15 text-amber-600'
                              : 'bg-emerald-500/15 text-emerald-600'
                        }`}
                      >
                        {caseItem.priority === 1 ? 'Critical' : caseItem.priority === 2 ? 'Serious' : 'Normal'}
                      </span>
                    </TableCell>
                    <TableCell className='max-w-xs text-sm text-muted-foreground'>
                      {caseItem.request?.analysisData?.reason || 'AI Analysis'}
                    </TableCell>
                    <TableCell>
                      {caseItem.request?.analysisData?.estimatedWaitTime || 15} min
                    </TableCell>
                    <TableCell className='text-right'>
                      <div className='flex gap-2 justify-end'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => handleReject(caseItem.id)}
                          disabled={actionLoading === caseItem.id}
                          className='text-red-600 hover:bg-red-500/10'
                        >
                          {actionLoading === caseItem.id ? (
                            <IconLoader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <>
                              <IconX size={16} className='mr-1' />
                              Reject
                            </>
                          )}
                        </Button>
                        <Button
                          size='sm'
                          onClick={() => handleApprove(caseItem.id)}
                          disabled={actionLoading === caseItem.id}
                          className='bg-green-600 hover:bg-green-700'
                        >
                          {actionLoading === caseItem.id ? (
                            <IconLoader2 className='h-4 w-4 animate-spin' />
                          ) : (
                            <>
                              <IconCheck size={16} className='mr-1' />
                              Approve
                            </>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
