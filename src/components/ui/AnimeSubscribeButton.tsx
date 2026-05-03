'use client';

import { useState, useEffect } from 'react';
import { subscribeToAnime, getUserTags, unsubscribeFromAnime } from '@/lib/onesignal';

interface Props {
  animeSlug: string;
  animeTitle: string;
}

export function AnimeSubscribeButton({ animeSlug }: Props) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const tags = await getUserTags();
        setSubscribed((tags as any)?.seguimiento_anime === animeSlug);
      } catch {
        console.error('Error checking OneSignal tags');
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [animeSlug]);

  const handleToggle = async () => {
    if (subscribed) {
      await unsubscribeFromAnime();
      setSubscribed(false);
    } else {
      await subscribeToAnime(animeSlug);
      setSubscribed(true);
    }
  };

  if (loading) {
    return (
      <button disabled className="vh-btn vh-btn--ghost" style={{ cursor: 'not-allowed', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
        ⏳
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={subscribed ? 'vh-btn vh-btn--danger' : 'vh-btn vh-btn--ghost'}
      style={{
        fontSize: '0.75rem',
        padding: '0.2rem 0.6rem',
        border: '1px solid currentColor',
        borderRadius: 'var(--vh-radius-full)',
        cursor: 'pointer',
      }}
    >
      {subscribed ? '🔕 Dejar de seguir' : '🔔 Seguir este anime'}
    </button>
  );
}
