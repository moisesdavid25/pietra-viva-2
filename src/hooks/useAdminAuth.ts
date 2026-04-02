import { useState, useEffect } from 'react';
import db from '../db';

interface AdminAuthState {
  isAdmin: boolean | null; // null = loading
  userId: string | null;
  userEmail: string | null;
}

export function useAdminAuth(): AdminAuthState {
  const [state, setState] = useState<AdminAuthState>({
    isAdmin: null,
    userId: null,
    userEmail: null,
  });

  useEffect(() => {
    db.auth.getUser().then(({ data }) => {
      if (!data.user) {
        setState({ isAdmin: false, userId: null, userEmail: null });
        return;
      }
      const { id, email } = data.user;
      db.from('user_roles')
        .select('role')
        .eq('user_id', id)
        .maybeSingle()
        .then(({ data: roleData }) => {
          setState({
            isAdmin: roleData?.role === 'admin',
            userId: id,
            userEmail: email ?? null,
          });
        });
    });
  }, []);

  return state;
}
