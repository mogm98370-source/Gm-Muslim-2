import React from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';

interface PointModalProps {
  user: any;
  onClose: () => void;
  onSubmit: (points: number, reason: string) => Promise<void>;
}

export const PointModal = ({ user, onClose, onSubmit }: PointModalProps) => {
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number(points);
    if (isNaN(p) || p === 0) return;
    setLoading(true);
    await onSubmit(p, reason);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#121212] border border-[#D4AF37]/30 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-[#D4AF37]">تعديل نقاط المستخدم</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20}/></button>
        </div>
        
        <div className="mb-6 bg-[#1A1A1A] p-4 rounded-xl border border-white/5">
          <p className="text-sm text-white/60 mb-1">المستخدم: <span className="text-white font-bold">{user.displayName || 'بدون اسم'}</span></p>
          <p className="text-sm text-white/60">النقاط الحالية: <span className="text-[#D4AF37] font-bold">{user.gmPoints || 0}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">المبلغ (نقاط)</label>
            <input 
              type="number" 
              value={points} 
              onChange={e => setPoints(e.target.value)} 
              placeholder="مثال: 100 للإضافة، -50 للخصم"
              className="w-full bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-3 outline-none focus:border-[#D4AF37]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">السبب (اختياري)</label>
            <input 
              type="text" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="مثال: هدية، تعويض، ..."
              className="w-full bg-[#1A1A1A] border border-white/10 text-white rounded-lg px-4 py-3 outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl py-3 transition-colors">إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#D4AF37] hover:bg-[#8E6F2E] text-black font-bold rounded-xl py-3 transition-colors disabled:opacity-50">
              {loading ? 'جاري التنفيذ...' : 'تأكيد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
