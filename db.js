/**
 * Anshu Coaching Classes - Fees Management System Database & Financial Engine
 * Version: 1.0.0
 */

const STORAGE_KEYS = {
  STUDENTS: 'anshu_coaching_students_v2',
  PAYMENTS: 'anshu_coaching_payments_v2',
  EXTRA_CHARGES: 'anshu_coaching_extra_charges_v2'
};

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class DatabaseEngine {
  constructor() {
    this.initDefaultStorage();
  }

  initDefaultStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      const defaultStudents = [
        {
          id: 101,
          name: 'Aarav Sharma',
          gender: 'Male',
          class: 'Class 10',
          monthly_fee: 300,
          joining_date: '2026-05-10',
          status: 'Active',
          school: 'St. Xavier School',
          board: 'CBSE',
          created_at: '2026-05-10T10:00:00Z'
        },
        {
          id: 102,
          name: 'Ananya Verma',
          gender: 'Female',
          class: 'Class 9',
          monthly_fee: 300,
          joining_date: '2026-06-15',
          status: 'Active',
          school: 'Kendriya Vidyalaya',
          board: 'State Board',
          created_at: '2026-06-15T10:00:00Z'
        },
        {
          id: 103,
          name: 'Rohan Gupta',
          gender: 'Male',
          class: 'Class 8',
          monthly_fee: 250,
          joining_date: '2026-04-01',
          status: 'Active',
          school: 'Public School',
          board: 'CBSE',
          created_at: '2026-04-01T10:00:00Z'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents));
    }

    if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
      const defaultPayments = [
        {
          id: 1001,
          student_id: 101,
          month: 'May',
          year: 2026,
          monthly_fee: 300,
          paid_amount: 300,
          remaining_amount: 0,
          advance_amount: 0,
          extra_item_name: '',
          extra_charge_amount: 0,
          payment_mode: 'Cash',
          payment_date: '2026-05-10T11:00:00Z'
        },
        {
          id: 1002,
          student_id: 101,
          month: 'June',
          year: 2026,
          monthly_fee: 300,
          paid_amount: 300,
          remaining_amount: 0,
          advance_amount: 0,
          extra_item_name: '',
          extra_charge_amount: 0,
          payment_mode: 'Online',
          payment_date: '2026-06-12T14:30:00Z'
        },
        {
          id: 1003,
          student_id: 102,
          month: 'June',
          year: 2026,
          monthly_fee: 300,
          paid_amount: 300,
          remaining_amount: 0,
          advance_amount: 0,
          extra_item_name: '',
          extra_charge_amount: 0,
          payment_mode: 'Cash',
          payment_date: '2026-06-15T09:15:00Z'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(defaultPayments));
    }

    if (!localStorage.getItem(STORAGE_KEYS.EXTRA_CHARGES)) {
      const defaultExtraCharges = [
        {
          id: 501,
          student_id: 101,
          item_name: 'Rough Book',
          amount: 50,
          added_date: '2026-06-05',
          status: 'PAID',
          cleared_date: '2026-06-12',
          payment_mode: 'Online'
        },
        {
          id: 502,
          student_id: 102,
          item_name: 'Class Copy & Pen',
          amount: 60,
          added_date: '2026-07-02',
          status: 'UNPAID',
          cleared_date: null,
          payment_mode: null
        }
      ];
      localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(defaultExtraCharges));
    }
  }

  // --- STUDENT RECORD OPERATIONS ---
  getStudents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  getStudentById(id) {
    const list = this.getStudents();
    return list.find(s => s.id === Number(id)) || null;
  }

  addStudent(studentData) {
    const list = this.getStudents();
    const newStudent = {
      id: Date.now(),
      name: studentData.name.trim(),
      gender: studentData.gender || 'Male',
      class: studentData.class || 'Class 10',
      monthly_fee: Number(studentData.monthly_fee || 300),
      joining_date: studentData.joining_date || new Date().toISOString().split('T')[0],
      status: studentData.status || 'Active',
      school: studentData.school ? studentData.school.trim() : '',
      board: studentData.board || 'CBSE',
      created_at: new Date().toISOString()
    };

    list.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    return newStudent;
  }

  updateStudent(id, updatedFields) {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === Number(id));
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        ...updatedFields,
        monthly_fee: Number(updatedFields.monthly_fee || list[idx].monthly_fee)
      };
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
      return list[idx];
    }
    return null;
  }

  deleteStudent(id) {
    let list = this.getStudents();
    list = list.filter(s => s.id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));

    let payments = this.getPayments();
    payments = payments.filter(p => p.student_id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    let extras = this.getExtraCharges();
    extras = extras.filter(e => e.student_id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(extras));
  }

  getStudentsByBoard(boardName) {
    const list = this.getStudents();
    if (!boardName || boardName === 'All') return list;
    return list.filter(s => (s.board || 'CBSE') === boardName);
  }

  // --- PAYMENT TRANSACTIONS ENGINE ---
  getPayments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
  }

  // ALWAYS RETURN PAYMENTS NEWEST-FIRST AT TOP (DESCENDING ID & DATE!)
  getPaymentsByStudent(studentId) {
    const list = this.getPayments();
    return list
      .filter(p => p.student_id === Number(studentId))
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  getPaymentById(id) {
    const list = this.getPayments();
    return list.find(p => p.id === Number(id)) || null;
  }

  // ALWAYS RETURN RECENT PAYMENTS NEWEST-FIRST AT TOP!
  getRecentPayments(limit = 10) {
    const list = this.getPayments();
    const studentsMap = {};
    this.getStudents().forEach(s => { studentsMap[s.id] = s; });

    return list
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, limit)
      .map(p => ({
        ...p,
        student: studentsMap[p.student_id] || { name: 'Student', class: '' }
      }));
  }

  recordPayment(paymentData) {
    const list = this.getPayments();
    const newPayment = {
      id: Date.now(),
      student_id: Number(paymentData.student_id),
      month: paymentData.month || MONTH_NAMES[new Date().getMonth()],
      year: Number(paymentData.year || new Date().getFullYear()),
      monthly_fee: Number(paymentData.monthly_fee || 0),
      paid_amount: Number(paymentData.paid_amount || 0),
      remaining_amount: Number(paymentData.remaining_amount || 0),
      advance_amount: Number(paymentData.advance_amount || 0),
      extra_item_name: paymentData.extra_item_name || '',
      extra_charge_amount: Number(paymentData.extra_charge_amount || 0),
      payment_mode: paymentData.payment_mode || 'Cash',
      payment_date: paymentData.payment_date || new Date().toISOString()
    };

    list.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(list));
    return newPayment;
  }

  deletePayment(paymentId) {
    let list = this.getPayments();
    list = list.filter(p => p.id !== Number(paymentId));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(list));
  }

  // --- KHATABOOK EXTRA CHARGES ENGINE ---
  getExtraCharges() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXTRA_CHARGES) || '[]');
  }

  // ALWAYS RETURN EXTRA CHARGES NEWEST-FIRST AT TOP!
  getExtraChargesByStudent(studentId) {
    const list = this.getExtraCharges();
    return list
      .filter(e => e.student_id === Number(studentId))
      .sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  addExtraCharge(chargeData) {
    const list = this.getExtraCharges();
    const newCharge = {
      id: Date.now(),
      student_id: Number(chargeData.student_id),
      item_name: chargeData.item_name.trim(),
      amount: Number(chargeData.amount || 0),
      added_date: chargeData.added_date || new Date().toISOString().split('T')[0],
      status: 'UNPAID',
      cleared_date: null,
      payment_mode: null
    };

    list.push(newCharge);
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(list));
    return newCharge;
  }

  clearExtraCharge(chargeId, paymentMode = 'Cash') {
    const list = this.getExtraCharges();
    const idx = list.findIndex(c => c.id === Number(chargeId));
    if (idx !== -1) {
      list[idx].status = 'PAID';
      list[idx].cleared_date = new Date().toISOString().split('T')[0];
      list[idx].payment_mode = paymentMode;
      localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(list));

      const charge = list[idx];
      const pmt = this.recordPayment({
        student_id: charge.student_id,
        month: MONTH_NAMES[new Date().getMonth()],
        year: new Date().getFullYear(),
        monthly_fee: 0,
        paid_amount: 0,
        remaining_amount: 0,
        advance_amount: 0,
        extra_item_name: charge.item_name,
        extra_charge_amount: charge.amount,
        payment_mode: paymentMode,
        payment_date: new Date().toISOString()
      });

      return { charge: list[idx], payment: pmt };
    }
    return null;
  }

  // --- REFINED CRYSTAL-CLEAR COACHING CYCLE FINANCIAL ENGINE ---
  calculateStudentFinancials(studentId, referenceDate = new Date()) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const payments = this.getPaymentsByStudent(studentId);
    const extraCharges = this.getExtraChargesByStudent(studentId);

    const unpaidKhataItems = extraCharges.filter(c => c.status === 'UNPAID');
    const unpaidKhataTotal = unpaidKhataItems.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const joiningDate = new Date(student.joining_date);

    // Total tuition fee paid by student
    const totalPaidPool = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);
    const monthsPaid = Math.floor(totalPaidPool / student.monthly_fee);

    // Calculate exact Next Due Date = joining_date + (monthsPaid + 1) months!
    const nextDueDate = this.addMonthsToDate(joiningDate, monthsPaid + 1);
    
    // Calculate current cycle start date = joining_date + monthsPaid months
    const cycleStartDate = this.addMonthsToDate(joiningDate, monthsPaid);

    const cyclePeriodStr = `${this.formatDisplayDate(cycleStartDate.toISOString())} ➔ ${this.formatDisplayDate(nextDueDate.toISOString())}`;
    const nextDueStr = this.formatDisplayDate(nextDueDate.toISOString());

    // Completed 1-month billing cycles since joining
    let elapsedMonths = (referenceDate.getFullYear() - joiningDate.getFullYear()) * 12 + (referenceDate.getMonth() - joiningDate.getMonth());
    if (referenceDate.getDate() < joiningDate.getDate()) {
      elapsedMonths--;
    }
    elapsedMonths = Math.max(0, elapsedMonths);

    // Total fee accumulated up to current active cycle
    const accumulatedRequiredFee = (elapsedMonths + 1) * student.monthly_fee;

    let dueStatus = 'UPCOMING';
    let totalCurrentDue = 0;

    const refDayZero = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const nextDueDayZero = new Date(nextDueDate.getFullYear(), nextDueDate.getMonth(), nextDueDate.getDate());

    if (totalPaidPool >= accumulatedRequiredFee) {
      dueStatus = 'PAID';
      totalCurrentDue = 0;
    } else if (refDayZero < nextDueDayZero) {
      // Student is inside active month cycle before next due date!
      dueStatus = (refDayZero.getTime() === joiningDate.getTime() && totalPaidPool === 0) ? 'DUE TODAY' : 'UPCOMING';
      totalCurrentDue = student.monthly_fee - (totalPaidPool % student.monthly_fee);
    } else {
      // Past next due date -> OVERDUE (Pending Dues)!
      dueStatus = 'OVERDUE';
      totalCurrentDue = accumulatedRequiredFee - totalPaidPool;
    }

    // Build Month-by-Month Baseline Audit
    const totalCyclesToAudit = Math.max(1, elapsedMonths + 1);
    const monthDetails = [];
    let remainingPaidPool = totalPaidPool;

    for (let i = 0; i < totalCyclesToAudit; i++) {
      const cycleStart = this.addMonthsToDate(joiningDate, i);
      const cycleEnd = this.addMonthsToDate(joiningDate, i + 1);
      const baseFee = student.monthly_fee;

      let isPaid = false;
      let paidThisCycle = 0;
      let remainingThisCycle = baseFee;

      if (remainingPaidPool >= baseFee) {
        paidThisCycle = baseFee;
        remainingThisCycle = 0;
        isPaid = true;
        remainingPaidPool -= baseFee;
      } else {
        paidThisCycle = remainingPaidPool;
        remainingThisCycle = Math.max(0, baseFee - remainingPaidPool);
        isPaid = (remainingThisCycle === 0);
        remainingPaidPool = 0;
      }

      const cycleLabel = `${this.formatDisplayDate(cycleStart.toISOString())} - ${this.formatDisplayDate(cycleEnd.toISOString())}`;

      monthDetails.push({
        year: cycleStart.getFullYear(),
        monthName: MONTH_NAMES[cycleStart.getMonth()],
        cycleLabel,
        baseFee,
        paidAmount: paidThisCycle,
        remainingBalance: remainingThisCycle,
        isPaid
      });
    }

    return {
      student,
      billingMonths: monthDetails,
      totalPaidPool,
      fullMonthsPaidCount: monthsPaid,
      completedCyclesCount: elapsedMonths,
      cyclePeriodStr,
      cycleNextRenewal: nextDueStr,
      totalCurrentDue,
      dueStatus,
      unpaidKhataItems,
      unpaidKhataTotal,
      extraCharges
    };
  }

  // Safe Month Addition Utility
  addMonthsToDate(baseDate, monthsToAdd) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    let targetMonthIdx = month + monthsToAdd;
    let targetYear = year + Math.floor(targetMonthIdx / 12);
    targetMonthIdx = (targetMonthIdx % 12 + 12) % 12;

    const maxDaysInTargetMonth = new Date(targetYear, targetMonthIdx + 1, 0).getDate();
    const targetDay = Math.min(day, maxDaysInTargetMonth);

    return new Date(targetYear, targetMonthIdx, targetDay);
  }

  formatDisplayDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      const day = String(d.getDate()).padStart(2, '0');
      const monthShort = MONTH_NAMES[d.getMonth()].substring(0, 3);
      const year = d.getFullYear();
      return `${day} ${monthShort} ${year}`;
    } catch (e) {
      return isoStr;
    }
  }

  getDashboardMetrics() {
    const students = this.getStudents();
    const activeStudentsList = students.filter(s => s.status === 'Active');
    const totalStudents = students.length;
    const activeStudents = activeStudentsList.length;

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentMonthName = MONTH_NAMES[currentMonthIdx];
    const currentYear = now.getFullYear();

    const payments = this.getPayments();
    const extraCharges = this.getExtraCharges();

    // Collection calculations
    const thisMonthCollection = payments
      .filter(p => p.year === currentYear && p.month === currentMonthName)
      .reduce((sum, p) => sum + p.paid_amount + (p.extra_charge_amount || 0), 0);

    const thisYearCollection = payments
      .filter(p => p.year === currentYear)
      .reduce((sum, p) => sum + p.paid_amount + (p.extra_charge_amount || 0), 0);

    // Aggregate Pending Dues calculation
    let totalAggregateDue = 0;
    const pendingStudentsList = [];

    students.forEach(s => {
      const fin = this.calculateStudentFinancials(s.id);
      if (fin && fin.dueStatus === 'OVERDUE' && fin.totalCurrentDue > 0) {
        totalAggregateDue += fin.totalCurrentDue;
        pendingStudentsList.push({
          student: s,
          totalCurrentDue: fin.totalCurrentDue,
          pendingMonths: fin.billingMonths.filter(bm => !bm.isPaid)
        });
      }
    });

    // Board counts
    const boardCounts = {
      'CBSE': 0,
      'State Board': 0,
      'ICSE': 0,
      'Other': 0
    };

    students.forEach(s => {
      const b = s.board || 'CBSE';
      if (boardCounts.hasOwnProperty(b)) {
        boardCounts[b]++;
      } else {
        boardCounts['Other']++;
      }
    });

    return {
      totalStudents,
      activeStudents,
      thisMonthCollection,
      thisYearCollection,
      totalAggregateDue,
      pendingStudentsCount: pendingStudentsList.length,
      pendingStudentsList,
      boardCounts
    };
  }

  getMonthlyRevenueTrend(year = new Date().getFullYear()) {
    const payments = this.getPayments();
    const trend = MONTH_NAMES.map((m, idx) => ({
      month: m.substring(0, 3),
      monthFull: m,
      monthIdx: idx,
      Cash: 0,
      Online: 0,
      Total: 0
    }));

    payments.filter(p => p.year === year).forEach(p => {
      const idx = MONTH_NAMES.indexOf(p.month);
      if (idx !== -1) {
        const amt = p.paid_amount + (p.extra_charge_amount || 0);
        if (p.payment_mode === 'Online') {
          trend[idx].Online += amt;
        } else {
          trend[idx].Cash += amt;
        }
        trend[idx].Total += amt;
      }
    });

    return trend;
  }

  exportBackupJSON() {
    const data = {
      app: 'Anshu Coaching Classes Portal',
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      students: this.getStudents(),
      payments: this.getPayments(),
      extraCharges: this.getExtraCharges()
    };
    return JSON.stringify(data, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data && Array.isArray(data.students) && Array.isArray(data.payments)) {
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(data.payments));
        localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(data.extraCharges || []));
        return { success: true, studentCount: data.students.length };
      }
      return { success: false, error: 'Invalid backup file structure' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_CHARGES);
    this.initDefaultStorage();
  }
}

export const db = new DatabaseEngine();
