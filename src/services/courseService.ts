import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import type {
  Course,
  Student,
  Session,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary,
  CourseAnalytics,
} from '../types';

export const courseService = {
  // Fetch all courses owned by teacher
  async getCourses(teacherId: string): Promise<Course[]> {
    const path = 'courses';
    try {
      const q = query(
        collection(db, path),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Course, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Create a new course
  async createCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
    const path = 'courses';
    try {
      const courseRef = doc(collection(db, path));
      const newCourse: Course = {
        ...course,
        id: courseRef.id,
        createdAt: new Date().toISOString(),
      };
      await setDoc(courseRef, newCourse);
      return newCourse;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Delete a course
  async deleteCourse(courseId: string): Promise<void> {
    const path = `courses/${courseId}`;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Get students in a course
  async getStudents(courseId: string): Promise<Student[]> {
    const path = `courses/${courseId}/students`;
    try {
      const q = query(collection(db, path), orderBy('studentCode', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Student, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Add a single student
  async addStudent(courseId: string, student: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
    const path = `courses/${courseId}/students`;
    try {
      const studentRef = doc(collection(db, path));
      const newStudent: Student = {
        ...student,
        id: studentRef.id,
        createdAt: new Date().toISOString(),
      };
      await setDoc(studentRef, newStudent);
      return newStudent;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Bulk add students from text (e.g. pasted from Excel: "65010001 นายสมชาย ใจดี")
  async bulkAddStudents(courseId: string, rawText: string): Promise<number> {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return 0;

    const batch = writeBatch(db);
    let count = 0;

    for (const line of lines) {
      // Split by tab, comma, or first space
      const parts = line.split(/[\t,]|(?<=\S)\s+/);
      const studentCode = parts[0]?.trim() || '';
      const name = parts.slice(1).join(' ').trim() || studentCode;

      if (!studentCode) continue;

      const studentRef = doc(collection(db, `courses/${courseId}/students`));
      const newStudent: Student = {
        id: studentRef.id,
        studentCode,
        name,
        createdAt: new Date().toISOString(),
      };
      batch.set(studentRef, newStudent);
      count++;
    }

    try {
      await batch.commit();
      return count;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `courses/${courseId}/students`);
    }
  },

  // Delete a student
  async deleteStudent(courseId: string, studentId: string): Promise<void> {
    const path = `courses/${courseId}/students/${studentId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Get sessions in a course
  async getSessions(courseId: string): Promise<Session[]> {
    const path = `courses/${courseId}/sessions`;
    try {
      const q = query(collection(db, path), orderBy('weekNumber', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Session, 'id'>),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Create a new session
  async createSession(
    courseId: string,
    session: Omit<Session, 'id' | 'courseId' | 'createdAt'>
  ): Promise<Session> {
    const path = `courses/${courseId}/sessions`;
    try {
      const sessionRef = doc(collection(db, path));
      const newSession: Session = {
        ...session,
        id: sessionRef.id,
        courseId,
        createdAt: new Date().toISOString(),
      };
      await setDoc(sessionRef, newSession);
      return newSession;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  // Get attendance records for a session
  async getSessionRecords(courseId: string, sessionId: string): Promise<Record<string, AttendanceRecord>> {
    const path = `courses/${courseId}/sessions/${sessionId}/records`;
    try {
      const snapshot = await getDocs(collection(db, path));
      const records: Record<string, AttendanceRecord> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as AttendanceRecord;
        records[data.studentId] = {
          ...data,
          id: docSnap.id,
        };
      });
      return records;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  // Save/Update attendance records in batch and update session summary
  async saveAttendanceRecords(
    courseId: string,
    sessionId: string,
    records: AttendanceRecord[]
  ): Promise<void> {
    const path = `courses/${courseId}/sessions/${sessionId}/records`;
    try {
      const batch = writeBatch(db);

      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let lateCount = 0;
      let totalScore = 0;
      let ratedCount = 0;

      for (const rec of records) {
        const recRef = doc(db, path, rec.studentId);
        batch.set(recRef, {
          ...rec,
          updatedAt: new Date().toISOString(),
        });

        if (rec.status === 'present') presentCount++;
        else if (rec.status === 'absent') absentCount++;
        else if (rec.status === 'leave') leaveCount++;
        else if (rec.status === 'late') lateCount++;

        if (rec.score > 0) {
          totalScore += rec.score;
          ratedCount++;
        }
      }

      // Update session counts
      const sessionRef = doc(db, `courses/${courseId}/sessions`, sessionId);
      batch.update(sessionRef, {
        presentCount,
        absentCount,
        leaveCount,
        lateCount,
        avgParticipation: records.length > 0 ? parseFloat((totalScore / records.length).toFixed(2)) : 0,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Compute full analytics across all sessions and students
  async computeCourseAnalytics(
    courseId: string,
    students: Student[],
    sessions: Session[]
  ): Promise<{ summaries: StudentAttendanceSummary[]; analytics: CourseAnalytics }> {
    // Sort sessions by weekNumber
    const sortedSessions = [...sessions].sort((a, b) => a.weekNumber - b.weekNumber);

    // Fetch records for all sessions
    const sessionRecordsMap: Record<string, Record<string, AttendanceRecord>> = {};
    for (const sess of sortedSessions) {
      sessionRecordsMap[sess.id] = await this.getSessionRecords(courseId, sess.id);
    }

    const summaries: StudentAttendanceSummary[] = [];

    // Calculate per-student stats
    for (const student of students) {
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let lateCount = 0;
      let totalParticipationScore = 0;
      let currentConsecutiveAbsence = 0;
      let maxConsecutiveAbsence = 0;
      const recentStatuses: { week: number; status: AttendanceStatus; date: string }[] = [];

      let runningConsecutive = 0;

      for (const sess of sortedSessions) {
        const record = sessionRecordsMap[sess.id]?.[student.id];
        const status: AttendanceStatus = record ? record.status : 'unrecorded';
        const score = record ? record.score : 0;

        recentStatuses.push({
          week: sess.weekNumber,
          status,
          date: sess.sessionDate,
        });

        if (status === 'present') {
          presentCount++;
          runningConsecutive = 0;
        } else if (status === 'absent') {
          absentCount++;
          runningConsecutive++;
          if (runningConsecutive > maxConsecutiveAbsence) {
            maxConsecutiveAbsence = runningConsecutive;
          }
        } else if (status === 'late') {
          lateCount++;
          runningConsecutive = 0;
        } else if (status === 'leave') {
          leaveCount++;
          runningConsecutive = 0;
        }

        totalParticipationScore += score;
      }

      currentConsecutiveAbsence = runningConsecutive;
      const totalSessionsHeld = sortedSessions.length;
      // Formula: (Present + Late * 0.75) / Total Sessions Held * 100
      const attendanceRate =
        totalSessionsHeld > 0
          ? Math.round(((presentCount + lateCount * 0.75) / totalSessionsHeld) * 100)
          : 100;

      let riskLevel: 'normal' | 'warning' | 'critical' = 'normal';
      if (attendanceRate < 60) {
        riskLevel = 'critical';
      } else if (attendanceRate < 80) {
        riskLevel = 'warning';
      }

      summaries.push({
        student,
        totalSessionsHeld,
        presentCount,
        absentCount,
        leaveCount,
        lateCount,
        attendanceRate,
        totalParticipationScore,
        avgParticipationScore:
          totalSessionsHeld > 0
            ? parseFloat((totalParticipationScore / totalSessionsHeld).toFixed(1))
            : 0,
        consecutiveAbsences: currentConsecutiveAbsence,
        maxConsecutiveAbsences: maxConsecutiveAbsence,
        riskLevel,
        recentStatuses,
      });
    }

    // Weekly Trends & Lowest Attendance Week
    const weeklyTrends = sortedSessions.map((sess) => {
      const records = sessionRecordsMap[sess.id] || {};
      let p = 0;
      let a = 0;
      let l = 0;
      let lt = 0;
      let totalScr = 0;

      Object.values(records).forEach((r) => {
        if (r.status === 'present') p++;
        else if (r.status === 'absent') a++;
        else if (r.status === 'leave') l++;
        else if (r.status === 'late') lt++;
        totalScr += r.score || 0;
      });

      const totalRecorded = p + a + l + lt;
      const rate = totalRecorded > 0 ? Math.round(((p + lt * 0.75) / totalRecorded) * 100) : 0;

      return {
        sessionId: sess.id,
        weekNumber: sess.weekNumber,
        sessionDate: sess.sessionDate,
        title: sess.title,
        attendanceRate: rate,
        present: p,
        absent: a,
        leave: l,
        late: lt,
        avgScore: totalRecorded > 0 ? parseFloat((totalScr / totalRecorded).toFixed(2)) : 0,
      };
    });

    // Find week with lowest attendance
    let lowestWeek: CourseAnalytics['lowestAttendanceWeek'] = null;
    if (weeklyTrends.length > 0) {
      const sortedByRate = [...weeklyTrends].sort((a, b) => a.attendanceRate - b.attendanceRate);
      const lowest = sortedByRate[0];
      lowestWeek = {
        weekNumber: lowest.weekNumber,
        date: lowest.sessionDate,
        rate: lowest.attendanceRate,
        presentCount: lowest.present,
        absentCount: lowest.absent,
      };
    }

    // Critical Alerts: Missing > 2 consecutive times
    // (Notice user prompt: "แจ้งเตือนผู้ที่ขาดเกิน 2 ครั้งติดกัน" -> consecutiveAbsences >= 2 or maxConsecutive >= 2)
    const criticalAlerts = summaries.filter(
      (s) => s.consecutiveAbsences >= 2 || s.maxConsecutiveAbsences >= 2
    );

    const riskDistribution = {
      normal: summaries.filter((s) => s.riskLevel === 'normal').length,
      warning: summaries.filter((s) => s.riskLevel === 'warning').length,
      critical: summaries.filter((s) => s.riskLevel === 'critical').length,
    };

    const overallRate =
      weeklyTrends.length > 0
        ? Math.round(
            weeklyTrends.reduce((acc, curr) => acc + curr.attendanceRate, 0) / weeklyTrends.length
          )
        : 100;

    const analytics: CourseAnalytics = {
      totalStudents: students.length,
      totalSessions: sortedSessions.length,
      overallAttendanceRate: overallRate,
      lowestAttendanceWeek: lowestWeek,
      weeklyTrends,
      criticalAlerts,
      riskDistribution,
    };

    return { summaries, analytics };
  },

  // Seed realistic sample data for instant classroom testing
  async seedDemoCourse(teacherId: string, teacherEmail: string): Promise<Course> {
    const courseRef = doc(collection(db, 'courses'));
    const courseId = courseRef.id;

    const demoCourse: Course = {
      id: courseId,
      code: 'CS102',
      name: 'การออกแบบขั้นตอนวิธีและการแก้ปัญหา (Algorithms & Problem Solving)',
      section: '01',
      semester: '2/2567',
      teacherId,
      teacherEmail,
      totalWeeks: 15,
      createdAt: new Date().toISOString(),
    };

    await setDoc(courseRef, demoCourse);

    // 20 Sample Students with Thai names and student codes
    const sampleStudents: Omit<Student, 'id' | 'createdAt'>[] = [
      { studentCode: '65010101', name: 'กิตติศักดิ์ เจริญผล', nickname: 'กิต', phone: '081-234-5678', note: 'หัวหน้าตอน' },
      { studentCode: '65010102', name: 'กานต์รวี วงศ์สุวรรณ', nickname: 'แก้ม', phone: '082-345-6789' },
      { studentCode: '65010103', name: 'ชานนท์ เมธาอนันต์', nickname: 'นนท์', phone: '083-456-7890' },
      { studentCode: '65010104', name: 'ณิชานันท์ อัศวเสนา', nickname: 'นิชา', phone: '084-567-8901' },
      { studentCode: '65010105', name: 'ธนกฤต ปัญญาวงศ์', nickname: 'ท็อป', phone: '085-678-9012' },
      { studentCode: '65010106', name: 'ธัชพล ศิริโภคา', nickname: 'พีช', phone: '086-789-0123', note: 'ติดงานกิจกรรมคณะบ่อย' },
      { studentCode: '65010107', name: 'ธีรเดช บวรกิตติ', nickname: 'เดช', phone: '087-890-1234' },
      { studentCode: '65010108', name: 'นภัสสร รัตนไพศาล', nickname: 'มายด์', phone: '088-901-2345' },
      { studentCode: '65010109', name: 'ปรเมศวร์ วัฒนศิริ', nickname: 'บอส', phone: '089-012-3456' },
      { studentCode: '65010110', name: 'ปวริศา เตชะกุล', nickname: 'ฟ้า', phone: '090-123-4567' },
      { studentCode: '65010111', name: 'พงศธร เกษมสุข', nickname: 'อาร์ม', phone: '091-234-5678' },
      { studentCode: '65010112', name: 'พลอยไพลิน ศรีสวัสดิ์', nickname: 'พลอย', phone: '092-345-6789' },
      { studentCode: '65010113', name: 'ภูมิภัทร ธรรมรักษ์', nickname: 'ภัทร', phone: '093-456-7890', note: 'ขาดเรียน 3 ครั้งติด เสี่ยงตกวิชา' },
      { studentCode: '65010114', name: 'มณฑกานต์ สัจจะกุล', nickname: 'เมย์', phone: '094-567-8901' },
      { studentCode: '65010115', name: 'ยุทธนา โชคอำนวย', nickname: 'กอล์ฟ', phone: '095-678-9012' },
      { studentCode: '65010116', name: 'วรินทร ชัยชนะ', nickname: 'วิน', phone: '096-789-0123' },
      { studentCode: '65010117', name: 'ศิรดา ปรีชาเวช', nickname: 'พิม', phone: '097-890-1234' },
      { studentCode: '65010118', name: 'สมัชญ์ ศักดิ์เจริญ', nickname: 'นัท', phone: '098-901-2345' },
      { studentCode: '65010119', name: 'อนันตชัย เทพสถิตย์', nickname: 'ตั้ม', phone: '099-012-3456', note: 'ขาดเรียน 2 ครั้งติดกัน (สัปดาห์ 4-5)' },
      { studentCode: '65010120', name: 'อภิญญา ประเสริฐสุข', nickname: 'แนน', phone: '081-999-8877' },
    ];

    const studentEntities: Student[] = [];
    const studentBatch = writeBatch(db);

    for (const s of sampleStudents) {
      const sRef = doc(collection(db, `courses/${courseId}/students`));
      const studentObj: Student = {
        ...s,
        id: sRef.id,
        createdAt: new Date().toISOString(),
      };
      studentBatch.set(sRef, studentObj);
      studentEntities.push(studentObj);
    }
    await studentBatch.commit();

    // 5 Weekly Sessions
    const sampleWeeks = [
      { week: 1, date: '2026-09-08', title: 'ปฐมนิเทศและภาพรวมอัลกอริทึม (Introduction)' },
      { week: 2, date: '2026-09-15', title: 'การวิเคราะห์ความซับซ้อน Big-O Notation' },
      { week: 3, date: '2026-09-22', title: 'โครงสร้างข้อมูล Linked Lists & Stacks' },
      { week: 4, date: '2026-09-29', title: 'Queue & Priority Queue (สัปดาห์ก่อนสอบย่อย)' }, // Lowest attendance week!
      { week: 5, date: '2026-10-06', title: 'Recursion & Divide and Conquer' },
    ];

    for (const w of sampleWeeks) {
      const sessRef = doc(collection(db, `courses/${courseId}/sessions`));
      const sessionId = sessRef.id;

      const recordsBatch = writeBatch(db);
      let pCount = 0;
      let aCount = 0;
      let lCount = 0;
      let ltCount = 0;
      let totalScr = 0;

      for (let i = 0; i < studentEntities.length; i++) {
        const student = studentEntities[i];
        let status: AttendanceStatus = 'present';
        let score = Math.floor(Math.random() * 3); // 0, 1, 2
        let tags: string[] = [];

        // Special test case 1: ภูมิภัทร (index 12) misses weeks 3, 4, 5 (3 consecutive absences -> critical risk)
        if (i === 12) {
          if (w.week >= 3) {
            status = 'absent';
            score = 0;
          } else {
            status = 'present';
            score = 1;
          }
        }
        // Special test case 2: อนันตชัย (index 18) misses weeks 4, 5 (2 consecutive absences -> alert)
        else if (i === 18) {
          if (w.week === 4 || w.week === 5) {
            status = 'absent';
            score = 0;
          } else {
            status = 'present';
            score = 1;
          }
        }
        // Special test case 3: ธัชพล (index 5) takes leave on week 2, 4 (leave)
        else if (i === 5) {
          if (w.week === 2 || w.week === 4) {
            status = 'leave';
            score = 0;
          } else {
            status = 'present';
            score = 2;
          }
        }
        // Week 4 is the lowest attendance week (rains / midterm prep)
        else if (w.week === 4) {
          if (i % 3 === 0) {
            status = 'absent';
            score = 0;
          } else if (i % 5 === 0) {
            status = 'late';
            score = 1;
          } else {
            status = 'present';
            score = i % 2 === 0 ? 2 : 1;
          }
        } else {
          // Normal weeks: high attendance
          if (i === 7 && w.week === 2) {
            status = 'late';
            score = 1;
          } else if (i === 9 && w.week === 3) {
            status = 'leave';
            score = 0;
          } else {
            status = 'present';
            score = (i % 4 === 0) ? 3 : (i % 2 === 0) ? 2 : 1;
          }
        }

        if (status === 'present') pCount++;
        else if (status === 'absent') aCount++;
        else if (status === 'leave') lCount++;
        else if (status === 'late') ltCount++;

        totalScr += score;
        if (score === 3) tags = ['ตอบคำถามดีมาก', 'ช่วยอธิบายเพื่อน'];
        else if (score === 2) tags = ['มีส่วนร่วมกิจกรรมกลุ่ม'];
        else if (score === 1) tags = ['ตอบคำถาม'];

        const recRef = doc(db, `courses/${courseId}/sessions/${sessionId}/records`, student.id);
        const record: AttendanceRecord = {
          id: student.id,
          studentId: student.id,
          studentCode: student.studentCode,
          studentName: student.name,
          status,
          score,
          activityTags: tags,
          updatedAt: new Date().toISOString(),
        };
        recordsBatch.set(recRef, record);
      }

      const sessionObj: Session = {
        id: sessionId,
        courseId,
        weekNumber: w.week,
        sessionDate: w.date,
        title: w.title,
        status: 'completed',
        presentCount: pCount,
        absentCount: aCount,
        leaveCount: lCount,
        lateCount: ltCount,
        avgParticipation: parseFloat((totalScr / studentEntities.length).toFixed(2)),
        createdAt: new Date().toISOString(),
      };

      const sDocRef = doc(db, `courses/${courseId}/sessions`, sessionId);
      await setDoc(sDocRef, sessionObj);
      await recordsBatch.commit();
    }

    return demoCourse;
  },
};
