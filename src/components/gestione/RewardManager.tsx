import React, { useState, useRef } from 'react';
import { Gift, Award, Plus, Trash2, Edit2, Image as ImageIcon, AlertTriangle, Lightbulb, Save, X } from 'lucide-react';
import db from '../../db';

interface Reward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  image_url: string;
  cost_value?: number;
}

const TEMPLATES = [
  { label: '€1 (3 Stars)', name: 'Caffè Espresso', points: 3, cost: '1.00' },
  { label: '€6 (18 Stars)', name: 'Snack Omaggio', points: 18, cost: '6.00' },
  { label: '€10 (30 Stars)', name: 'Specialty Drink', points: 30, cost: '10.00' },
  { label: '€20 (60 Stars)', name: 'Menù Completo', points: 60, cost: '20.00' },
  { label: '€35 (105 Stars)', name: 'Cena per 2', points: 105, cost: '35.00' },
  { label: '€55 (165 Stars)', name: 'Reserve Experience', points: 165, cost: '55.00' },
];

interface Props {
  restaurantId: string;
  rewards: Reward[];
  onRewardsChange: (rewards: Reward[]) => void;
}

export default function RewardManager({ restaurantId, rewards, onRewardsChange }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', points_required: '', description: '', image_url: '', cost_value: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const costExceeds = form.points_required && form.cost_value &&
    parseFloat(form.cost_value) > (parseInt(form.points_required) / 3) * 0.15;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `${restaurantId}/rewards_${Date.now()}_${Math.random().toString(36).substr(2,9)}.${ext}`;
      const { error, data } = await db.storage.from('media').upload(fileName, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: { publicUrl } } = db.storage.from('media').getPublicUrl(data.path);
      setForm(p => ({ ...p, image_url: publicUrl }));
    } catch (err) {
      console.error("[Storage] Errore caricamento", err);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.points_required) return;
    setSaving(true);
    
    const rewardData = {
      restaurant_id: restaurantId,
      name: form.name,
      points_required: parseInt(form.points_required),
      description: form.description,
      image_url: form.image_url,
      cost_value: parseFloat(form.cost_value) || 0,
    };

    if (editingId) {
      const { data, error } = await db.from('rewards')
        .update(rewardData)
        .eq('id', editingId)
        .select()
        .single();
      
      if (!error && data) {
        onRewardsChange(rewards.map(r => r.id === editingId ? (data as Reward) : r).sort((a, b) => a.points_required - b.points_required));
        handleCloseModal();
      }
    } else {
      const { data, error } = await db.from('rewards').insert([rewardData]).select().single();
      if (!error && data) {
        onRewardsChange([...rewards, data as Reward].sort((a, b) => a.points_required - b.points_required));
        handleCloseModal();
      }
    }
    setSaving(false);
  };

  const handleEdit = (reward: Reward) => {
    setForm({
      name: reward.name,
      points_required: reward.points_required.toString(),
      description: reward.description || '',
      image_url: reward.image_url || '',
      cost_value: reward.cost_value?.toString() || (reward.points_required / 3).toFixed(2)
    });
    setEditingId(reward.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ name: '', points_required: '', description: '', image_url: '', cost_value: '' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Eliminare questo premio?')) return;
    await db.from('rewards').delete().eq('id', id);
    onRewardsChange(rewards.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-[#008081]" />
          <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">Premi Attivi</h3>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm({ name: '', points_required: '', description: '', image_url: '', cost_value: '' }); setShowModal(true); }}
          className="flex items-center gap-1.5 bg-[#1A1A1A] dark:bg-gray-100 text-white dark:text-black font-bold px-3 py-2 rounded-xl text-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nuovo
        </button>
      </div>

      {/* Rewards horizontal list */}
      {rewards.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-[#262626] rounded-2xl border border-gray-100 dark:border-gray-800">
          <Award className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm font-medium">Nessun premio ancora.</p>
          <p className="text-xs text-gray-400 mt-1">Aggiungi traguardi per motivare i tuoi clienti.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map(reward => (
            <div key={reward.id} className="flex items-center gap-3 bg-white dark:bg-[#262626] rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm">
              {reward.image_url ? (
                <img src={reward.image_url} alt={reward.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-grow min-w-0">
                <p className="font-bold text-sm text-[#1A1A1A] dark:text-white truncate">{reward.name}</p>
                <p className="text-xs text-[#008081] font-bold">⭐ {reward.points_required} Stars · Spesa: €{(reward.points_required / 3).toFixed(0)}</p>
                {reward.description && <p className="text-xs text-gray-400 truncate mt-0.5">{reward.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleEdit(reward)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-[#008081] hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(reward.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Reward Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#262626] rounded-3xl w-full max-w-md flex flex-col border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>
            {/* Modal Header */}
            <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-[#FBFBFB] dark:bg-[#1A1A1A] rounded-t-3xl">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#008081]" /> {editingId ? 'Modifica Premio' : 'Nuovo Premio'}
              </h3>
              <button onClick={handleCloseModal} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Quick Templates */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Templati Rapidi
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map(tpl => (
                    <button
                      key={tpl.label}
                      onClick={() => setForm({ ...form, name: tpl.name, points_required: tpl.points.toString(), cost_value: tpl.cost })}
                      className="text-[10px] font-bold bg-[#008081]/10 text-[#008081] border border-[#008081]/20 px-2 py-1 rounded-full hover:bg-[#008081] hover:text-white transition-colors"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Premio *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 outline-none text-sm"
                  placeholder="es. Pizza Margherita Omaggio"
                />
              </div>

              {/* Points */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stelle Richieste *</label>
                <input
                  type="number"
                  value={form.points_required}
                  onChange={e => setForm({ ...form, points_required: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 outline-none text-sm"
                  placeholder="es. 50"
                />
                {form.points_required && (
                  <p className="text-xs text-[#008081] font-bold mt-1">
                    💡 Spesa necessaria: €{(parseInt(form.points_required) / 3).toFixed(2)}
                  </p>
                )}
              </div>

              {/* COGS / Cost */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Reale Premio (COGS €)</label>
                <input
                  type="number"
                  value={form.cost_value}
                  onChange={e => setForm({ ...form, cost_value: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 outline-none text-sm"
                  placeholder="es. 1.50"
                  step="0.10"
                />
                {costExceeds && (
                  <div className="flex items-start gap-1.5 mt-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/30">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>⚠️ Margine basso (Ritorno &gt; 15%). Aumenta le stelle richieste.</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrizione</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl dark:bg-[#1A1A1A] dark:border-gray-700 outline-none resize-none h-16 text-sm"
                  placeholder="Dettagli sul premio..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Immagine</label>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-3 text-gray-500 hover:border-[#008081] transition-colors"
                >
                  {form.image_url ? (
                    <img src={form.image_url} alt="Preview" className="h-12 w-12 object-cover rounded-lg" />
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Carica Foto</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-[#1A1A1A] flex gap-3 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name || !form.points_required || saving}
                className="flex-1 flex items-center justify-center gap-2 bg-[#008081] text-white py-2.5 rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors text-sm"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


