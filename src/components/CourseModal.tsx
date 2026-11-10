import React, { useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import type { Course } from '../types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCourse: (course: Omit<Course, 'id' | 'createdAt'>) => Promise<void>;
  teacherId: string;
  teacherEmail: string;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onCreateCourse,
  teacherId,
  teacherEmail,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [section, setSection] = useState('01');
  const [semester, setSemester] = useState('2/2567');
  const [totalWeeks, setTotalWeeks] = useState(15);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    try {
      setLoading(true);
      await onCreateCourse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        section: section.trim(),
        semester: semester.trim(),
        teacherId,
        teacherEmail,
        totalWeeks: Number(totalWeeks) || 15,
      });

      setCode('');
      setName('');
      setSection('01');
      onClose();
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถสร้างวิชาได้ กรุณาลองใหม่อีกครั้ง');
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
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">สร้างรายวิชาใหม่</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              รหัสวิชา <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="เช่น IT101 หรือ CPE201"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              ชื่อวิชา <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น การเขียนโปรแกรมคอมพิวเตอร์เบื้องต้น"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">กลุ่มเรียน (Section)</label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="เช่น 01, 201"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">ภาคการศึกษา</label>
              <input
                type="text"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                placeholder="เช่น 2/2567"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">จำนวนสัปดาห์ในภาคเรียน</label>
            <input
              type="number"
              min={1}
              max={24}
              value={totalWeeks}
              onChange={(e) => setTotalWeeks(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              {loading ? 'กำลังบันทึก...' : 'สร้างรายวิชา'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
