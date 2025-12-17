'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PlannerApp from '@/components/PlannerApp';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user has session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          // No session, show registration/login
          // The PlannerApp component handles this
        }
      });
  }, []);

  return <PlannerApp />;
}
