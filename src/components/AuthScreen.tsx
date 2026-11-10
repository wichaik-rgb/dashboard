import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase';
import {
  CheckCircle2,
  Users,
  TrendingDown,
  Sparkles,
  Smartphone,
  ShieldAlert,
  GraduationCap,
  Award,
  ArrowRight
} from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      onLoginSuccess?.();
    } catch (err: unknown) {
      console.error(err);
      setError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-950 pointer-events-none" />

      {/* Header bar */}
      <header className="relative z-10 px-6 py-5 max-w-6xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
            CP
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              ClassPulse
            </span>
            <span className="block text-xs text-indigo-400 font-medium">
              ระบบเช็กชื่อ & การมีส่วนร่วมในชั้นเรียน
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/60">
          <GraduationCap className="w-4 h-4 text-indigo-400" />
          <span>สำหรับอาจารย์ผู้สอน</span>
        </div>
      </header>

      {/* Main hero & login card */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left column: value propositions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Mobile-First • เช็กชื่อทั้งห้องเสร็จใน 1 นาที</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            รู้ทันทีว่าใครห่างหาย <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
              และสัปดาห์ไหนที่การเข้าเรียนลดลง
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
            เปลี่ยนการเช็กชื่อที่ล่าช้าให้เป็นเรื่องง่ายบนมือถือ พร้อมบันทึกคะแนนการมีส่วนร่วม 0-3 แต้ม 
            ตรวจจับนักศึกษาที่ขาดเรียนเกิน 2 ครั้งติดกัน และวิเคราะห์ช่วงเวลาเสี่ยงในภาคการศึกษา
          </p>

          {/* Key Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">ปุ่มใหญ่ ติ๊กเร็วบนมือถือ</h4>
                <p className="text-xs text-slate-400 mt-0.5">มีปุ่ม "มาทุกคน" และแตะเปลี่ยน มา/ขาด/ลา/สาย ได้ในคลิกเดียว</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">แต้มการมีส่วนร่วม 0 - 3</h4>
                <p className="text-xs text-slate-400 mt-0.5">ให้คะแนนตอบคำถาม ทำกิจกรรมกลุ่ม และช่วยแก้โจทย์ได้ทันที</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">เตือนขาดเกิน 2 ครั้งติด</h4>
                <p className="text-xs text-slate-400 mt-0.5">ตรวจจับและแจ้งเตือนผู้เรียนที่มีพฤติกรรมขาดติดต่อกันทันที</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 backdrop-blur-sm">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">หาสัปดาห์เข้าเรียนต่ำสุด</h4>
                <p className="text-xs text-slate-400 mt-0.5">วิเคราะห์สัปดาห์ที่นักศึกษาเริ่มหาย เพื่อปรับแผนการสอนได้ทัน</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Login Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-slate-800/70 border border-slate-700/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-indigo-950/50">
            <div className="text-center space-y-2 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">เข้าสู่ระบบอาจารย์ผู้สอน</h2>
              <p className="text-xs sm:text-sm text-slate-400">
                ลงชื่อเข้าใช้งานด้วยบัญชี Google หรืออีเมลมหาวิทยาลัย
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm transition-all shadow-lg shadow-white/5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>ลงชื่อเข้าใช้ด้วย Google</span>
                </>
              )}
            </button>

            <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ปลอดภัย เชื่อมต่อ Cloud Firestore อัตโนมัติ</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                ข้อมูลการเช็กชื่อและรายชื่อนักศึกษาจะถูกจัดเก็บถาวรและเข้าถึงได้ทั้งมือถือและคอมพิวเตอร์
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        ClassPulse • ระบบเช็กชื่อและติดตามการมีส่วนร่วมในชั้นเรียน สำหรับอาจารย์ผู้สอน
      </footer>
    </div>
  );
};
