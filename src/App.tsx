import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, testConnection, logoutUser } from './firebase';
import { courseService } from './services/courseService';
import type {
  Course,
  Student,
  Session,
  AttendanceRecord,
  StudentAttendanceSummary,
  CourseAnalytics,
} from './types';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { AttendanceSheet } from './components/AttendanceSheet';
import { Dashboard } from './components/Dashboard';
import { StudentList } from './components/StudentList';
import { CourseModal } from './components/CourseModal';
import { NewSessionModal } from './components/NewSessionModal';
import { Sparkles, Plus, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [analytics, setAnalytics] = useState<CourseAnalytics>({
    totalStudents: 0,
    totalSessions: 0,
    overallAttendanceRate: 100,
    lowestAttendanceWeek: null,
    weeklyTrends: [],
    criticalAlerts: [],
    riskDistribution: { normal: 0, warning: 0, critical: 0 },
  });

  // UI state
  const [activeTab, setActiveTab] = useState<'attendance' | 'dashboard' | 'students'>('attendance');
  const [loadingData, setLoadingData] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Listen for auth changes and test connection
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch courses when user logs in
  const loadCourses = useCallback(async (userId: string) => {
    try {
      setLoadingData(true);
      const fetched = await courseService.getCourses(userId);
      setCourses(fetched);

      if (fetched.length > 0) {
        setSelectedCourse(fetched[0]);
      } else {
        setSelectedCourse(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user?.uid) {
      loadCourses(user.uid);
    }
  }, [user?.uid, loadCourses]);

  // 3. Load students, sessions, and calculate analytics when course changes
  const loadCourseData = useCallback(async (course: Course) => {
    try {
      setLoadingData(true);
      const [fetchedStudents, fetchedSessions] = await Promise.all([
        courseService.getStudents(course.id),
        courseService.getSessions(course.id),
      ]);

      setStudents(fetchedStudents);
      setSessions(fetchedSessions);

      // Default active session to the latest session
      if (fetchedSessions.length > 0) {
        const sorted = [...fetchedSessions].sort((a, b) => b.weekNumber - a.weekNumber);
        setActiveSession(sorted[0]);
      } else {
        setActiveSession(null);
      }

      // Compute analytics
      if (fetchedStudents.length > 0 || fetchedSessions.length > 0) {
        const result = await courseService.computeCourseAnalytics(
          course.id,
          fetchedStudents,
          fetchedSessions
        );
        setSummaries(result.summaries);
        setAnalytics(result.analytics);
      } else {
        setSummaries([]);
        setAnalytics({
          totalStudents: 0,
          totalSessions: 0,
          overallAttendanceRate: 100,
          lowestAttendanceWeek: null,
          weeklyTrends: [],
          criticalAlerts: [],
          riskDistribution: { normal: 0, warning: 0, critical: 0 },
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadCourseData(selectedCourse);
    } else {
      setStudents([]);
      setSessions([]);
      setActiveSession(null);
      setSummaries([]);
    }
  }, [selectedCourse, loadCourseData]);

  // Recompute analytics helper
  const refreshAnalytics = async () => {
    if (!selectedCourse) return;
    const result = await courseService.computeCourseAnalytics(
      selectedCourse.id,
      students,
      sessions
    );
    setSummaries(result.summaries);
    setAnalytics(result.analytics);
  };

  // Action: Save attendance records
  const handleSaveRecords = async (records: AttendanceRecord[]) => {
    if (!selectedCourse || !activeSession) return;
    await courseService.saveAttendanceRecords(selectedCourse.id, activeSession.id, records);

    // Refresh sessions and analytics
    const updatedSessions = await courseService.getSessions(selectedCourse.id);
    setSessions(updatedSessions);
    const updatedActive = updatedSessions.find((s) => s.id === activeSession.id) || activeSession;
    setActiveSession(updatedActive);

    const result = await courseService.computeCourseAnalytics(
      selectedCourse.id,
      students,
      updatedSessions
    );
    setSummaries(result.summaries);
    setAnalytics(result.analytics);
  };

  // Action: Seed demo course
  const handleSeedDemoCourse = async () => {
    if (!user) return;
    try {
      setIsSeeding(true);
      const demo = await courseService.seedDemoCourse(user.uid, user.email || '');
      await loadCourses(user.uid);
      setSelectedCourse(demo);
      setActiveTab('attendance');
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถสร้างข้อมูลตัวอย่างได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSeeding(false);
    }
  };

  // Action: Create course
  const handleCreateCourse = async (newCourseData: Omit<Course, 'id' | 'createdAt'>) => {
    const created = await courseService.createCourse(newCourseData);
    setCourses((prev) => [created, ...prev]);
    setSelectedCourse(created);
  };

  // Action: Add student
  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    if (!selectedCourse) return;
    const added = await courseService.addStudent(selectedCourse.id, studentData);
    const updated = [...students, added].sort((a, b) => a.studentCode.localeCompare(b.studentCode));
    setStudents(updated);
    await refreshAnalytics();
  };

  // Action: Bulk add students
  const handleBulkAddStudents = async (rawText: string) => {
    if (!selectedCourse) return 0;
    const count = await courseService.bulkAddStudents(selectedCourse.id, rawText);
    const refreshed = await courseService.getStudents(selectedCourse.id);
    setStudents(refreshed);
    await refreshAnalytics();
    return count;
  };

  // Action: Delete student
  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedCourse) return;
    await courseService.deleteStudent(selectedCourse.id, studentId);
    const updated = students.filter((s) => s.id !== studentId);
    setStudents(updated);
    await refreshAnalytics();
  };

  // Action: Create session
  const handleCreateSession = async (
    sessionData: Omit<Session, 'id' | 'courseId' | 'createdAt'>
  ) => {
    if (!selectedCourse) return;
    const created = await courseService.createSession(selectedCourse.id, sessionData);
    const updatedSessions = [...sessions, created].sort((a, b) => a.weekNumber - b.weekNumber);
    setSessions(updatedSessions);
    setActiveSession(created);
    await refreshAnalytics();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">กำลังเตรียมระบบ ClassPulse...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Auth Screen
  if (!user) {
    return <AuthScreen onLoginSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        courses={courses}
        selectedCourse={selectedCourse}
        onSelectCourse={(course) => setSelectedCourse(course)}
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onOpenNewCourse={() => setShowCourseModal(true)}
        onSeedDemoCourse={handleSeedDemoCourse}
        userEmail={user.email}
        onLogout={() => logoutUser()}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-sm">กำลังโหลดข้อมูลวิชาและสถิติ...</p>
          </div>
        ) : !selectedCourse ? (
          /* Empty State: No Course Created Yet */
          <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-xl">
              <BookOpen className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">ยินดีต้อนรับสู่อาจารย์ผู้สอน</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                เริ่มต้นใช้งานด้วยการสร้างรายวิชาใหม่ หรือโหลดรายวิชาตัวอย่างเพื่อทดลองระบบเช็กชื่อและแดชบอร์ดได้ทันที
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleSeedDemoCourse}
                disabled={isSeeding}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSeeding ? 'กำลังสร้างข้อมูล...' : 'โหลดวิชาตัวอย่าง (CS102 พร้อม 20 นักศึกษา)'}</span>
              </button>

              <button
                onClick={() => setShowCourseModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>สร้างรายวิชาใหม่</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Course Views */
          <div>
            {activeTab === 'attendance' && (
              <AttendanceSheet
                course={selectedCourse}
                students={students}
                sessions={sessions}
                activeSession={activeSession}
                onSelectSession={(sess) => setActiveSession(sess)}
                onOpenNewSession={() => setShowSessionModal(true)}
                onSaveRecords={handleSaveRecords}
                studentSummaries={summaries}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                course={selectedCourse}
                students={students}
                sessions={sessions}
                analytics={analytics}
                summaries={summaries}
              />
            )}

            {activeTab === 'students' && (
              <StudentList
                course={selectedCourse}
                students={students}
                summaries={summaries}
                onAddStudent={handleAddStudent}
                onBulkAddStudents={handleBulkAddStudents}
                onDeleteStudent={handleDeleteStudent}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onCreateCourse={handleCreateCourse}
        teacherId={user.uid}
        teacherEmail={user.email || ''}
      />

      <NewSessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        nextWeekNumber={sessions.length + 1}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
}
