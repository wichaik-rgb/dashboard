import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Flame,
  TrendingDown,
  TrendingUp,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  Download,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Sparkles,
  Info
} from 'lucide-react';
import type {
  Course,
  Student,
  Session,
  CourseAnalytics,
  StudentAttendanceSummary
} from '../types';

interface DashboardProps {
  course: Course;
  students: Student[];
  sessions: Session[];
  analytics: CourseAnalytics;
  summaries: StudentAttendanceSummary[];
  onSelectStudentSession?: (studentId: string, weekNumber: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  course,
  students,
  sessions,
  analytics,
  summaries,
}) => {
  const [filterRisk, setFilterRisk] = useState<'all' | 'critical' | 'warning' | 'normal' | 'consecutive'>('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [sortField, setSortField] = useState<'studentCode' | 'rateAsc' | 'rateDesc' | 'score'>('rateAsc');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentAttendanceSummary | null>(null);

  // Filtered and sorted summaries
  const filteredSummaries = useMemo(() => {
    return summaries
      .filter((s) => {
        // Search
        const q = searchStudent.trim().toLowerCase();
        if (q) {
          const matchCode = s.student.studentCode.toLowerCase().includes(q);
          const matchName = s.student.name.toLowerCase().includes(q);
          if (!matchCode && !matchName) return false;
        }

        // Filter
        if (filterRisk === 'all') return true;
        if (filterRisk === 'critical') return s.riskLevel === 'critical';
        if (filterRisk === 'warning') return s.riskLevel === 'warning';
        if (filterRisk === 'normal') return s.riskLevel === 'normal';
        if (filterRisk === 'consecutive') return s.consecutiveAbsences >= 2 || s.maxConsecutiveAbsences >= 2;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'rateAsc') return a.attendanceRate - b.attendanceRate;
        if (sortField === 'rateDesc') return b.attendanceRate - a.attendanceRate;
        if (sortField === 'score') return b.totalParticipationScore - a.totalParticipationScore;
        return a.student.studentCode.localeCompare(b.student.studentCode);
      });
  }, [summaries, searchStudent, filterRisk, sortField]);

  // Export to CSV function
  const handleExportCSV = () => {
    const headers = [
      'รหัสนักศึกษา',
      'ชื่อ-นามสกุล',
      'สถานะความเสี่ยง',
      'เปอร์เซ็นต์เข้าเรียน (%)',
      'มา (ครั้ง)',
      'ขาด (ครั้ง)',
      'ลา (ครั้ง)',
      'สาย (ครั้ง)',
      'ขาดติดต่อกันสูงสุด (ครั้ง)',
      'คะแนนการมีส่วนร่วมรวม',
      'เบอร์โทรศัพท์',
    ];

    const rows = summaries.map((s) => [
      `"${s.student.studentCode}"`,
      `"${s.student.name}"`,
      `"${s.riskLevel === 'critical' ? 'กลุ่มเสี่ยง (<60%)' : s.riskLevel === 'warning' ? 'เฝ้าระวัง (60-79%)' : 'ปกติ (≥80%)'}"`,
      s.attendanceRate,
      s.presentCount,
      s.absentCount,
      s.leaveCount,
      s.lateCount,
      s.maxConsecutiveAbsences,
      s.totalParticipationScore,
      `"${s.student.phone || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ClassPulse_${course.code}_รายงานการเข้าเรียน.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-16 space-y-6">
      {/* 1. Header Banner & Course Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
              {course.code} • ตอน {course.section}
            </span>
            <span className="text-xs text-slate-400">ภาคเรียน {course.semester}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            แดชบอร์ดวิเคราะห์การเข้าเรียน & การมีส่วนร่วม
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
            สรุปข้อมูลสถิติจากทั้งหมด {sessions.length} คาบเรียน • นักศึกษา {students.length} คน
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>ส่งออกรายงาน (CSV)</span>
          </button>
        </div>
      </div>

      {/* 2. CRITICAL ALERT BOX: Students missing > 2 consecutive sessions */}
      {analytics.criticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-2 border-rose-600/60 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5 animate-bounce">
              <Flame className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  🚨 แจ้งเตือนด่วน: นักศึกษาที่ขาดเรียนเกิน 2 ครั้งติดต่อกัน ({analytics.criticalAlerts.length} คน)
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/40 font-semibold">
                  ความเสี่ยงสูงสุด
                </span>
              </div>
              <p className="text-xs sm:text-sm text-rose-200/90 mt-1">
                ผู้เรียนกลุ่มนี้เริ่มห่างหายจากชั้นเรียน ควรเร่งประสานงานติดต่อสอบถาม หรือส่งต่ออาจารย์ที่ปรึกษาเพื่อป้องกันการหลุดจากระบบ
              </p>

              {/* Student Cards in Alert Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {analytics.criticalAlerts.map((item) => (
                  <div
                    key={item.student.id}
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/40 flex flex-col justify-between gap-2 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400">
                          {item.student.studentCode}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          ขาดสะสม {item.maxConsecutiveAbsences} คาบติด!
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-white mt-1">{item.student.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        เข้าเรียนรวม: <strong className="text-rose-400">{item.attendanceRate}%</strong> (ขาด {item.absentCount} ครั้ง)
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                      {item.student.phone ? (
                        <a
                          href={`tel:${item.student.phone}`}
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.student.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-[11px]">ไม่มีเบอร์โทร</span>
                      )}

                      <button
                        onClick={() => setSelectedStudentForModal(item)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                      >
                        ดูประวัติการเข้าเรียน →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Overall Attendance % */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">อัตราเข้าเรียนเฉลี่ย</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white font-mono">
                {analytics.overallAttendanceRate}%
              </span>
              <span className="text-xs text-slate-400 font-medium">ทั้งภาคเรียน</span>
            </div>
            <div className="mt-2 w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${analytics.overallAttendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Lowest Attendance Week Spotlight */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-amber-600/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">สัปดาห์เข้าเรียนต่ำสุด</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="mt-2">
            {analytics.lowestAttendanceWeek ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-300">
                    สัปดาห์ที่ {analytics.lowestAttendanceWeek.weekNumber}
                  </span>
                  <span className="text-xs font-bold text-rose-400 font-mono">
                    ({analytics.lowestAttendanceWeek.rate}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">
                  วันที่ {analytics.lowestAttendanceWeek.date} • ขาด {analytics.lowestAttendanceWeek.absentCount} คน
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">ยังไม่มีข้อมูลคาบเรียน</p>
            )}
          </div>
        </div>

        {/* KPI 3: Risk Level Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">การจัดกลุ่มความเสี่ยง</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> ปกติ (≥80%)
              </span>
              <span className="font-bold font-mono text-white">{analytics.riskDistribution.normal} คน</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> เฝ้าระวัง (60-79%)
              </span>
              <span className="font-bold font-mono text-white">{analytics.riskDistribution.warning} คน</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> เสี่ยง (<strong className="font-mono">60%</strong>)
              </span>
              <span className="font-bold font-mono text-rose-400">{analytics.riskDistribution.critical} คน</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Average Participation Score */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">คะแนนการมีส่วนร่วมเฉลี่ย</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-400 font-mono">
                {summaries.length > 0
                  ? (
                      summaries.reduce((acc, curr) => acc + curr.avgParticipationScore, 0) /
                      summaries.length
                    ).toFixed(1)
                  : '0.0'}
              </span>
              <span className="text-xs text-slate-400 font-medium">/ 3.0 คะแนนเต็ม</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              วัดจากการตอบคำถาม, กิจกรรมกลุ่ม, และการนำเสนอ
            </p>
          </div>
        </div>
      </div>

      {/* 4. Weekly Attendance Trend Graph (Line + Bar Chart) */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-700/60">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>กราฟแนวโน้มการเข้าเรียนรายสัปดาห์ (Weekly Trend)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ติดตามว่าสัปดาห์ใดผู้เรียนเข้าเรียนสูงสุด หรือเริ่มมีอัตราการขาดเรียนเพิ่มขึ้น
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-500" /> อัตราเข้าเรียน (%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500" /> เกณฑ์ขั้นต่ำ (80%)
            </span>
          </div>
        </div>

        {/* Visual Chart Bars & Line */}
        <div className="pt-6 pb-2">
          {analytics.weeklyTrends.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              ยังไม่มีข้อมูลการเข้าเรียนรายสัปดาห์
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {analytics.weeklyTrends.map((trend) => {
                  const isLowest =
                    analytics.lowestAttendanceWeek &&
                    analytics.lowestAttendanceWeek.weekNumber === trend.weekNumber;
                  const isBelowStandard = trend.attendanceRate < 80;

                  return (
                    <div
                      key={trend.sessionId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isLowest
                          ? 'bg-amber-950/30 border-amber-600/80 ring-1 ring-amber-500/50 shadow-lg'
                          : 'bg-slate-900/60 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">
                          สัปดาห์ที่ {trend.weekNumber}
                        </span>
                        {isLowest && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                            ต่ำสุด
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-2xl font-black font-mono ${
                            isBelowStandard ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {trend.attendanceRate}%
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full bg-slate-800 rounded-full h-2 my-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            trend.attendanceRate >= 80
                              ? 'bg-emerald-400'
                              : trend.attendanceRate >= 60
                              ? 'bg-amber-400'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${trend.attendanceRate}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
                        <span>มา: <strong className="text-emerald-400">{trend.present}</strong></span>
                        <span>ขาด: <strong className="text-rose-400">{trend.absent}</strong></span>
                        <span>ลา/สาย: <strong className="text-amber-400">{trend.leave + trend.late}</strong></span>
                        <span>มีส่วนร่วม: <strong className="text-indigo-300">{trend.avgScore}</strong></span>
                      </div>

                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {trend.sessionDate} • {trend.title}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Lowest attendance explanation note */}
              {analytics.lowestAttendanceWeek && (
                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-700/40 flex items-center gap-2.5 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>ข้อสังเกต:</strong> สัปดาห์ที่ {analytics.lowestAttendanceWeek.weekNumber} มีการเข้าเรียนลดลงเหลือเพียง {analytics.lowestAttendanceWeek.rate}% แนะนำให้อาจารย์ตรวจสอบเนื้อหาหรือเพิ่มกิจกรรมกระตุ้นในสัปดาห์นี้
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Student Status Table & Detailed Timeline */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        {/* Table Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              ตารางวิเคราะห์รายชื่อนักศึกษา & สถานะความเสี่ยง
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              แสดงสถิติการเข้าเรียนสะสม, คะแนนการมีส่วนร่วม, และเส้นเวลาแต่ละสัปดาห์
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="ค้นหารหัส/ชื่อ..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36 sm:w-44"
              />
            </div>

            {/* Risk filter */}
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="all">ทุกสถานะความเสี่ยง</option>
              <option value="critical">เฉพาะกลุ่มเสี่ยง (&lt;60%)</option>
              <option value="warning">เฉพาะเฝ้าระวัง (60-79%)</option>
              <option value="normal">เฉพาะกลุ่มปกติ (≥80%)</option>
              <option value="consecutive">ขาด 2+ ครั้งติดต่อกัน</option>
            </select>

            {/* Sort */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="rateAsc">% เข้าเรียน (น้อย ➔ มาก)</option>
              <option value="rateDesc">% เข้าเรียน (มาก ➔ น้อย)</option>
              <option value="score">คะแนนการมีส่วนร่วมสูงสุด</option>
              <option value="studentCode">รหัสนักศึกษา</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3">รหัสนักศึกษา</th>
                <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3 text-center">สถานะความเสี่ยง</th>
                <th className="py-3 px-3 text-center">% เข้าเรียน</th>
                <th className="py-3 px-3 text-center">มา/ขาด/ลา/สาย</th>
                <th className="py-3 px-3 text-center">คะแนนมีส่วนร่วม</th>
                <th className="py-3 px-3 text-center">ประวัติรายสัปดาห์</th>
                <th className="py-3 px-3 text-right">ติดต่อ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลนักศึกษาตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((s) => {
                  const isConsecutiveAlert = s.consecutiveAbsences >= 2 || s.maxConsecutiveAbsences >= 2;

                  return (
                    <tr
                      key={s.student.id}
                      className="hover:bg-slate-750/50 transition-colors"
                    >
                      {/* รหัสนักศึกษา */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-300">
                        {s.student.studentCode}
                      </td>

                      {/* ชื่อ-สกุล */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{s.student.name}</div>
                        {s.student.nickname && (
                          <span className="text-[11px] text-slate-400">({s.student.nickname})</span>
                        )}
                      </td>

                      {/* สถานะความเสี่ยง */}
                      <td className="py-3 px-3 text-center">
                        {s.riskLevel === 'critical' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>กลุ่มเสี่ยง (&lt;60%)</span>
                          </span>
                        ) : s.riskLevel === 'warning' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            <span>เฝ้าระวัง (60-79%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ปกติ (≥80%)</span>
                          </span>
                        )}

                        {isConsecutiveAlert && (
                          <span className="block text-[10px] text-rose-400 font-bold mt-1">
                            ⚠️ ขาด {s.maxConsecutiveAbsences} คาบติด
                          </span>
                        )}
                      </td>

                      {/* % การเข้าเรียน */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono text-sm font-black ${
                            s.attendanceRate >= 80
                              ? 'text-emerald-400'
                              : s.attendanceRate >= 60
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {s.attendanceRate}%
                        </span>
                      </td>

                      {/* มา / ขาด / ลา / สาย */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-emerald-400 font-bold">{s.presentCount}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-rose-400 font-bold">{s.absentCount}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-amber-400">{s.leaveCount}</span>
                        <span className="text-slate-600"> / </span>
                        <span className="text-orange-400">{s.lateCount}</span>
                      </td>

                      {/* คะแนนการมีส่วนร่วม */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-amber-300 font-mono">
                          {s.totalParticipationScore}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          เฉลี่ย {s.avgParticipationScore}/คาบ
                        </span>
                      </td>

                      {/* ประวัติสัปดาห์ (Weekly dots) */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {s.recentStatuses.map((st) => (
                            <span
                              key={st.week}
                              title={`สัปดาห์ที่ ${st.week} (${st.date}): ${
                                st.status === 'present'
                                  ? 'มา'
                                  : st.status === 'absent'
                                  ? 'ขาด'
                                  : st.status === 'leave'
                                  ? 'ลา'
                                  : st.status === 'late'
                                  ? 'สาย'
                                  : 'ยังไม่เช็ก'
                              }`}
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                st.status === 'present'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : st.status === 'absent'
                                  ? 'bg-rose-500 text-white'
                                  : st.status === 'leave'
                                  ? 'bg-amber-400 text-slate-950'
                                  : st.status === 'late'
                                  ? 'bg-orange-400 text-slate-950'
                                  : 'bg-slate-700 text-slate-400'
                              }`}
                            >
                              {st.week}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* การติดต่อ */}
                      <td className="py-3 px-3 text-right">
                        {s.student.phone ? (
                          <a
                            href={`tel:${s.student.phone}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium text-[11px]"
                          >
                            <Phone className="w-3 h-3" />
                            <span>โทร</span>
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[11px]">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">
                  {selectedStudentForModal.student.studentCode}
                </span>
                <h3 className="text-lg font-bold text-white">
                  {selectedStudentForModal.student.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedStudentForModal.student.phone || 'ไม่มีเบอร์โทรศัพท์'}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400">ร้อยละการเข้าเรียน</span>
                <p className="text-xl font-black text-rose-400 font-mono mt-1">
                  {selectedStudentForModal.attendanceRate}%
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-xs text-slate-400">ขาดเรียนติดต่อกัน</span>
                <p className="text-xl font-black text-amber-400 font-mono mt-1">
                  {selectedStudentForModal.maxConsecutiveAbsences} สัปดาห์
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                ประวัติการเข้าเรียนรายคาบ
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedStudentForModal.recentStatuses.map((st) => (
                  <div
                    key={st.week}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 text-xs"
                  >
                    <span className="text-slate-300">
                      สัปดาห์ที่ {st.week} ({st.date})
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        st.status === 'present'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : st.status === 'absent'
                          ? 'bg-rose-500/20 text-rose-300'
                          : st.status === 'leave'
                          ? 'bg-amber-500/20 text-amber-300'
                          : st.status === 'late'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'text-slate-500'
                      }`}
                    >
                      {st.status === 'present'
                        ? 'มา'
                        : st.status === 'absent'
                        ? 'ขาดเรียน'
                        : st.status === 'leave'
                        ? 'ลา'
                        : st.status === 'late'
                        ? 'สาย'
                        : 'ยังไม่เช็ก'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
