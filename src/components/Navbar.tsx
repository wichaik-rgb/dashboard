import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  LogOut,
  ChevronDown,
  Users,
  BarChart3,
  ClipboardCheck,
  GraduationCap
} from 'lucide-react';
import type { Course } from '../types';

interface NavbarProps {
  courses: Course[];
  selectedCourse: Course | null;
  onSelectCourse: (course: Course) => void;
  activeTab: 'attendance' | 'dashboard' | 'students';
  onChangeTab: (tab: 'attendance' | 'dashboard' | 'students') => void;
  onOpenNewCourse: () => void;
  onSeedDemoCourse: () => void;
  userEmail?: string | null;
  onLogout: () => void;
  isSeeding?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  courses,
  selectedCourse,
  onSelectCourse,
  activeTab,
  onChangeTab,
  onOpenNewCourse,
  onSeedDemoCourse,
  userEmail,
  onLogout,
  isSeeding,
}) => {
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand & Course selector */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
                CP
              </div>
              <span className="font-extrabold tracking-tight text-lg hidden sm:inline-block bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                ClassPulse
              </span>
            </div>

            {/* Course Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setCourseDropdownOpen(!courseDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all max-w-[220px] sm:max-w-xs cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">
                    {selectedCourse ? `${selectedCourse.code} (${selectedCourse.section})` : 'เลือกวิชา'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {selectedCourse?.name || 'ไม่มีวิชาที่เลือก'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Dropdown Menu */}
              {courseDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 border-b border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      รายวิชาของคุณ ({courses.length})
                    </span>
                    <button
                      onClick={() => {
                        setCourseDropdownOpen(false);
                        onOpenNewCourse();
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มวิชา</span>
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto py-1">
                    {courses.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-400 text-center">
                        ยังไม่มีรายวิชา
                      </div>
                    ) : (
                      courses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() => {
                            onSelectCourse(course);
                            setCourseDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-700/60 transition-colors flex items-center justify-between cursor-pointer ${
                            selectedCourse?.id === course.id ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-200'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{course.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                                ตอน {course.section}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">{course.name}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{course.semester}</span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="px-2 pt-2 border-t border-slate-700/60 space-y-1">
                    <button
                      onClick={() => {
                        setCourseDropdownOpen(false);
                        onOpenNewCourse();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-slate-700/60 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>สร้างรายวิชาใหม่</span>
                    </button>

                    <button
                      onClick={() => {
                        setCourseDropdownOpen(false);
                        onSeedDemoCourse();
                      }}
                      disabled={isSeeding}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/40 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>{isSeeding ? 'กำลังสร้างข้อมูล...' : 'โหลดวิชาตัวอย่าง (CS102 พร้อมข้อมูล 5 สัปดาห์)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => onChangeTab('attendance')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>หน้าเช็กชื่อ</span>
            </button>

            <button
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>แดชบอร์ด & แนวโน้ม</span>
            </button>

            <button
              onClick={() => onChangeTab('students')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>รายชื่อนักศึกษา</span>
            </button>
          </nav>

          {/* Right Actions: User profile */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setCourseDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                  {userEmail?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-xs text-slate-300 hidden lg:inline-block max-w-[140px] truncate">
                  {userEmail || 'อาจารย์'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline-block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-700/60">
                    <p className="text-xs text-slate-400">เข้าสู่ระบบด้วย</p>
                    <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom-Fixed Navigation Bar for Quick Thumbs Reach */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => onChangeTab('attendance')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'attendance' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[11px]">เช็กชื่อ</span>
        </button>

        <button
          onClick={() => onChangeTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px]">แดชบอร์ด</span>
        </button>

        <button
          onClick={() => onChangeTab('students')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'students' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px]">นักศึกษา</span>
        </button>
      </div>
    </header>
  );
};
