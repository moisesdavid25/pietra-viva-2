import { useEffect } from 'react';
import db from '../db';

// Ruta /google-signup — dispara OAuth inmediatamente sin render intermedio.
// El botón de "Inizia gratis con Google" de leomenu.it apunta aquí.
export default function GoogleSignup() {
  useEffect(() => {
    localStorage.setItem('pending_oauth_register', 'true');
    db.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/register' },
    });
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      background: '#f9fafb',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #e5e7eb',
          borderTopColor: '#008081',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#6b7280', fontSize: 14, fontWeight: 600 }}>
          Connessione con Google…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
