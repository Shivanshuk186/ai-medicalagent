'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { IconCheck, IconX, IconLoader2, IconClock, IconShieldCheck } from '@tabler/icons-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type Payment = {
  id: number;
  transactionId: string;
  userEmail: string;
  amount: string;
  status: string;
  createdAt: string;
  approvedAt?: string;
  rejectionReason?: string;
};

export default function AdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setCheckingAuth(true);
      const response = await axios.get('/api/admin/check');
      setIsAdmin(response.data.isAdmin);
      if (response.data.isAdmin) {
        fetchPayments();
      } else {
        toast.error('Unauthorized access');
      }
    } catch (error) {
      setIsAdmin(false);
      toast.error('Unauthorized access');
    } finally {
      setCheckingAuth(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/payments');
      setPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      // Silently fail for payments loading - show empty state instead
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: number) => {
    try {
      setActionLoading(paymentId);
      const response = await axios.post('/api/admin/payments/approve', {
        paymentId,
      });

      if (response.data.success) {
        toast.success('Payment approved! User upgraded to Premium.');
        fetchPayments();
      }
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.response?.data?.error || 'Failed to approve payment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedPayment || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(selectedPayment.id);
      const response = await axios.post('/api/admin/payments/reject', {
        paymentId: selectedPayment.id,
        reason: rejectionReason,
      });

      if (response.data.success) {
        toast.success('Payment rejected');
        setShowRejectDialog(false);
        setRejectionReason('');
        setSelectedPayment(null);
        fetchPayments();
      }
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast.error(error.response?.data?.error || 'Failed to reject payment');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowRejectDialog(true);
  };

  // Show loading while checking authentication
  if (checkingAuth || isAdmin === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="mx-auto mb-4 h-16 w-16 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after auth check completes
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <IconShieldCheck className="mx-auto mb-4 h-16 w-16 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <IconShieldCheck size={16} />
            Admin Panel
          </div>
          <h1 className="mb-2 text-4xl font-bold">Payment Verification</h1>
          <p className="text-muted-foreground">Review and approve premium subscription payments</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border bg-card shadow-lg"
        >
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : payments.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <IconClock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No pending payments</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>User Email</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">{payment.transactionId}</TableCell>
                      <TableCell>{payment.userEmail}</TableCell>
                      <TableCell className="font-semibold">₹{payment.amount}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            payment.status === 'approved'
                              ? 'bg-green-500/10 text-green-600'
                              : payment.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}
                        >
                          {payment.status === 'pending' && <IconClock size={14} />}
                          {payment.status === 'approved' && <IconCheck size={14} />}
                          {payment.status === 'rejected' && <IconX size={14} />}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {payment.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApprove(payment.id)}
                              disabled={actionLoading === payment.id}
                            >
                              {actionLoading === payment.id ? (
                                <IconLoader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <IconCheck className="mr-1 h-4 w-4" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(payment)}
                              disabled={actionLoading === payment.id}
                            >
                              <IconX className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {payment.status === 'approved' && (
                          <span className="text-sm text-muted-foreground">
                            Approved on {new Date(payment.approvedAt!).toLocaleDateString()}
                          </span>
                        )}
                        {payment.status === 'rejected' && payment.rejectionReason && (
                          <span className="text-sm text-destructive" title={payment.rejectionReason}>
                            Rejected
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. The user will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm">
                  <span className="font-medium">Transaction ID:</span>{' '}
                  <span className="font-mono">{selectedPayment.transactionId}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">User:</span> {selectedPayment.userEmail}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Amount:</span> ₹{selectedPayment.amount}
                </p>
              </div>
            )}
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
                setSelectedPayment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || actionLoading === selectedPayment?.id}
            >
              {actionLoading === selectedPayment?.id ? (
                <>
                  <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
