import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import type { Student, Course, StudentAttendanceSummary } from '../types';

interface StudentListProps {
  course: Course;
  students: Student[];
  summaries: StudentAttendanceSummary[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => Promise<void>;
  onBulkAddStudents: (rawText: string) => Promise<number>;
  onDeleteStudent: (studentId: string) => Promise<void>;
}

export const StudentList: React.FC<StudentListProps> = ({
  course,
  students,
  summaries,
  onAddStudent,
  onBulkAddStudents,
  onDeleteStudent,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');

  // Single student form
  const [studentCode, setStudentCode] = useState('');
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk form
  const [bulkText, setBulkText] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  const summaryMap = new Map<string, StudentAttendanceSummary>();
  summaries.forEach((s) => summaryMap.set(s.student.id, s));

  const filteredStudents = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.studentCode.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      (s.nickname && s.nickname.toLowerCase().includes(q))
    );
  });

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim() || !name.trim()) return;

    try {
      setIsSubmitting(true);
      await onAddStudent({
        studentCode: studentCode.trim(),
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        note: note.trim() || undefined,
      });

      setStudentCode('');
      setName('');
      setNickname('');
      setPhone('');
      setNote('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเพิ่มนักศึกษาได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkText.trim()) return;
    try {
      setIsSubmitting(true);
      const count = await onBulkAddStudents(bulkText);
      setBulkSuccessMsg(`เพิ่มนักศึกษาสำเร็จ ${count} คน`);
      setBulkText('');
      setTimeout(() => {
        setBulkSuccessMsg(null);
        setShowBulkModal(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการนำเข้า กรุณาตรวจสอบรูปแบบข้อความ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-16 space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
              {course.code}
            </span>
            <span className="text-xs text-slate-400">กลุ่มเรียน {course.section}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            รายชื่อนักศึกษาในชั้นเรียน ({students.length} คน)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            จัดการรหัสนักศึกษา รายชื่อ และข้อมูลติดต่อฉุกเฉิน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>นำเข้าจาก Excel / วางรายชื่อ</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>เพิ่มนักศึกษา</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหารหัสนักศึกษา, ชื่อ, หรือชื่อเล่น..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
            <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-400">ยังไม่มีรายชื่อนักศึกษา หรือไม่พบข้อมูลตามคำค้น</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => {
            const summary = summaryMap.get(student.id);

            return (
              <div
                key={student.id}
                className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-600 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                      {student.studentCode}
                    </span>

                    {summary && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          summary.riskLevel === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : summary.riskLevel === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        เข้าเรียน {summary.attendanceRate}%
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2">
                    {student.name}
                    {student.nickname && (
                      <span className="text-xs text-slate-400 ml-1.5 font-normal">
                        ({student.nickname})
                      </span>
                    )}
                  </h3>

                  {student.note && (
                    <p className="text-xs text-slate-400 italic mt-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                      {student.note}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  {student.phone ? (
                    <a
                      href={`tel:${student.phone}`}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{student.phone}</span>
                    </a>
                  ) : (
                    <span>ไม่มีเบอร์</span>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`คุณต้องการลบรายชื่อ ${student.name} ออกจากวิชานี้หรือไม่?`)) {
                        onDeleteStudent(student.id);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="ลบนักศึกษา"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Single Student */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">เพิ่มนักศึกษาใหม่</h3>
            <form onSubmit={handleAddSingle} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  รหัสนักศึกษา <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="เช่น 65010042"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น นายธนวัฒน์ ศรีสุข"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น โบ๊ท"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">เบอร์ติดต่อ</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08X-XXX-XXXX"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น หัวหน้ากลุ่ม, ติดต่อผ่านไลน์..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Add Students (Copy & Paste from Excel) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-3">
            <h3 className="text-lg font-bold text-white">นำเข้ารายชื่อนักศึกษาแบบชุด</h3>
            <p className="text-xs text-slate-400">
              คัดลอกรายชื่อจาก Excel / Google Sheets หรือระบบทะเบียน แล้ววางลงในช่องด้านล่าง (1 คนต่อ 1 บรรทัด เช่น <code className="text-indigo-300">65010001 นายสมชาย ใจดี</code>)
            </p>

            {bulkSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`65010001 นายกิตติศักดิ์ เจริญผล\n65010002 นางสาวกานต์รวี วงศ์สุวรรณ\n65010003 นายชานนท์ เมธาอนันต์`}
              rows={8}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                รองรับการคั่นด้วยวรรค, แท็บ (Tab), หรือจุลภาค
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={isSubmitting || !bulkText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังนำเข้า...' : 'เริ่มนำเข้า'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
