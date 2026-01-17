'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  IconUpload,
  IconX,
  IconLoader2,
  IconPhoto,
  IconAlertCircle,
  IconCheck,
  IconArrowRight,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AIDoctorAgents } from '@/shared/list';

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ImageAnalysisDialog({ open, onClose }: Props) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [consultingSpecialist, setConsultingSpecialist] = useState(false);
  const router = useRouter();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !imagePreview) {
      toast.error('Please select an image first');
      return;
    }

    try {
      setLoading(true);
      setAnalysis(null);

      const response = await axios.post('/api/analyze-image', {
        imageUrl: imagePreview,
        additionalContext: additionalContext.trim(),
      });

      if (response.data.success) {
        setAnalysis(response.data);
        toast.success('Analysis complete!');
      }
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      
      if (error.response?.status === 401) {
        toast.error('Authentication error. Please refresh the page and try again.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to analyze image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview('');
    setAdditionalContext('');
    setAnalysis(null);
    setConsultingSpecialist(false);
    onClose();
  };

  const handleConsultSpecialist = async () => {
    if (!analysis?.structured?.specialist) {
      toast.error('No specialist recommendation found');
      return;
    }

    try {
      setConsultingSpecialist(true);

      // Normalize specialist name and find matching doctor
      const specialist = analysis.structured.specialist.trim();
      
      // Create a mapping for better matching
      const specialistMap: { [key: string]: string } = {
        'dermatologist': 'Dermatologist',
        'skin': 'Dermatologist',
        'cardiologist': 'Cardiologist',
        'heart': 'Cardiologist',
        'orthopedic': 'Orthopedic',
        'bone': 'Orthopedic',
        'joint': 'Orthopedic',
        'pediatrician': 'Pediatrician',
        'child': 'Pediatrician',
        'baby': 'Pediatrician',
        'gynecologist': 'Gynecologist',
        'psychologist': 'Psychologist',
        'psychiatrist': 'Psychologist',
        'mental': 'Psychologist',
        'dentist': 'Dentist',
        'dental': 'Dentist',
        'teeth': 'Dentist',
        'tooth': 'Dentist',
        'ent': 'ENT Specialist',
        'ear': 'ENT Specialist',
        'nose': 'ENT Specialist',
        'throat': 'ENT Specialist',
        'nutritionist': 'Nutritionist',
        'diet': 'Nutritionist',
        'nutrition': 'Nutritionist',
      };

      // Try to find specialist using mapping
      let matchedSpecialist = specialist;
      const lowerSpecialist = specialist.toLowerCase();
      
      for (const [key, value] of Object.entries(specialistMap)) {
        if (lowerSpecialist.includes(key)) {
          matchedSpecialist = value;
          break;
        }
      }

      // Find the doctor
      let doctor = AIDoctorAgents.find(
        (d) => d.specialist.toLowerCase() === matchedSpecialist.toLowerCase() ||
               d.specialist.toLowerCase().includes(matchedSpecialist.toLowerCase()) ||
               matchedSpecialist.toLowerCase().includes(d.specialist.toLowerCase())
      );

      // Fallback to General Physician if no match found
      if (!doctor) {
        console.log('Specialist not found:', specialist, 'Normalized to:', matchedSpecialist, '- Falling back to General Physician');
        doctor = AIDoctorAgents.find((d) => d.specialist === 'General Physician');
        
        if (!doctor) {
          toast.error('Unable to connect to a specialist. Please try again.');
          return;
        }
        
        toast.info('Connecting you to General Physician who can help with your condition.');
      }

      // Create session with context from image analysis
      const contextNote = `Image Analysis Context:
What I See: ${analysis.structured.observation}
Possible Conditions: ${analysis.structured.conditions.join(', ')}
Severity: ${analysis.structured.severity}
Key Signs: ${analysis.structured.indicators.join(', ')}

Patient Context: ${additionalContext || 'No additional context provided'}`;

      const result = await axios.post('/api/session-chat', {
        notes: contextNote,
        selectedDoctor: {
          ...doctor,
          agentPrompt: `You are a ${doctor.specialist} AI. The patient has already shared an image showing: ${analysis.structured.observation}. Possible conditions: ${analysis.structured.conditions.join(', ')}. 

DO NOT ask for name, age, or basic info. Jump straight to helping with their specific condition. Be brief, clear, and helpful. Keep responses short and focused on their issue.`
        }
      });

      if (result.data) {
        toast.success(`Connecting you to ${doctor.specialist}...`);
        setTimeout(() => {
          router.push(`/dashboard/medical-agent/${result.data.sessionId}`);
          handleClose();
        }, 500);
      }
    } catch (error: any) {
      console.error('Error creating consultation:', error);
      toast.error('Failed to connect to specialist. Please try again.');
    } finally {
      setConsultingSpecialist(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'mild':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'severe':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSpecialistButtonText = () => {
    if (!analysis?.structured?.specialist) return 'Talk to Specialist';
    
    const specialist = analysis.structured.specialist.trim();
    
    // Map to actual doctor names in our system
    const specialistMap: { [key: string]: string } = {
      'dermatologist': 'Dermatologist',
      'skin': 'Dermatologist',
      'cardiologist': 'Cardiologist',
      'heart': 'Cardiologist',
      'orthopedic': 'Orthopedic Specialist',
      'bone': 'Orthopedic Specialist',
      'pediatrician': 'Pediatrician',
      'child': 'Pediatrician',
      'gynecologist': 'Gynecologist',
      'psychologist': 'Psychologist',
      'psychiatrist': 'Psychologist',
      'dentist': 'Dentist',
      'dental': 'Dentist',
      'ent': 'ENT Specialist',
      'ear': 'ENT Specialist',
      'nose': 'ENT Specialist',
      'throat': 'ENT Specialist',
      'nutritionist': 'Nutritionist',
      'diet': 'Nutritionist',
    };

    const lowerSpecialist = specialist.toLowerCase();
    
    for (const [key, value] of Object.entries(specialistMap)) {
      if (lowerSpecialist.includes(key)) {
        return `Talk to ${value}`;
      }
    }
    
    // Check if doctor exists in our list
    const doctor = AIDoctorAgents.find(
      (d) => d.specialist.toLowerCase() === specialist.toLowerCase() ||
             d.specialist.toLowerCase().includes(specialist.toLowerCase())
    );
    
    if (doctor) {
      return `Talk to ${doctor.specialist}`;
    }
    
    // Fallback to General Physician
    return 'Talk to General Physician';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <IconPhoto className="text-primary" size={28} />
            AI Symptom Image Analysis
          </DialogTitle>
          <DialogDescription>
            Upload an image of your medical concern for AI-powered analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Image Upload Section */}
          {!analysis && (
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-dashed">
                      <Image
                        src={imagePreview}
                        alt="Selected image"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview('');
                      }}
                    >
                      <IconX size={16} />
                    </Button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 p-12 transition-colors hover:bg-muted/50">
                    <IconUpload size={48} className="mb-4 text-muted-foreground" />
                    <p className="mb-2 text-lg font-semibold">Click to upload image</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>

              {/* Additional Context */}
              {imagePreview && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Additional Context (Optional)
                  </label>
                  <Textarea
                    placeholder="Describe any symptoms, duration, or other relevant information..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Analyze Button */}
              {imagePreview && (
                <Button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <IconLoader2 className="mr-2 animate-spin" size={20} />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <IconPhoto className="mr-2" size={20} />
                      Analyze Image
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              {/* Image Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border">
                <Image
                  src={imagePreview}
                  alt="Analyzed image"
                  fill
                  className="object-contain"
                />
              </div>

              {/* Quick Summary Card */}
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
                <h3 className="mb-3 flex items-center gap-2 text-xl font-bold">
                  <IconCheck className="text-primary" size={24} />
                  Quick Summary
                </h3>
                
                {/* What I See */}
                {analysis.structured?.observation && (
                  <div className="mb-4">
                    <p className="text-lg">{analysis.structured.observation}</p>
                  </div>
                )}

                {/* Severity */}
                {analysis.structured?.severity && (
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Severity:</span>
                    <span className={`rounded-full border px-4 py-1 text-sm font-semibold ${getSeverityColor(analysis.structured.severity)}`}>
                      {analysis.structured.severity}
                    </span>
                  </div>
                )}

                {/* Specialist Recommendation */}
                {analysis.structured?.specialist && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <p className="mb-2 text-sm font-medium text-blue-900">Recommended Specialist:</p>
                    <p className="text-lg font-bold text-blue-700">{analysis.structured.specialist}</p>
                  </div>
                )}
              </div>

              {/* Possible Conditions */}
              {analysis.structured?.conditions?.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="mb-3 font-semibold text-lg">Possible Conditions</h3>
                  <ul className="space-y-2">
                    {analysis.structured.conditions.map((condition: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base">
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {idx + 1}
                        </span>
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Signs */}
              {analysis.structured?.indicators?.length > 0 && (
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="mb-3 font-semibold text-lg">Key Signs Found</h3>
                  <ul className="space-y-2">
                    {analysis.structured.indicators.map((indicator: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base">
                        <IconCheck className="mt-0.5 shrink-0 text-green-600" size={18} />
                        <span>{indicator}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* What To Do */}
              {analysis.structured?.recommendations?.length > 0 && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
                  <h3 className="mb-3 font-semibold text-lg text-blue-900">What To Do</h3>
                  <ul className="space-y-3">
                    {analysis.structured.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 text-base text-blue-800">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-200 text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <IconAlertCircle className="mt-0.5 shrink-0 text-yellow-600" size={20} />
                  <div className="text-sm text-yellow-800">
                    <p className="mb-1 font-semibold">Important Note</p>
                    <p>
                      This AI analysis is just guidance. Always see a real doctor for proper diagnosis and treatment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Analysis Text */}
              <details className="rounded-xl border bg-muted/30 p-4">
                <summary className="cursor-pointer font-semibold text-sm">
                  View Full AI Response
                </summary>
                <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
                  {analysis.analysis}
                </div>
              </details>

              {/* Action Buttons */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={handleConsultSpecialist}
                  disabled={consultingSpecialist}
                  className="w-full bg-gradient-to-r from-primary to-blue-600"
                  size="lg"
                >
                  {consultingSpecialist ? (
                    <>
                      <IconLoader2 className="mr-2 animate-spin" size={20} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      {getSpecialistButtonText()}
                      <IconArrowRight className="ml-2" size={20} />
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAnalysis(null);
                    setSelectedImage(null);
                    setImagePreview('');
                    setAdditionalContext('');
                  }}
                  className="w-full"
                  size="lg"
                >
                  Analyze Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
