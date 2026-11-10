export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late' | 'unrecorded';

export interface Course {
  id: string;
  code: string; // e.g. "CPE201"
  name: string; // e.g. "Data Structures & Algorithms"
  section: string; // e.g. "001"
  semester: string; // e.g. "2/2567"
  teacherId: string;
  teacherEmail: string;
  totalWeeks: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Student {
  id: string;
  studentCode: string; // รหัสนักศึกษา e.g. "65010042"
  name: string; // ชื่อ-สกุล
  nickname?: string;
  email?: string;
  phone?: string;
  note?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  courseId: string;
  weekNumber: number; // สัปดาห์ที่ 1 - 16
  sessionDate: string; // YYYY-MM-DD
  title: string; // หัวข้อการสอน e.g. "Introduction to Trees & Graphs"
  notes?: string;
  status: 'open' | 'completed';
  presentCount?: number;
  absentCount?: number;
  leaveCount?: number;
  lateCount?: number;
  avgParticipation?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  id: string; // usually studentId
  studentId: string;
  studentCode: string;
  studentName: string;
  status: AttendanceStatus;
  score: number; // 0, 1, 2, 3
  activityTags?: string[]; // e.g. ["ตอบคำถาม", "ช่วยเพื่อน", "กิจกรรมกลุ่ม"]
  note?: string;
  updatedAt: string;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalSessionsHeld: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  attendanceRate: number; // percentage (0 - 100)
  totalParticipationScore: number;
  avgParticipationScore: number;
  consecutiveAbsences: number; // current consecutive absences
  maxConsecutiveAbsences: number; // highest consecutive absences in semester
  riskLevel: 'normal' | 'warning' | 'critical'; // normal >= 80%, warning 60-79%, critical < 60%
  recentStatuses: { week: number; status: AttendanceStatus; date: string }[];
}

export interface CourseAnalytics {
  totalStudents: number;
  totalSessions: number;
  overallAttendanceRate: number;
  lowestAttendanceWeek: {
    weekNumber: number;
    date: string;
    rate: number;
    presentCount: number;
    absentCount: number;
  } | null;
  weeklyTrends: {
    sessionId: string;
    weekNumber: number;
    sessionDate: string;
    title: string;
    attendanceRate: number;
    present: number;
    absent: number;
    leave: number;
    late: number;
    avgScore: number;
  }[];
  criticalAlerts: StudentAttendanceSummary[]; // ขาดเกิน 2 ครั้งติดกัน
  riskDistribution: {
    normal: number; // >= 80%
    warning: number; // 60-79%
    critical: number; // < 60%
  };
}
