'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { IconAlertTriangle, IconLoader2, IconCheck, IconUpload, IconX } from '@tabler/icons-react';

type RegistrationStep = 'form' | 'analyzing' | 'review' | 'submitting' | 'success';

type AIAnalysisResult = {
  priority: 1 | 2 | 3;
  reason: string;
  severity_score: number;
};

export default function EmergencyRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>('form');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [symptomsText, setSymptomsText] = useState('');
  const [emergencyDescription, setEmergencyDescription] = useState('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!patientName.trim() || !symptomsText.trim()) {
      toast.error('Please enter patient name and symptoms');
      return;
    }

    try {
      setLoading(true);
      setStep('analyzing');

      const symptoms = symptomsText.split('\n').filter((s) => s.trim());
      
      const response = await axios.post('/api/emergency/analyze', {
        symptoms: symptoms.join(', '),
      });

      if (response.data.success) {
        const analysis: AIAnalysisResult = {
          priority: response.data.priority,
          reason: response.data.reason,
          severity_score: response.data.severity_score,
        };
        setAiAnalysis(analysis);
        setStep('review');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast.error(error.response?.data?.error || 'Failed to analyze symptoms');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!aiAnalysis) {
      toast.error('Please complete AI analysis first');
      return;
    }

    try {
      setLoading(true);
      setStep('submitting');

      const symptoms = symptomsText.split('\n').filter((s) => s.trim());
      
      const response = await axios.post('/api/emergency/register', {
        patientName: patientName.trim(),
        patientId: patientName.trim().replace(/\s+/g, '_').toLowerCase(),
        age: age ? parseInt(age) : undefined,
        symptoms,
        emergencyDescription: emergencyDescription.trim(),
        priority: aiAnalysis.priority,
        aiAnalysis: {
          reason: aiAnalysis.reason,
          severity_score: aiAnalysis.severity_score,
        },
      });

      if (response.data.success) {
        setStep('success');
        toast.success('Emergency case registered and sent for approval!');

        setTimeout(() => {
          router.push('/emergency/status?patientId=' + response.data.queueItem.patientId);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Failed to register emergency case');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'text-red-500 bg-red-500/10';
    if (priority === 2) return 'text-amber-500 bg-amber-500/10';
    return 'text-emerald-500 bg-emerald-500/10';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority === 1) return 'CRITICAL';
    if (priority === 2) return 'SERIOUS';
    return 'NORMAL';
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-8'>
      <div className='mx-auto max-w-2xl px-4'>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-8 text-center'
        >
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600'>
            <IconAlertTriangle size={16} />
            Emergency Registration
          </div>
          <h1 className='text-4xl font-bold text-white mb-2'>Patient Emergency Intake</h1>
          <p className='text-slate-400'>Register and get AI-assisted priority assessment</p>
        </motion.div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='rounded-2xl border border-slate-700 bg-slate-900/50 p-8 backdrop-blur'
        >
          {step === 'form' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-semibold text-white mb-3'>Patient Name *</label>
                  <input
                    type='text'
                    placeholder='Full name'
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    disabled={loading}
                    className='w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none disabled:opacity-50'
                  />
                </div>
                <div>
                  <label className='block text-sm font-semibold text-white mb-3'>Age (Optional)</label>
                  <input
                    type='number'
                    placeholder='Age'
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={loading}
                    min='0'
                    max='150'
                    className='w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none disabled:opacity-50'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-semibold text-white mb-3'>Symptoms & Chief Complaint *</label>
                <Textarea
                  placeholder={`Enter symptoms (one per line):
• Severe chest pain radiating to left arm
• Difficulty breathing
• Sweating
• Pain started 30 minutes ago`}
                  value={symptomsText}
                  onChange={(e) => setSymptomsText(e.target.value)}
                  disabled={loading}
                  className='h-32 resize-none border-slate-600 bg-slate-800 text-white placeholder-slate-500 disabled:opacity-50'
                />
                <p className='mt-2 text-xs text-slate-400'>Be as detailed as possible. This helps with AI analysis.</p>
              </div>

              <div>
                <label className='block text-sm font-semibold text-white mb-3'>Emergency Description (Optional)</label>
                <Textarea
                  placeholder='Any additional details about the emergency situation...'
                  value={emergencyDescription}
                  onChange={(e) => setEmergencyDescription(e.target.value)}
                  disabled={loading}
                  className='h-24 resize-none border-slate-600 bg-slate-800 text-white placeholder-slate-500 disabled:opacity-50'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-white mb-3'>Upload Patient Image (Optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className='relative rounded-lg border-2 border-dashed border-slate-600 bg-slate-800/50 p-6 text-center transition-colors hover:border-red-500 hover:bg-slate-800 cursor-pointer'
                >
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    disabled={loading}
                    className='hidden'
                  />
                  {!imagePreview ? (
                    <div>
                      <IconUpload className='mx-auto h-8 w-8 text-slate-400 mb-2' />
                      <p className='text-sm text-slate-300'>Click to upload or drag and drop</p>
                      <p className='text-xs text-slate-500'>PNG, JPG, GIF up to 5MB</p>
                    </div>
                  ) : (
                    <div className='space-y-2'>
                      <img src={imagePreview} alt='preview' className='mx-auto max-h-32 rounded' />
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                      >
                        <IconX size={16} /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading || !patientName.trim() || !symptomsText.trim()}
                className='w-full bg-red-600 hover:bg-red-700'
              >
                {loading ? (
                  <>
                    <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                    Analyzing...
                  </>
                ) : (
                  'Analyze with AI'
                )}
              </Button>
            </div>
          )}

          {step === 'analyzing' && (
            <div className='flex flex-col items-center justify-center space-y-4 py-8'>
              <IconLoader2 className='h-12 w-12 text-red-500 animate-spin' />
              <p className='text-slate-400'>Analyzing patient condition...</p>
            </div>
          )}

          {step === 'review' && aiAnalysis && (
            <div className='space-y-6'>
              <div className='rounded-lg bg-slate-800 p-6 space-y-4'>
                <div>
                  <p className='text-sm text-slate-400'>Analyzed Priority Level</p>
                  <p className={`text-3xl font-bold mt-2 ${getPriorityColor(aiAnalysis.priority)}`}>
                    {getPriorityLabel(aiAnalysis.priority)}
                  </p>
                </div>

                <div>
                  <p className='text-sm text-slate-400'>AI Analysis Reason</p>
                  <p className='text-white mt-2'>{aiAnalysis.reason}</p>
                </div>

                <div>
                  <p className='text-sm text-slate-400'>Severity Score</p>
                  <div className='mt-2 flex items-center gap-2'>
                    <div className='flex-1 h-2 rounded-full bg-slate-700 overflow-hidden'>
                      <div
                        className={`h-full ${
                          aiAnalysis.severity_score >= 8
                            ? 'bg-red-500'
                            : aiAnalysis.severity_score >= 5
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(aiAnalysis.severity_score / 10) * 100}%` }}
                      />
                    </div>
                    <span className='text-white font-semibold'>{aiAnalysis.severity_score.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>

              <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'>
                <p className='text-sm text-blue-300'>ℹ️ This assessment will be reviewed by a receptionist before being added to the queue.</p>
              </div>

              <div className='flex gap-4'>
                <Button
                  variant='outline'
                  onClick={() => setStep('form')}
                  disabled={loading}
                  className='flex-1'
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className='flex-1 bg-red-600 hover:bg-red-700'
                >
                  {loading ? (
                    <>
                      <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Approval'
                  )}
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className='flex flex-col items-center justify-center space-y-4 py-8'>
              <IconCheck className='h-16 w-16 text-emerald-500' />
              <h2 className='text-2xl font-bold text-white'>Registration Successful</h2>
              <p className='text-slate-400 text-center'>
                Your emergency case has been submitted. A receptionist will review and approve shortly.
              </p>
              <p className='text-sm text-slate-500'>Redirecting to status page...</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
