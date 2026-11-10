import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Check,
  X,
  Clock,
  FileText,
  Search,
  Sparkles,
  Calendar,
  Plus,
  AlertTriangle,
  Flame,
  Star,
  CheckCircle2,
  Filter,
  Save,
  MessageSquare,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  Course,
  Student,
  Session,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary
} from '../types';

interface AttendanceSheetProps {
  course: Course;
  students: Student[];
  sessions: Session[];
  activeSession: Session | null;
  onSelectSession: (session: Session) => void;
  onOpenNewSession: () => void;
  onSaveRecords: (records: AttendanceRecord[]) => Promise<void>;
  studentSummaries: StudentAttendanceSummary[];
}

export const AttendanceSheet: React.FC<AttendanceSheetProps> = ({
  course,
  students,
  sessions,
  activeSession,
  onSelectSession,
  onOpenNewSession,
  onSaveRecords,
  studentSummaries,
}) => {
  // Local working state of attendance records: studentId -> record
  const [localRecords, setLocalRecords] = useState<Record<string, AttendanceRecord>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unrecorded' | 'present' | 'absent' | 'leave' | 'late' | 'at_risk'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeNoteStudentId, setActiveNoteStudentId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Map student summaries for fast warning lookup
  const summaryMap = useMemo(() => {
    const map = new Map<string, StudentAttendanceSummary>();
    studentSummaries.forEach((s) => map.set(s.student.id, s));
    return map;
  }, [studentSummaries]);

  // Load active session records into local state
  useEffect(() => {
    if (!activeSession) return;

    // Initialize state with default unrecorded for all students
    const initial: Record<string, AttendanceRecord> = {};
    students.forEach((student) => {
      initial[student.id] = {
        id: student.id,
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.name,
        status: 'unrecorded',
        score: 0,
        activityTags: [],
        note: '',
        updatedAt: new Date().toISOString(),
      };
    });

    setLocalRecords(initial);
  }, [activeSession, students]);

  // Set single student status
  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setLocalRecords((prev) => {
      const current = prev[studentId] || {
        id: studentId,
        studentId,
        studentCode: '',
        studentName: '',
        status: 'unrecorded',
        score: 0,
        updatedAt: '',
      };

      // If marking absent or leave, we can default score to 0
      const score = (status === 'absent' || status === 'leave') ? 0 : current.score;

      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
          score,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Set single student participation score (0 - 3)
  const handleSetScore = (studentId: string, score: number) => {
    setLocalRecords((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      // If giving score > 0, auto-mark as present if unrecorded or absent
      let newStatus = current.status;
      if (score > 0 && (current.status === 'unrecorded' || current.status === 'absent')) {
        newStatus = 'present';
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          score,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Toggle quick tag
  const handleToggleTag = (studentId: string, tag: string, bonusScore: number = 1) => {
    setLocalRecords((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const existingTags = current.activityTags || [];
      const hasTag = existingTags.includes(tag);
      const newTags = hasTag
        ? existingTags.filter((t) => t !== tag)
        : [...existingTags, tag];

      // Auto adjust score if needed
      let newScore = current.score;
      if (!hasTag && newScore < bonusScore) {
        newScore = bonusScore;
      }

      return {
        ...prev,
        [studentId]: {
          ...current,
          activityTags: newTags,
          score: newScore,
          status: current.status === 'unrecorded' ? 'present' : current.status,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  // Save note for student
  const handleSaveNote = (studentId: string) => {
    setLocalRecords((prev) => {
      const current = prev[studentId];
      if (!current) return prev;
      return {
        ...prev,
        [studentId]: {
          ...current,
          note: noteText.trim(),
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setActiveNoteStudentId(null);
    setNoteText('');
  };

  // MARK ALL PRESENT: The killer feature for 1-minute speed!
  const handleMarkAllPresent = () => {
    setLocalRecords((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        // Only update unrecorded students so we don't overwrite already marked absent/leave
        if (updated[id].status === 'unrecorded') {
          updated[id] = {
            ...updated[id],
            status: 'present',
            updatedAt: new Date().toISOString(),
          };
        }
      });
      return updated;
    });
  };

  // Save changes to Firestore
  const handleSaveAll = async () => {
    if (!activeSession) return;
    try {
      setIsSaving(true);
      const recordArray = Object.values(localRecords);
      await onSaveRecords(recordArray);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // If all recorded and no unrecorded, throw celebratory confetti
      const unrecorded = recordArray.filter((r) => r.status === 'unrecorded').length;
      if (unrecorded === 0) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  // Real-time statistics counters
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;
    let unrecorded = 0;
    let totalScore = 0;

    Object.values(localRecords).forEach((r) => {
      if (r.status === 'present') present++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
      else if (r.status === 'late') late++;
      else unrecorded++;

      totalScore += r.score || 0;
    });

    const recordedCount = present + absent + leave + late;
    const avgScore = recordedCount > 0 ? (totalScore / recordedCount).toFixed(1) : '0.0';
    const completionPct = students.length > 0 ? Math.round((recordedCount / students.length) * 100) : 0;

    return {
      present,
      absent,
      leave,
      late,
      unrecorded,
      totalScore,
      avgScore,
      completionPct,
    };
  }, [localRecords, students.length]);

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const rec = localRecords[student.id];
      const summary = summaryMap.get(student.id);

      // Search match
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const matchCode = student.studentCode.toLowerCase().includes(query);
        const matchName = student.name.toLowerCase().includes(query);
        const matchNickname = student.nickname?.toLowerCase().includes(query) || false;
        if (!matchCode && !matchName && !matchNickname) return false;
      }

      // Filter match
      if (statusFilter === 'all') return true;
      if (statusFilter === 'unrecorded') return rec?.status === 'unrecorded';
      if (statusFilter === 'present') return rec?.status === 'present';
      if (statusFilter === 'absent') return rec?.status === 'absent';
      if (statusFilter === 'leave') return rec?.status === 'leave';
      if (statusFilter === 'late') return rec?.status === 'late';
      if (statusFilter === 'at_risk') {
        return (
          summary?.consecutiveAbsences && summary.consecutiveAbsences >= 2 ||
          summary?.riskLevel === 'critical' ||
          summary?.riskLevel === 'warning'
        );
      }

      return true;
    });
  }, [students, localRecords, summaryMap, searchQuery, statusFilter]);

  if (!activeSession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">ยังไม่มีคาบเรียนในวิชานี้</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          เริ่มต้นสร้างคาบเรียนสัปดาห์แรก เพื่อเช็กชื่อและบันทึกคะแนนการมีส่วนร่วม
        </p>
        <button
          onClick={onOpenNewSession}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างคาบเรียนสัปดาห์ที่ 1</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 pb-28 md:pb-12 space-y-4">
      {/* 1. Week & Session Selector Strip */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs">
                สัปดาห์ที่ {activeSession.weekNumber}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {activeSession.sessionDate}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
              {activeSession.title || `การเรียนการสอนสัปดาห์ที่ ${activeSession.weekNumber}`}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewSession}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>เพิ่มคาบใหม่</span>
            </button>

            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Week Quick Switcher */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 shrink-0 font-medium mr-1">เลือกคาบ:</span>
          {sessions.map((sess) => {
            const isSelected = sess.id === activeSession.id;
            return (
              <button
                key={sess.id}
                onClick={() => onSelectSession(sess)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-md'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                สัปดาห์ {sess.weekNumber}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live Speed Bar: Counters & "Mark All Present" Action */}
      <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Counter Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full sm:w-auto">
            <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between gap-2">
              <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> มา
              </span>
              <span className="text-sm font-extrabold text-emerald-400 font-mono">{stats.present}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-between gap-2">
              <span className="text-xs text-rose-300 font-medium flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> ขาด
              </span>
              <span className="text-sm font-extrabold text-rose-400 font-mono">{stats.absent}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center justify-between gap-2">
              <span className="text-xs text-amber-300 font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> ลา
              </span>
              <span className="text-sm font-extrabold text-amber-400 font-mono">{stats.leave}</span>
            </div>

            <div className="px-3 py-2 rounded-xl bg-orange-950/40 border border-orange-800/50 flex items-center justify-between gap-2">
              <span className="text-xs text-orange-300 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> สาย
              </span>
              <span className="text-sm font-extrabold text-orange-400 font-mono">{stats.late}</span>
            </div>

            <div className="col-span-2 sm:col-span-1 px-3 py-2 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between gap-2">
              <span className="text-xs text-indigo-300 font-medium flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> มีส่วนร่วมเฉลี่ย
              </span>
              <span className="text-sm font-extrabold text-indigo-300 font-mono">{stats.avgScore}</span>
            </div>
          </div>

          {/* Quick 1-minute Action: Mark All Present */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-emerald-700/20 cursor-pointer"
              title="ตั้งค่าคนที่ยังไม่ได้เช็กให้เป็น 'มา' ทั้งหมดทันที"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>⚡ ติ๊ก "มาทุกคน" ({stats.unrecorded} คนที่เหลือ)</span>
            </button>
          </div>
        </div>

        {/* Progress Bar of attendance completion */}
        <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-3">
          <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${stats.completionPct}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 font-mono font-medium shrink-0">
            เช็กแล้ว {students.length - stats.unrecorded} / {students.length} คน ({stats.completionPct}%)
          </span>
        </div>
      </div>

      {/* 3. Search and Status Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหารหัสนักศึกษา, ชื่อ, หรือชื่อเล่น..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
              statusFilter === 'all' ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ทั้งหมด ({students.length})
          </button>

          <button
            onClick={() => setStatusFilter('unrecorded')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
              statusFilter === 'unrecorded'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            ยังไม่เช็ก ({stats.unrecorded})
          </button>

          <button
            onClick={() => setStatusFilter('absent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
              statusFilter === 'absent' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-rose-950/40'
            }`}
          >
            ขาด ({stats.absent})
          </button>

          <button
            onClick={() => setStatusFilter('at_risk')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all flex items-center gap-1 ${
              statusFilter === 'at_risk'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>กลุ่มเฝ้าระวัง/เสี่ยง</span>
          </button>
        </div>
      </div>

      {/* 4. Student Attendance List (Cards Designed for Fast Thumb Taps) */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
            <p className="text-sm text-slate-400">ไม่พบนักศึกษาตามเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          filteredStudents.map((student, index) => {
            const record = localRecords[student.id] || {
              id: student.id,
              studentId: student.id,
              studentCode: student.studentCode,
              studentName: student.name,
              status: 'unrecorded',
              score: 0,
              activityTags: [],
              updatedAt: '',
            };
            const summary = summaryMap.get(student.id);
            const isAbsentStreak = summary && (summary.consecutiveAbsences >= 2 || summary.maxConsecutiveAbsences >= 2);
            const isCriticalRisk = summary && summary.riskLevel === 'critical';
            const isWarningRisk = summary && summary.riskLevel === 'warning';

            return (
              <div
                key={student.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  record.status === 'present'
                    ? 'bg-slate-800/70 border-emerald-900/50'
                    : record.status === 'absent'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : record.status === 'leave'
                    ? 'bg-amber-950/20 border-amber-800/60'
                    : record.status === 'late'
                    ? 'bg-orange-950/20 border-orange-800/60'
                    : 'bg-slate-800/50 border-slate-700/60'
                }`}
              >
                {/* Student header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/50">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs sm:text-sm font-bold text-indigo-300">
                          {student.studentCode}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-white truncate">
                          {student.name}
                        </h4>
                        {student.nickname && (
                          <span className="text-xs text-slate-400">({student.nickname})</span>
                        )}
                      </div>

                      {/* Cumulative risk & streak badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {summary && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              summary.riskLevel === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : summary.riskLevel === 'warning'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            เข้าเรียนสะสม: {summary.attendanceRate}%
                          </span>
                        )}

                        {isAbsentStreak && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-rose-600/30 text-rose-200 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                            <Flame className="w-3 h-3 text-rose-400" />
                            <span>⚠️ ขาด 2+ ครั้งติดต่อกัน!</span>
                          </span>
                        )}

                        {student.note && (
                          <span className="text-[11px] text-slate-400 italic truncate max-w-xs">
                            • {student.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {record.note ? (
                      <button
                        onClick={() => {
                          setActiveNoteStudentId(student.id);
                          setNoteText(record.note || '');
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-800/50 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="max-w-[120px] truncate">{record.note}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveNoteStudentId(student.id);
                          setNoteText('');
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 hover:bg-slate-700/50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>บันทึกโน้ต</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Action Section: 4 Big Touch Buttons for Attendance */}
                <div className="pt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* มา (Present) */}
                  <button
                    onClick={() => handleSetStatus(student.id, 'present')}
                    className={`py-3 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                      record.status === 'present'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30 ring-2 ring-emerald-400'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-emerald-950/40 hover:text-emerald-300 border border-slate-700'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>มา</span>
                  </button>

                  {/* ขาด (Absent) */}
                  <button
                    onClick={() => handleSetStatus(student.id, 'absent')}
                    className={`py-3 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                      record.status === 'absent'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-700/30 ring-2 ring-rose-400'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-rose-950/40 hover:text-rose-300 border border-slate-700'
                    }`}
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>ขาด</span>
                  </button>

                  {/* ลา (Leave) */}
                  <button
                    onClick={() => handleSetStatus(student.id, 'leave')}
                    className={`py-3 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                      record.status === 'leave'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-700/30 ring-2 ring-amber-400'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-amber-950/40 hover:text-amber-300 border border-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>ลา</span>
                  </button>

                  {/* สาย (Late) */}
                  <button
                    onClick={() => handleSetStatus(student.id, 'late')}
                    className={`py-3 px-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none active:scale-95 ${
                      record.status === 'late'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-700/30 ring-2 ring-orange-400'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-orange-950/40 hover:text-orange-300 border border-slate-700'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>สาย</span>
                  </button>
                </div>

                {/* Participation Score & Activities (0 - 3) */}
                <div className="mt-3 pt-3 border-t border-slate-700/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400" />
                      <span>คะแนนการมีส่วนร่วม:</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2, 3].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleSetScore(student.id, num)}
                          className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                            record.score === num
                              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-300'
                              : 'bg-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fast Action Tags for Participation */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { tag: 'ตอบคำถาม', bonus: 1 },
                      { tag: 'กิจกรรมกลุ่ม', bonus: 2 },
                      { tag: 'ช่วยแก้โจทย์', bonus: 2 },
                      { tag: 'นำเสนอ', bonus: 3 },
                    ].map(({ tag, bonus }) => {
                      const hasTag = record.activityTags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => handleToggleTag(student.id, tag, bonus)}
                          className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer ${
                            hasTag
                              ? 'bg-indigo-600 text-white font-semibold ring-1 ring-indigo-400'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {hasTag ? '✓ ' : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Note Editor Modal/Card */}
                {activeNoteStudentId === student.id && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                    <label className="text-xs font-semibold text-slate-300 block">
                      บันทึกหมายเหตุสำหรับ {student.name} ({student.studentCode})
                    </label>
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="เช่น ขอลากลับบ้าน, ตอบคำถามเคสพิเศษ, ส่งการบ้านย้อนหลัง..."
                      className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setActiveNoteStudentId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={() => handleSaveNote(student.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                      >
                        บันทึกโน้ต
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Quick-Save Action for Mobile */}
      <div className="fixed bottom-16 md:bottom-6 left-0 right-0 max-w-md mx-auto px-4 pointer-events-none z-30">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 pl-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              มา {stats.present} • ขาด {stats.absent} • ลา/สาย {stats.leave + stats.late}
            </span>
          </div>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
              saveSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>บันทึกแล้ว</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกคาบนี้</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
