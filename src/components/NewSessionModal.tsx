import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import type { Session } from '../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextWeekNumber: number;
  onCreateSession: (session: Omit<Session, 'id' | 'courseId' | 'createdAt'>) => Promise<void>;
}

export const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  nextWeekNumber,
  onCreateSession,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [weekNumber, setWeekNumber] = useState(nextWeekNumber);
  const [sessionDate, setSessionDate] = useState(today);
  const [title, setTitle] = useState(`สัปดาห์ที่ ${nextWeekNumber}`);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate) return;

    try {
      setLoading(true);
      await onCreateSession({
        weekNumber: Number(weekNumber) || 1,
        sessionDate,
        title: title.trim() || `สัปดาห์ที่ ${weekNumber}`,
        notes: notes.trim(),
        status: 'open',
      });
      onClose();
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถสร้างคาบเรียนได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">เพิ่มคาบเรียน/สัปดาห์ใหม่</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                สัปดาห์ที่ <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                max={24}
                required
                value={weekNumber}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setWeekNumber(val);
                  setTitle(`สัปดาห์ที่ ${val}`);
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                วันที่ <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              หัวข้อการสอน / กิจกรรมประจำคาบ
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น การใช้งาน Array และ List, ทดลองทำโจทย์ Lab 3"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              บันทึกข้อความช่วยจำ (Notes)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="เช่น มีเก็บคะแนนท้ายคาบ 5 คะแนน, สอบถามการบ้านกลุ่ม..."
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'กำลังสร้าง...' : 'สร้างคาบเรียน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
