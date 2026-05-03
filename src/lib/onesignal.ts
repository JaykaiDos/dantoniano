// OneSignal helper functions for SDK v16
declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

export const subscribeToGlobal = async () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.addTag({ 'interes': 'todos' });
  });
};

export const subscribeToAnime = async (animeSlug: string) => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.addTag({ 'seguimiento_anime': animeSlug });
  });
};

export const unsubscribeFromAnime = async () => {
  if (typeof window === 'undefined') return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.removeTag('seguimiento_anime');
  });
};

export const getUserTags = async () => {
  if (typeof window === 'undefined') return {};
  
  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        // OneSignal v16: getTags returns a promise
        const tags = await OneSignal.getTags();
        resolve(tags || {});
      } catch (error) {
        console.error('Error getting tags:', error);
        resolve({});
      }
    });
  });
};
