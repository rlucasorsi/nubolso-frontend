'use client';

import { GoalsView } from '@/components/goals/GoalsView';
import { useEffect } from 'react';

export default function MetasPage() {
  useEffect(() => {
    document.title = 'Metas e Objetivos — Fluxo de Caixa';
  }, []);

  return <GoalsView />;
}
