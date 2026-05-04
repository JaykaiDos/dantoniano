'use client';

import { useState, useEffect } from 'react';
import { useFirebasePush } from '@/hooks/useFirebasePush';

export function FirebaseSubscribeButton() {
  const { 
    loading, 
    error, 
    subscribeToTopic, 
    unsubscribeFromTopic,
    unsubscribeFromAll,
    isSubscribedTo,
    permissionGranted
  } = useFirebasePush();

  const [subscribed, setSubscribed] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si está suscrito al cargar
    const checkStatus = async () => {
      try {
        const isGlobal = isSubscribedTo('global');
        setSubscribed(isGlobal);
        setLocalError(null);
      } catch (err) {
        setSubscribed(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkStatus();
  }, [isSubscribedTo]);

  const handleToggle = async () => {
    setLocalError(null);
    if (subscribed) {
      const success = await unsubscribeFromTopic('global');
      if (success) setSubscribed(false);
    } else {
      const success = await subscribeToTopic('global');
      if (success) setSubscribed(true);
    }
  };

  const handleUnsubscribeAll = async () => {
    setLocalError(null);
    const success = await unsubscribeFromAll();
    if (success) setSubscribed(false);
  };

  // Mostrar estado de carga
  if (isChecking || loading) {
    return (
      <button 
        disabled 
        className="vh-btn vh-btn--ghost" 
        style={{ cursor: 'not-allowed' }}
      >
        ⏳ Cargando...
      </button>
    );
  }

  // Mostrar error si existe
  if (error || localError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <button
          className="vh-btn vh-btn--danger"
          onClick={handleToggle}
          style={{ cursor: 'pointer' }}
        >
          ⚠️ Error - Reintentar
        </button>
        {(error || localError) && (
          <small style={{ color: 'var(--vh-error)', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'center' }}>
            {error || localError}
          </small>
        )}
      </div>
    );
  }

  // Botón cuando está suscrito
  if (subscribed) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          className="vh-btn vh-btn--success"
          disabled
          style={{ cursor: 'default' }}
        >
          🔔 Notificaciones activadas
        </button>
        <button
          className="vh-btn vh-btn--ghost"
          onClick={handleUnsubscribeAll}
          style={{ fontSize: '0.75rem', cursor: 'pointer' }}
          title="Desuscribirse de todo"
        >
          🔕 Desuscribir todo
        </button>
      </div>
    );
  }

  // Botón cuando no está suscrito
  return (
    <button
      onClick={handleToggle}
      className="vh-btn vh-btn--primary"
      style={{ cursor: 'pointer' }}
      title={!permissionGranted ? "Haz clic para activar notificaciones" : ""}
    >
      🔔 Activar notificaciones
    </button>
  );
}
