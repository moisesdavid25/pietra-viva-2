import { useState } from 'react';
import db from '../db';
import type { MenuCombo } from './useGestioneData';

interface UseMenuComboReturn {
  editingMenu: MenuCombo | null;
  setEditingMenu: (menu: MenuCombo | null) => void;
  handleSaveMenu: () => Promise<void>;
  handleDeleteMenu: (id: number) => Promise<void>;
}

export function useMenuCombo(onSuccess: () => void): UseMenuComboReturn {
  const [editingMenu, setEditingMenu] = useState<MenuCombo | null>(null);

  const handleSaveMenu = async () => {
    if (!editingMenu) return;
    await db.from('menus').update({
      type: editingMenu.type,
      price: editingMenu.price,
      entree: editingMenu.entree,
      primo: editingMenu.primo,
      secondo: editingMenu.secondo,
      contorno: editingMenu.contorno,
      desert: editingMenu.desert,
      bevande: editingMenu.bevande,
    }).eq('id', editingMenu.id);
    setEditingMenu(null);
    onSuccess();
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo menu?')) return;
    await db.from('menus').delete().eq('id', id);
    onSuccess();
  };

  return {
    editingMenu,
    setEditingMenu,
    handleSaveMenu,
    handleDeleteMenu,
  };
}
