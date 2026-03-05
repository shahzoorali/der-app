// Standard Web Push API — no Firebase needed
// Uses VAPID keys for authentication

const API_URL = process.env.NEXT_PUBLIC_NOTIFICATION_API_URL || '';

/**
 * Convert a base64 string to a Uint8Array (for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Request notification permission and register the push subscription with our backend.
 * Returns the subscription if successful, null otherwise.
 */
export async function requestNotificationPermission(): Promise<PushSubscription | null> {
    try {
        if (typeof window === 'undefined') return null;
        if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications are not supported in this browser');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        console.log('Service worker registered:', registration.scope);

        // Subscribe to push with VAPID key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not configured');
            return null;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });

        console.log('Push subscription obtained');

        // Register subscription with our backend
        await registerSubscriptionWithBackend(subscription);

        // Save state to localStorage
        localStorage.setItem('der-notifications-enabled', 'true');

        return subscription;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return null;
    }
}

/**
 * Register push subscription with our AWS backend (API Gateway → Lambda → DynamoDB)
 */
async function registerSubscriptionWithBackend(subscription: PushSubscription) {
    if (!API_URL) {
        console.warn('NEXT_PUBLIC_NOTIFICATION_API_URL not configured');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                platform: 'web',
            }),
        });

        if (!response.ok) {
            throw new Error(`Failed to register subscription: ${response.status}`);
        }

        console.log('Subscription registered with backend successfully');
    } catch (error) {
        console.error('Error registering subscription with backend:', error);
    }
}

/**
 * Check if notifications are enabled
 */
export function isNotificationsEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('der-notifications-enabled') === 'true';
}

/**
 * Check if the browser supports push notifications
 */
export function isNotificationsSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}
