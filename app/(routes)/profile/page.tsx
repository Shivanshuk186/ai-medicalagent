'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconCreditCard,
  IconCheck,
  IconAlertCircle,
  IconSparkles,
  IconEdit
} from '@tabler/icons-react';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import moment from 'moment';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ consultations: 0, credits: 0 });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const result = await axios.get('/api/users');
      setUserData(result.data);
      
      // Fetch consultation stats
      const historyResult = await axios.get('/api/session-chat?sessionId=all');
      setStats({
        consultations: historyResult.data?.length || 0,
        credits: result.data?.credits || 0
      });
      
      toast.success('Profile refreshed');
    } catch (err) {
      console.error('Error fetching user data:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  const isPremium = userData?.isPremium || false;
  const premiumExpiresAt = userData?.premiumExpiresAt ? moment(userData.premiumExpiresAt).format('MMMM DD, YYYY') : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-12 md:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <IconUser size={16} />
              Account Settings
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchUserData}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Status'}
            </Button>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight md:text-5xl">
            Your
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent"> Profile</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="overflow-hidden rounded-3xl border bg-card">
              <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 p-6">
                <div className="mb-4 flex justify-center">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt={user.fullName || 'User'}
                      width={100}
                      height={100}
                      className="rounded-full border-4 border-background shadow-xl"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-background bg-primary text-2xl font-bold text-primary-foreground shadow-xl">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                  )}
                </div>
                <h2 className="mb-1 text-center text-2xl font-bold">
                  {user?.fullName || 'User'}
                </h2>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
                
                {isPremium ? (
                  <div className="flex items-center justify-center gap-2 rounded-full bg-primary/20 py-2 text-sm font-semibold text-primary">
                    <IconSparkles size={16} />
                    Premium Member
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 rounded-full bg-muted py-2 text-sm font-semibold text-muted-foreground">
                    Free Plan
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Consultations</p>
                    <p className="text-2xl font-bold">{stats.consultations}</p>
                  </div>
                  <IconCheck className="text-primary" size={32} />
                </div>
                
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Credits</p>
                    <p className="text-2xl font-bold">{stats.credits}</p>
                  </div>
                  <IconCreditCard className="text-primary" size={32} />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details & Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6 lg:col-span-2"
          >
            {/* Account Information */}
            <div className="overflow-hidden rounded-3xl border bg-card">
              <div className="border-b bg-muted/50 p-6">
                <h3 className="text-xl font-bold">Account Information</h3>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <IconUser size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{user?.fullName || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <IconMail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-semibold">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <IconCalendar size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-semibold">
                      {moment(user?.createdAt).format('MMMM DD, YYYY')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="overflow-hidden rounded-3xl border bg-card">
              <div className="border-b bg-muted/50 p-6">
                <h3 className="text-xl font-bold">Subscription</h3>
              </div>
              <div className="p-6">
                {isPremium ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <IconSparkles className="text-primary" size={24} />
                      <div>
                        <p className="font-semibold">Premium Plan</p>
                        <p className="text-sm text-muted-foreground">
                          ₹999/month {premiumExpiresAt && `• Expires ${premiumExpiresAt}`}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-600 dark:text-green-400">
                      ✓ You have unlimited access to all specialists
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <IconAlertCircle className="text-muted-foreground" size={24} />
                      <div>
                        <p className="font-semibold">Free Plan</p>
                        <p className="text-sm text-muted-foreground">Limited access to AI specialists</p>
                      </div>
                    </div>
                    <Button asChild className="w-full rounded-xl">
                      <a href="/pricing">
                        <IconSparkles size={18} className="mr-2" />
                        Upgrade to Premium
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="overflow-hidden rounded-3xl border border-red-500/20 bg-card">
              <div className="border-b border-red-500/20 bg-red-500/10 p-6">
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h3>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button 
                  variant="destructive" 
                  className="rounded-xl"
                  onClick={() => toast.error('Account deletion is not available yet')}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
