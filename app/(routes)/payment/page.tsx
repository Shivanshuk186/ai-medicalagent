'use client';

import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconCheck, IconCopy, IconQrcode, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { UserDetailContext } from '@/context/UserDetailcontext';

export default function PaymentPage() {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const { refreshUserDetails } = useContext(UserDetailContext);
  const router = useRouter();

  const UPI_ID = '7303774374@ptsbi';
  const AMOUNT = '999';

  // Check payment status periodically after submission
  useEffect(() => {
    if (!paymentSubmitted) return;

    const checkStatus = async () => {
      try {
        const response = await axios.get('/api/payment/status');
        const approvedPayment = response.data.payments?.find(
          (p: any) => p.status === 'approved' && p.transactionId === transactionId.trim()
        );

        if (approvedPayment) {
          // Refresh user details to get updated premium status
          if (refreshUserDetails) {
            await refreshUserDetails();
          }
          toast.success('🎉 Payment approved! You now have premium access!');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check immediately
    checkStatus();

    // Then check every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [paymentSubmitted, transactionId, router, refreshUserDetails]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    toast.success('UPI ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    try {
      setLoading(true);
      
      const response = await axios.post('/api/payment/submit', {
        transactionId: transactionId.trim(),
        amount: AMOUNT,
      });

      if (response.data.success) {
        setPaymentSubmitted(true);
        toast.success('Payment submitted successfully!');
        toast.info('Checking for approval... Please wait.', {
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('Error submitting payment:', error);
      toast.error(error.response?.data?.error || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 py-6">
      <div className="mx-auto max-w-4xl px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl border bg-card shadow-xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-8 text-center">
            <div className="mb-4 inline-flex rounded-full bg-primary/10 p-3">
              <IconQrcode size={32} className="text-primary" />
            </div>
            <h1 className="mb-2 text-3xl font-bold">Complete Your Payment</h1>
            <p className="text-muted-foreground">Scan QR code or use UPI ID to pay ₹{AMOUNT}</p>
          </div>

          <div className="grid gap-8 p-8 md:grid-cols-2">
            {/* QR Code Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Scan QR Code</h2>
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed bg-muted/50 p-8">
                <div className="text-center">
                  {/* Replace with actual QR code image */}
                  <div className="mb-4 flex h-64 w-64 items-center justify-center rounded-xl bg-white p-4">
                    <Image
                      src="/QR_CODE.jpg"
                      alt="UPI QR Code"
                      width={256}
                      height={256}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Scan with any UPI app
                  </p>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="space-y-3 rounded-xl bg-muted/50 p-4">
                <h3 className="font-semibold">Payment Instructions:</h3>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                    Open your UPI app (PhonePe, Paytm, GPay, etc.)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                    Scan the QR code or use UPI ID
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                    Pay exactly ₹{AMOUNT}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                    Copy transaction ID from your payment app
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
                    Paste it below and submit
                  </li>
                </ol>
              </div>
            </div>

            {/* UPI ID and Transaction Form */}
            <div className="space-y-6">
              {/* UPI ID */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold">Or Use UPI ID</h2>
                <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-4">
                  <code className="flex-1 text-sm font-mono">{UPI_ID}</code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyUpiId}
                    className="shrink-0"
                  >
                    {copied ? (
                      <IconCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <IconCopy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Amount Display */}
              <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-6">
                <p className="mb-2 text-sm text-muted-foreground">Amount to Pay</p>
                <p className="text-4xl font-bold text-primary">₹{AMOUNT}</p>
                <p className="mt-2 text-sm text-muted-foreground">Premium Monthly Subscription</p>
              </div>

              {/* Transaction ID Input */}
              <div className="space-y-3">
                <h3 className="font-semibold">Enter Transaction Details</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Transaction ID / UTR Number</label>
                  <Textarea
                    placeholder="Enter your UPI transaction ID or UTR number here..."
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    You can find this in your payment app after successful payment
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitPayment}
                disabled={loading || !transactionId.trim()}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <IconCheck className="mr-2 h-5 w-5" />
                    Submit Payment
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your payment will be verified by admin. Premium access will be activated within 24 hours.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border bg-card p-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            🔒 Your payment information is secure. Never share your UPI PIN or OTP with anyone.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
