import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import db from '../db';
import type { User } from '@supabase/supabase-js';

export function usePassportAuth() {
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
    navigate('/');
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
    handleDeleteCustomerAccount
  };
}
