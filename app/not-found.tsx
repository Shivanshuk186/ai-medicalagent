import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900'>
      <div className='text-center space-y-6'>
        <h1 className='text-6xl font-bold text-white'>404</h1>
        <p className='text-xl text-slate-400'>Page not found</p>
        <Link href='/'>
          <Button className='bg-red-600 hover:bg-red-700'>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
