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
  if (!window.OneSignalDeferred) return;
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.addTag({ 'interes': 'todos' });
    } catch (error) {
      console.error('Error subscribing to global:', error);
    }
  });
};

export const subscribeToAnime = async (animeSlug: string) => {
  if (typeof window === 'undefined') return;
  if (!window.OneSignalDeferred) return;
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.addTag({ 'seguimiento_anime': animeSlug });
    } catch (error) {
      console.error('Error subscribing to anime:', error);
    }
  });
};

export const unsubscribeFromAnime = async () => {
  if (typeof window === 'undefined') return;
  if (!window.OneSignalDeferred) return;
  
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    try {
      await OneSignal.removeTag('seguimiento_anime');
    } catch (error) {
      console.error('Error unsubscribing from anime:', error);
    }
  });
};

export const getUserTags = async () => {
  if (typeof window === 'undefined') return {};
  if (!window.OneSignalDeferred) return {};
  
  return new Promise((resolve) => {
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      try {
        const tags = await OneSignal.getTags();
        resolve(tags || {});
      } catch (error) {
        console.error('Error getting tags:', error);
        resolve({});
      }
    });
  });
};
