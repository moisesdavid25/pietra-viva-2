import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../db';
import type { User } from '@supabase/supabase-js';

export function useFidelityAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: authData } = await db.auth.getUser();
        if (!authData.user) {
          navigate('/login');
          return;
        }
        setUser(authData.user);
        setFirstName(authData.user.user_metadata?.first_name || '');
        setLastName(authData.user.user_metadata?.last_name || '');
      } catch (err) {
        console.error('Passport Auth error:', err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await db.auth.signOut();
    window.location.href = '/';
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await db.auth.updateUser({
        data: { first_name: firstName, last_name: lastName }
      });
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveFullProfile = async (extra: {
    telefono: string;
    dataNascita: string;
    sesso: string;
  }) => {
    setIsSavingProfile(true);
    try {
      const { data: authData } = await db.auth.getUser();
      const currentUser = authData.user;

      // 1. Save name to Supabase Auth metadata
      await db.auth.updateUser({
        data: { first_name: firstName, last_name: lastName }
      });

      if (!currentUser) return;

      const displayName = `${firstName} ${lastName}`.trim() || firstName || currentUser.email || '';

      // 2. Update ALL customer records for this user (one per restaurant)
      const { data: rows } = await db
        .from('customers')
        .select('id, preferences')
        .eq('auth_user_id', currentUser.id);

      if (rows && rows.length > 0) {
        for (const row of rows) {
          const existing = (row.preferences as Record<string, unknown>) || {};
          await db.from('customers').update({
            name: displayName,
            whatsapp: extra.telefono || null,
            preferences: {
              ...existing,
              email: currentUser.email ?? null,
              data_nascita: extra.dataNascita || null,
              sesso: extra.sesso || null,
            },
          }).eq('id', row.id);
        }
      }
    } catch (err) {
      console.error('Error saving full profile:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteCustomerAccount = async () => {
    const firstConfirm = window.confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile e perderai tutti i tuoi punti.');
    if (!firstConfirm) return;
    const secondConfirm = window.confirm('CONFERMA FINALE: Il tuo profilo cliente e le tue fidelity verranno rimossi permanentemente. Procedere?');
    if (!secondConfirm) return;
    
    try {
      if (user) await db.from('customers').delete().eq('auth_user_id', user.id);
      await db.auth.signOut();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Errore durante l\'eliminazione dell\'account.');
    }
  };

  return {
    user,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    isSavingProfile,
    isAuthLoading,
    handleLogout,
    handleSaveProfile,
    handleSaveFullProfile,
    handleDeleteCustomerAccount
  };
}
