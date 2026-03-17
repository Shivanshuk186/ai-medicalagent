'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';
import {
  IconAlertTriangle,
  IconPlus,
  IconEye,
  IconStethoscope,
  IconClipboardCheck,
  IconArrowRight,
} from '@tabler/icons-react';

export default function EmergencyLandingPage() {
  const sections = [
    {
      id: 'patient',
      title: 'Patient Registration',
      description: 'Register a new emergency patient with symptoms and AI-assisted priority assessment',
      icon: IconPlus,
      color: 'from-red-600 to-red-700',
      href: '/emergency/register',
      role: 'Receptionist',
    },
    {
      id: 'queue',
      title: 'Queue Visualization',
      description: 'View all emergency patients organized by severity level with real-time updates',
      icon: IconEye,
      color: 'from-amber-600 to-amber-700',
      href: '/emergency',
      role: 'Doctor/Staff',
    },
    {
      id: 'approval',
      title: 'Case Approval',
      description: 'Review AI priority assessment and approve cases to enter the emergency queue',
      icon: IconClipboardCheck,
      color: 'from-blue-600 to-blue-700',
      href: '/emergency/receptionist',
      role: 'Receptionist',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12'>
      <div className='mx-auto max-w-6xl px-4'>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-16 text-center'
        >
          <div className='mb-6 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600'>
            <IconAlertTriangle size={16} />
            Emergency Management System
          </div>
          <h1 className='text-5xl font-bold text-white mb-4'>
            AI-Powered Emergency Queue
          </h1>
          <p className='text-xl text-slate-400 max-w-2xl mx-auto'>
            Smart triage system with receptionist approval and priority-based patient queue ordering
          </p>
        </motion.div>

        {/* Three Sections Grid */}
        <div className='grid md:grid-cols-3 gap-6 mb-16'>
          {sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className='group relative'
              >
                <Link href={section.href}>
                  <div className='h-full rounded-2xl border border-slate-700 bg-slate-900/50 p-8 backdrop-blur transition-all hover:border-slate-500 hover:bg-slate-800/50 cursor-pointer'>
                    {/* Icon */}
                    <div className={`mb-6 inline-flex p-3 rounded-xl bg-gradient-to-br ${section.color} text-white`}>
                      <Icon size={24} />
                    </div>

                    {/* Role Badge */}
                    <div className='mb-4 inline-block rounded-full bg-slate-700/50 px-3 py-1 text-xs font-semibold text-slate-300'>
                      {section.role}
                    </div>

                    {/* Content */}
                    <h2 className='text-2xl font-bold text-white mb-3'>{section.title}</h2>
                    <p className='text-slate-400 mb-6'>{section.description}</p>

                    {/* Link */}
                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-300 group-hover:text-white transition-colors'>
                      Open
                      <IconArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Workflow Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='rounded-2xl border border-slate-700 bg-slate-900/50 p-8 backdrop-blur mb-16'
        >
          <h2 className='text-2xl font-bold text-white mb-8'>Emergency Workflow</h2>
          
          <div className='space-y-4'>
            <div className='flex gap-4 items-start'>
              <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-600 text-white font-bold'>1</div>
              <div>
                <h3 className='font-semibold text-white mb-1'>Patient Registration</h3>
                <p className='text-slate-400'>Receptionist registers emergency patient with symptoms, description, and optional image upload</p>
              </div>
            </div>
            
            <div className='flex gap-4 items-start'>
              <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-amber-600 text-white font-bold'>2</div>
              <div>
                <h3 className='font-semibold text-white mb-1'>AI Triage Analysis</h3>
                <p className='text-slate-400'>System analyzes symptoms and assigns priority (Critical/Serious/Normal) with confidence score</p>
              </div>
            </div>

            <div className='flex gap-4 items-start'>
              <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold'>3</div>
              <div>
                <h3 className='font-semibold text-white mb-1'>Receptionist Approval</h3>
                <p className='text-slate-400'>Receptionist reviews AI assessment and can approve or adjust priority before queue entry</p>
              </div>
            </div>

            <div className='flex gap-4 items-start'>
              <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-purple-600 text-white font-bold'>4</div>
              <div>
                <h3 className='font-semibold text-white mb-1'>Priority Queue Ordering</h3>
                <p className='text-slate-400'>Approved patients enter queue ordered by priority, with critical cases treated first</p>
              </div>
            </div>

            <div className='flex gap-4 items-start'>
              <div className='flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-green-600 text-white font-bold'>5</div>
              <div>
                <h3 className='font-semibold text-white mb-1'>Doctor Dashboard</h3>
                <p className='text-slate-400'>Doctor sees next patient, estimated wait times, and patient details for treatment</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='mb-16'
        >
          <h2 className='text-2xl font-bold text-white mb-6'>Key Features</h2>
          
          <div className='grid md:grid-cols-2 gap-4'>
            {[
              { title: 'AI-Powered Triage', desc: 'Intelligent symptom analysis for accurate priority assignment' },
              { title: 'Receptionist Control', desc: 'Human verification ensures AI accuracy and prevents false emergencies' },
              { title: 'Real-Time Queue', desc: 'Live updates as patients are processed and new emergencies arrive' },
              { title: 'Waiting Time Estimation', desc: 'Accurate ETA based on queue position and consultation duration' },
              { title: 'Patient Images', desc: 'Upload and analyze injury photos for better triage decisions' },
              { title: 'Doctor Dashboard', desc: 'Streamlined interface showing next patient and queue status' },
              { title: 'Priority Override', desc: 'Receptionist can adjust priorities based on additional information' },
              { title: 'Queue Visualization', desc: 'Organized by severity with critical cases highlighted' },
            ].map((feature, idx) => (
              <div key={idx} className='rounded-lg border border-slate-700 bg-slate-800/30 p-4'>
                <h3 className='font-semibold text-white mb-2'>{feature.title}</h3>
                <p className='text-sm text-slate-400'>{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Access Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='flex gap-4 justify-center'
        >
          <Button asChild className='bg-red-600 hover:bg-red-700 text-lg px-8 py-6'>
            <Link href='/emergency/register'>
              <IconPlus className='mr-2' />
              Register Patient
            </Link>
          </Button>
          <Button asChild variant='outline' className='text-lg px-8 py-6 border-slate-600 hover:bg-slate-800'>
            <Link href='/emergency/receptionist'>
              <IconClipboardCheck className='mr-2' />
              Review Cases
            </Link>
          </Button>
          <Button asChild variant='outline' className='text-lg px-8 py-6 border-slate-600 hover:bg-slate-800'>
            <Link href='/emergency'>
              <IconEye className='mr-2' />
              View Queue
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
