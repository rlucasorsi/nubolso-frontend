import {
  subscribePushAction,
  unsubscribePushAction,
} from '@/modules/notifications/actions/push-subscription';

const SW_PATH = '/sw.js';

/** Convert a VAPID base64url public key to a Uint8Array for the Push API. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/** Register the service worker (idempotent). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported');
  return navigator.serviceWorker.register(SW_PATH);
}

/** Return the current push permission state: 'granted' | 'denied' | 'default' */
export function getPushPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'default';
  return Notification.permission;
}

/**
 * Subscribe this browser to Web Push notifications.
 * Requests permission if not yet granted, then saves the subscription on the backend.
 * Returns `'subscribed'` | `'denied'` | `'unsupported'`.
 */
export async function subscribeToPush(): Promise<'subscribed' | 'denied' | 'unsupported'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (!vapidKey) throw new Error('[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const reg = await registerServiceWorker();
  const appServerKey = urlBase64ToUint8Array(vapidKey);
  console.log(
    '[push] vapidKey chars:',
    vapidKey.length,
    '| decoded bytes:',
    appServerKey.length,
    '| first byte:',
    appServerKey[0],
  );
  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: appServerKey,
  });

  const json = subscription.toJSON();
  await subscribePushAction({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  });

  return 'subscribed';
}

/**
 * Unsubscribe this browser from Web Push notifications.
 * Removes the subscription from the backend and the browser.
 */
export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const reg = await navigator.serviceWorker.ready;
  const subscription = await reg.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await unsubscribePushAction(endpoint);
}

/** Returns the active push subscription, or null if not subscribed. */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}
