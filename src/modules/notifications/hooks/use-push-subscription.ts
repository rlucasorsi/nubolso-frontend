'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushPermission,
  getCurrentPushSubscription,
  registerServiceWorker,
} from '@/lib/push';

export type PushStatus = 'loading' | 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed';
export type PushUnsupportedReason =
  | 'no_service_worker'
  | 'no_push_manager'
  | 'ios_pwa_required'
  | null;

function detectUnsupportedReason(): PushUnsupportedReason {
  if (!('serviceWorker' in navigator)) return 'no_service_worker';
  if (!('PushManager' in window)) {
    // iOS Safari supports SW but not PushManager unless installed as PWA
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    if (isIOS) return 'ios_pwa_required';
    return 'no_push_manager';
  }
  return null;
}

export function usePushSubscription() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [unsupportedReason, setUnsupportedReason] = useState<PushUnsupportedReason>(null);

  useEffect(() => {
    const reason = detectUnsupportedReason();
    if (reason) {
      setUnsupportedReason(reason);
      setStatus('unsupported');
      return;
    }
    const permission = getPushPermission();
    if (permission === 'denied') {
      setStatus('denied');
      return;
    }
    registerServiceWorker()
      .then(() => getCurrentPushSubscription())
      .then((sub) => setStatus(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setStatus('unsubscribed'));
  }, []);

  const subscribe = useCallback(async () => {
    setIsProcessing(true);
    try {
      const result = await subscribeToPush();
      if (result === 'subscribed') setStatus('subscribed');
      else if (result === 'denied') setStatus('denied');
      else setStatus('unsupported');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setIsProcessing(true);
    try {
      await unsubscribeFromPush();
      setStatus('unsubscribed');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { status, isProcessing, unsupportedReason, subscribe, unsubscribe };
}
