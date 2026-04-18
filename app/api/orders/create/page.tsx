"use client";

import { useEffect } from 'react';

export default function PaymentClosePage() {
  useEffect(() => {
    // 1. Enviar mensaje a la ventana principal para que ella misma nos cierre
    if (window.opener) {
      window.opener.postMessage('payment_closed', '*');
    }

    // Intenta cerrar la ventana actual.
    setTimeout(() => {
      window.close();
    }, 300);
  }, []);

  const handleManualClose = () => {
    if (window.opener) {
      window.opener.postMessage('payment_closed', '*');
    }
    window.close();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#0a0a0a',
      color: '#e5e5e5'
    }}>
      <h1 style={{fontSize: '2rem', fontWeight: 'bold'}}>Proceso de pago finalizado</h1>
      <p style={{marginTop: '1rem'}}>Esta ventana debería cerrarse automáticamente.</p>
      <p style={{marginTop: '0.5rem', fontSize: '0.9rem', color: '#a3a3a3'}}>Si no es así, haz clic en el botón de abajo.</p>
      <button 
        onClick={handleManualClose}
        style={{ marginTop: '2rem', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Cerrar Pestaña
      </button>
    </div>
  );
}