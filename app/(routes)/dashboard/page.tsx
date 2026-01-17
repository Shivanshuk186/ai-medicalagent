'use client';
import React, { useContext, useEffect, Suspense } from 'react';
import HistoryList from './_components/HistoryList';
import DoctorsAgentlist from './_components/DoctorsAgentlist';
import AddNewSessionDialog from './_components/AddNewSessionDialog';
import HealthTrendsDialog from './_components/HealthTrendsDialog';
import UploadReportDialog from './_components/UploadReportDialog';
import ImageAnalysisDialog from './_components/ImageAnalysisDialog';
import ErrorBoundary from '@/components/ErrorBoundary';
import { FloatingChatBot } from '@/components/FloatingChatBot';
import { IconSparkles, IconStethoscope, IconCrown, IconMessageCircle, IconPhoto } from '@tabler/icons-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { UserDetailContext } from '@/context/UserDetailcontext';

function DashboardContent() {
    const searchParams = useSearchParams();
    const { userDetail } = useContext(UserDetailContext);
    const [showChat, setShowChat] = React.useState(false);
    const [showImageAnalysis, setShowImageAnalysis] = React.useState(false);

    useEffect(() => {
        const payment = searchParams.get('payment');
        const plan = searchParams.get('plan');

        if (payment === 'success' && plan) {
            toast.success(`Successfully upgraded to ${plan} plan! 🎉`, {
                duration: 5000,
                description: 'You now have access to all premium features.',
            });
            // Clean up URL
            window.history.replaceState({}, '', '/dashboard');
        } else if (payment === 'cancelled') {
            toast.error('Payment was cancelled', {
                description: 'You can try again anytime from the pricing page.',
            });
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [searchParams]);

    return (
        <ErrorBoundary>
            <div className='space-y-10'>
                {/* Welcome Header */}
                <div className='rounded-3xl border bg-gradient-to-br from-primary/5 via-primary/10 to-blue-500/5 p-8 md:p-10'>
                    <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
                        <div className='flex-1'>
                            <div className='mb-2 flex items-center gap-2'>
                                <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'>
                                    <IconSparkles size={14} />
                                    AI Healthcare Platform
                                </div>
                                {userDetail?.isPremium && (
                                    <div className='inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 text-sm font-medium text-white'>
                                        <IconCrown size={14} />
                                        Premium
                                    </div>
                                )}
                            </div>
                            <h1 className='mb-2 text-4xl font-bold'>Welcome Back!</h1>
                            <p className='text-lg text-muted-foreground'>
                                {userDetail?.isPremium 
                                    ? 'Enjoy unlimited consultations with all AI specialists'
                                    : 'Start a consultation or review your medical history'
                                }
                            </p>
                        </div>
                        <div className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-center'>
                            <UploadReportDialog sessionId="dashboard" onUploadSuccess={() => window.location.reload()} />
                            <HealthTrendsDialog />
                            <AddNewSessionDialog />
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                    <div 
                        onClick={() => setShowImageAnalysis(true)}
                        className='rounded-2xl border bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-6 hover:shadow-lg hover:border-orange-500/50 transition-all cursor-pointer'
                    >
                        <div className='mb-3 inline-flex rounded-full bg-orange-500/20 p-3'>
                            <IconPhoto className='text-orange-600' size={24} />
                        </div>
                        <h3 className='mb-2 text-lg font-semibold'>Image Analysis</h3>
                        <p className='text-sm text-muted-foreground'>Upload images of rashes, wounds, or symptoms for AI diagnosis</p>
                        <div className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-orange-600'>
                            Click to analyze
                            <span className='text-lg'>→</span>
                        </div>
                    </div>
                    
                    <div className='rounded-2xl border bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 hover:shadow-lg transition-shadow cursor-pointer'>
                        <div className='mb-3 inline-flex rounded-full bg-blue-500/20 p-3'>
                            <IconSparkles className='text-blue-600' size={24} />
                        </div>
                        <h3 className='mb-2 text-lg font-semibold'>Upload Lab Report</h3>
                        <p className='text-sm text-muted-foreground'>Upload your medical reports for AI analysis with risk assessment</p>
                    </div>
                    
                    <div className='rounded-2xl border bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 hover:shadow-lg transition-shadow cursor-pointer'>
                        <div className='mb-3 inline-flex rounded-full bg-purple-500/20 p-3'>
                            <IconStethoscope className='text-purple-600' size={24} />
                        </div>
                        <h3 className='mb-2 text-lg font-semibold'>Voice Consultation</h3>
                        <p className='text-sm text-muted-foreground'>Start a voice consultation with AI medical specialists</p>
                    </div>
                    
                    <div 
                        onClick={() => setShowChat(true)}
                        className='rounded-2xl border bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 hover:shadow-lg hover:border-emerald-500/50 transition-all cursor-pointer'
                    >
                        <div className='mb-3 inline-flex rounded-full bg-emerald-500/20 p-3'>
                            <IconMessageCircle className='text-emerald-600' size={24} />
                        </div>
                        <h3 className='mb-2 text-lg font-semibold'>Text Chat</h3>
                        <p className='text-sm text-muted-foreground'>Chat with AI doctors via text - get instant medical advice</p>
                        <div className='mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600'>
                            Click to start chatting
                            <span className='text-lg'>→</span>
                        </div>
                    </div>
                    
                    <div className='rounded-2xl border bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 hover:shadow-lg transition-shadow cursor-pointer'>
                        <div className='mb-3 inline-flex rounded-full bg-green-500/20 p-3'>
                            <IconSparkles className='text-green-600' size={24} />
                        </div>
                        <h3 className='mb-2 text-lg font-semibold'>Health Trends</h3>
                        <p className='text-sm text-muted-foreground'>Track your health progress with visual trend analysis</p>
                    </div>
                </div>

                {/* Recent Consultations */}
                <HistoryList />

                {/* AI Specialists */}
                <DoctorsAgentlist />
            </div>
            
            {/* Floating Chat Bot - Pass showChat state */}
            <FloatingChatBot initialOpen={showChat} onClose={() => setShowChat(false)} />
            
            {/* Image Analysis Dialog */}
            <ImageAnalysisDialog open={showImageAnalysis} onClose={() => setShowImageAnalysis(false)} />
        </ErrorBoundary>
    )
}

function Dashboard() {
    return (
        <ErrorBoundary>
            <Suspense fallback={<div>Loading...</div>}>
                <DashboardContent />
            </Suspense>
        </ErrorBoundary>
    )
}

export default Dashboard;