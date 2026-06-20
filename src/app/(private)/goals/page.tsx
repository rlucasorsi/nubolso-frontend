'use client';

import { GoalsView } from '@/components/goals/GoalsView';
import { useEffect } from 'react';

export default function GoalsPage() {
  useEffect(() => {
    document.title = 'Goals — nubolso';
  }, []);

  return <GoalsView />;
}
