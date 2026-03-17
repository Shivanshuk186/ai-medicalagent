'use client';

import React, { useEffect, useState } from 'react';
import { IconClock } from '@tabler/icons-react';

type CountdownTimerProps = {
  startTime: string; // ISO datetime when patient started being served
  estimatedDuration: number; // minutes
  onTimeUp?: () => void;
};

export default function CountdownTimer({
  startTime,
  estimatedDuration,
  onTimeUp,
}: CountdownTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState(estimatedDuration * 60); // Convert to seconds

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const start = new Date(startTime).getTime();
      const elapsedMs = now - start;
      const elapsedSecs = Math.floor(elapsedMs / 1000);

      setElapsed(elapsedSecs);

      const estimatedSecs = estimatedDuration * 60;
      const remainingSecs = Math.max(0, estimatedSecs - elapsedSecs);

      setRemaining(remainingSecs);

      if (remainingSecs === 0 && onTimeUp) {
        onTimeUp();
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [startTime, estimatedDuration, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalSecs = estimatedDuration * 60;
  const progressPercent = (elapsed / totalSecs) * 100;

  // Color based on progress
  const getProgressColor = () => {
    if (progressPercent < 50) return 'bg-green-500';
    if (progressPercent < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <IconClock className='h-4 w-4 text-slate-400' />
          <p className='text-sm font-medium text-slate-300'>Time Elapsed</p>
        </div>
        <p className='font-mono text-lg font-bold text-white'>{formatTime(elapsed)}</p>
      </div>

      <div className='space-y-1'>
        <div className='h-2 rounded-full bg-slate-700 overflow-hidden'>
          <div
            className={`h-full transition-all ${getProgressColor()}`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-xs text-slate-400'>Est. Remaining</p>
        <p className={`font-mono font-bold ${remaining < 300 ? 'text-red-400' : 'text-emerald-400'}`}>
          {formatTime(remaining)}
        </p>
      </div>

      <div className='text-xs text-slate-500 pt-1'>
        Estimated total: {estimatedDuration} min
      </div>
    </div>
  );
}
