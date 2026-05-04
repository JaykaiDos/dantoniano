'use client';

import { useState, useEffect } from 'react';
import { useFirebasePush } from '@/hooks/useFirebasePush';

interface Props {
  animeSlug: string;
  animeTitle: string;
}

export function FirebaseAnimeSubscribeButton({ animeSlug, animeTitle }: Props) {
  const { 
    loading, 
    error, 
    subscribeToTopic, 
    unsubscribeFromTopic,
    isSubscribedTo 
  } = useFirebasePush();

  const [subscribed, setSubscribed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const topic: `anime:${string}` = `anime:${animeSlug}`;

  useEffect(() => {
    // Verificar si está suscrito al cargar
    const checkStatus = async () => {
      try {
        const isSubscribed = isSubscribedTo(topic);
        setSubscribed(isSubscribed);
      } catch {
        setSubscribed(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [animeSlug, topic, isSubscribedTo]);

  const handleToggle = async () => {
    if (subscribed) {
      const success = await unsubscribeFromTopic(topic);
      if (success) setSubscribed(false);
    } else {
      const success = await subscribeToTopic(topic);
      if (success) setSubscribed(true);
    }
  };

  if (isChecking || loading) {
    return (
      <button 
        disabled 
        className="vh-btn vh-btn--ghost" 
        style={{ cursor: 'not-allowed', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
      >
        ⏳
      </button>
    );
  }

  if (error) {
    return (
      <button
        className="vh-btn vh-btn--ghost"
        onClick={handleToggle}
        style={{ 
          fontSize: '0.75rem', 
          padding: '0.2rem 0.6rem',
          border: '1px solid currentColor',
          borderRadius: 'var(--vh-radius-full)',
          cursor: 'pointer',
          color: 'var(--vh-error)'
        }}
      >
        ⚠️ Reintentar
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
      title={subscribed ? 'Dejar de seguir este anime' : 'Seguir este anime'}
    >
      {subscribed ? `🔕 Dejaste de seguir ${animeTitle}` : `🔔 Seguir ${animeTitle}`}
    </button>
  );
}
