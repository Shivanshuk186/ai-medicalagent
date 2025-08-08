'use client';
import Vapi from '@vapi-ai/web';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { doctorAgent } from '../../_components/DoctorAgentCard';
import { Circle, Loader, PhoneCall, PhoneOff } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type sessionDetail ={
  id: number,
  notes: string,
  sessionId: string,
  report: JSON,
  selectedDoctor: doctorAgent,
  createdOn: string,
}

export type messages={
  role:string,
  text:string
}

function MedicalVoiceAgent() {
  const { sessionId } = useParams();
  const [sessionDetail, setSessionDetail] = useState<sessionDetail>();
  const [callStarted,setCallStarted]=useState(false);
  const [vapiInstance,setVapiInstance]=useState<any>(); 
  const [currentRole,setCurrentRole]=useState<string | null>();
  const [liveTranscript,setLiveTranscript]=useState<string>();
  const [messages,setMessages]=useState<messages[]>([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null); // ✅ using ref now
  const router = useRouter();

  useEffect(()=>{
    sessionId && GetSessionDetails();
  },[sessionId]);

  useEffect(() => {
    if (!vapiInstance) return;

    const handleSpeechStart = () => {
      setCurrentRole('Assistant');
    };

    const handleSpeechEnd = () => {
      setCurrentRole('User');
    };

    const handleTranscript = (message: any) => {
      if (message.type === 'transcript') {
        const { role, transcriptType, transcript } = message;

        if (transcriptType === 'partial') {
          setLiveTranscript(transcript);
          setCurrentRole(role);
        } else if (transcriptType === 'final') {
          setMessages((prev) => [...prev, { role, text: transcript }]);
          setLiveTranscript("");
          setCurrentRole(null);
        }
      }
    };

    if (typeof vapiInstance.on === 'function') {
      vapiInstance.on('speech-start', handleSpeechStart);
      vapiInstance.on('speech-end', handleSpeechEnd);
      vapiInstance.on('message', handleTranscript);
    }

    return () => {
      if (typeof vapiInstance.off === 'function') {
        vapiInstance.off('speech-start', handleSpeechStart);
        vapiInstance.off('speech-end', handleSpeechEnd);
        vapiInstance.off('message', handleTranscript);
      }
    };
  }, [vapiInstance]);

  const GetSessionDetails = async () => {
    const result = await axios.get('/api/session-chat?sessionId=' + sessionId);
    setSessionDetail(result.data);
  }

  const StartCall = () => {
    const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY!);
    setVapiInstance(vapi);

    vapi.start(process.env.NEXT_PUBLIC_VAPI_VOICE_ASSISTANT_ID);

    vapi.on('call-start', () => {
      setCallStarted(true);
      setDuration(0);

      // ✅ Clear any existing timer first
      if (timerRef.current) clearInterval(timerRef.current);

      // ✅ Start new timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    });

    vapi.on('call-end', () => {
      setCallStarted(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    });
  };

  const endCall = async () => {
    if (!vapiInstance) return;

    vapiInstance.stop();
    vapiInstance.off('call-start');
    vapiInstance.off('call-end');
    vapiInstance.off('message');
    vapiInstance.off('speech-start');
    vapiInstance.off('speech-end');

    setCallStarted(false);
    setVapiInstance(null);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    toast.success('Your report is generated!');
    router.replace('/dashboard');
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className='p-5 border rounded-3xl bg-secondary'>
      <div className='flex justify-between items-center'>
        <h2 className='p-1 px-2 border rounded-md flex gap-2 items-center'>
          <Circle className={`h-4 w-4 rounded-full ${callStarted?'bg-green-500':'bg-red-500'}`} />
          {callStarted ? 'Connected...' : 'Not Connected'}
        </h2>
        <h2 className='font-bold text-xl text-gray-400'>
          {formatTime(duration)}
        </h2>
      </div>

      {sessionDetail && 
        <div className='flex items-center flex-col mt-10'>
          <Image 
            src={sessionDetail?.selectedDoctor?.image} 
            alt={sessionDetail?.selectedDoctor?.specialist ?? ''} 
            width={120} height={120} 
            className='h-[100px] w-[100px] object-cover rounded-full'
          />
          <h2 className='mt-2 text-lg'>{sessionDetail?.selectedDoctor?.specialist}</h2>
          <p className='text-sm text-gray-400'>Ai Medical Voice Agent</p>

          <div className='mt-12 overflow-y-auto flex flex-col items-center px-10 md:px-28 lg:px-52 xl:px-72'>
            {messages?.slice(-4).map((msg, index) => (
              <h2 className='text-gray-400 p-2' key={index}>
                {msg.role}: {msg.text}
              </h2>
            ))}    
            {liveTranscript && (
              <h2 className='text-lg'>{currentRole} : {liveTranscript}</h2>
            )}
          </div>

          {!callStarted ? 
            <Button className='mt-20' onClick={StartCall} disabled={loading}> 
              {loading ? <Loader className='animate-spin'/> : <PhoneCall />}  Start Call
            </Button>
          :
            <Button variant='destructive' onClick={endCall} disabled={loading}>
              {loading ? <Loader className='animate-spin'/> : <PhoneOff />} Disconnect
            </Button>
          }
        </div>
      }
    </div>
  )
}  

export default MedicalVoiceAgent;
