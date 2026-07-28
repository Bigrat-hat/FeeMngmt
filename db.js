/**
 * Anshu Coaching Classes - Fees Management System Database & Financial Engine
 * Version: 1.0.0
 */

const STORAGE_KEYS = {
  STUDENTS: 'anshu_coaching_students_v2',
  PAYMENTS: 'anshu_coaching_payments_v2',
  EXTRA_CHARGES: 'anshu_coaching_extra_charges_v2'
};

// Initial Seed Data
const INITIAL_STUDENTS = [
  {
    id: 1,
    name: 'Aarav Sharma',
    gender: 'Male',
    class: 'Class 10',
    school: 'St. Xavier High School',
    board: 'CBSE',
    monthly_fee: 300,
    joining_date: '2026-05-10',
    status: 'Active',
    created_at: '2026-05-10T09:00:00Z'
  },
  {
    id: 2,
    name: 'Ananya Patel',
    gender: 'Female',
    class: 'Class 8',
    school: 'Delhi Public School',
    board: 'CBSE',
    monthly_fee: 280,
    joining_date: '2026-03-05',
    status: 'Active',
    created_at: '2026-03-05T10:30:00Z'
  },
  {
    id: 3,
    name: 'Rohan Gupta',
    gender: 'Male',
    class: 'Class 9',
    school: 'Modern Public Academy',
    board: 'State Board',
    monthly_fee: 350,
    joining_date: '2026-02-01',
    status: 'Active',
    created_at: '2026-02-01T08:15:00Z'
  },
  {
    id: 4,
    name: 'Priya Singh',
    gender: 'Female',
    class: 'Class 5',
    school: 'Sacred Heart Convent',
    board: 'ICSE',
    monthly_fee: 250,
    joining_date: '2026-04-15',
    status: 'Active',
    created_at: '2026-04-15T11:00:00Z'
  },
  {
    id: 5,
    name: 'Vikram Verma',
    gender: 'Male',
    class: 'Class 1',
    school: 'Greenwood Primary',
    board: 'CBSE',
    monthly_fee: 200,
    joining_date: '2026-06-01',
    status: 'Active',
    created_at: '2026-06-01T09:45:00Z'
  },
  {
    id: 6,
    name: 'Ishaan Verma',
    gender: 'Male',
    class: 'Class 3',
    school: 'Apex Primary',
    board: 'CBSE',
    monthly_fee: 220,
    joining_date: '2026-05-01',
    status: 'Active',
    created_at: '2026-05-01T10:00:00Z'
  },
  {
    id: 7,
    name: 'Diya Roy',
    gender: 'Female',
    class: 'Class 7',
    school: 'National Excellence School',
    board: 'CBSE',
    monthly_fee: 270,
    joining_date: '2026-01-10',
    status: 'Active',
    created_at: '2026-01-10T14:20:00Z'
  },
  {
    id: 8,
    name: 'Kabir Mehta',
    gender: 'Male',
    class: 'Class 6',
    school: 'St. Jude School',
    board: 'ICSE',
    monthly_fee: 260,
    joining_date: '2026-04-01',
    status: 'Active',
    created_at: '2026-04-01T10:00:00Z'
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 101,
    student_id: 1,
    month: 'May',
    year: 2026,
    monthly_fee: 300,
    paid_amount: 250,
    remaining_amount: 50,
    payment_mode: 'Cash',
    payment_date: '2026-05-12T10:00:00Z'
  },
  {
    id: 102,
    student_id: 2,
    month: 'May',
    year: 2026,
    monthly_fee: 280,
    paid_amount: 280,
    remaining_amount: 0,
    payment_mode: 'Online',
    payment_date: '2026-05-05T09:30:00Z'
  },
  {
    id: 103,
    student_id: 2,
    month: 'June',
    year: 2026,
    monthly_fee: 280,
    paid_amount: 280,
    remaining_amount: 0,
    payment_mode: 'Online',
    payment_date: '2026-06-05T09:30:00Z'
  },
  {
    id: 104,
    student_id: 2,
    month: 'July',
    year: 2026,
    monthly_fee: 280,
    paid_amount: 280,
    remaining_amount: 0,
    payment_mode: 'Cash',
    payment_date: '2026-07-05T10:15:00Z'
  }
];

const INITIAL_EXTRA_CHARGES = [
  {
    id: 201,
    student_id: 1,
    item_name: 'Rough Book',
    amount: 50,
    added_date: '2026-05-15',
    status: 'UNPAID'
  }
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class DBService {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      this.resetToDefaults();
    }
  }

  resetToDefaults() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(INITIAL_EXTRA_CHARGES));
  }

  // --- Export & Import Backup System ---
  exportBackupJSON() {
    const backupData = {
      app_name: 'Anshu Coaching Classes Fee Portal',
      version: '1.0.0',
      export_timestamp: new Date().toISOString(),
      students: this.getStudents(),
      payments: this.getPayments(),
      extra_charges: this.getExtraCharges()
    };
    return JSON.stringify(backupData, null, 2);
  }

  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.students)) {
        throw new Error('Invalid backup file structure.');
      }
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(parsed.students || []));
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(parsed.payments || []));
      localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(parsed.extra_charges || []));
      return { success: true, studentCount: (parsed.students || []).length };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // --- Students CRUD ---
  getStudents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  }

  getStudentById(id) {
    const students = this.getStudents();
    return students.find(s => s.id === Number(id));
  }

  getStudentsByBoard(boardName) {
    const students = this.getStudents();
    return students.filter(s => s.status === 'Active' && (s.board === boardName || (!s.board && boardName === 'State Board')));
  }

  addStudent(studentData) {
    const students = this.getStudents();
    const newStudent = {
      ...studentData,
      id: Date.now(),
      monthly_fee: Number(studentData.monthly_fee),
      status: studentData.status || 'Active',
      created_at: new Date().toISOString()
    };
    students.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return newStudent;
  }

  updateStudent(id, updatedFields) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.id === Number(id));
    if (index !== -1) {
      students[index] = { ...students[index], ...updatedFields };
      if (updatedFields.monthly_fee) students[index].monthly_fee = Number(updatedFields.monthly_fee);
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      return students[index];
    }
    return null;
  }

  deleteStudent(id) {
    let students = this.getStudents();
    students = students.filter(s => s.id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    let payments = this.getPayments();
    payments = payments.filter(p => p.student_id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    let charges = this.getExtraCharges();
    charges = charges.filter(c => c.student_id !== Number(id));
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(charges));

    return true;
  }

  // --- Khatabook / Extra Charges Ledger ---
  getExtraCharges() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXTRA_CHARGES) || '[]');
  }

  getExtraChargesByStudent(studentId) {
    const charges = this.getExtraCharges();
    const studentCharges = charges.filter(c => c.student_id === Number(studentId));
    // Sort newest extra charges first!
    return studentCharges.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  addExtraCharge({ student_id, item_name, amount, added_date }) {
    const charges = this.getExtraCharges();
    const newCharge = {
      id: Date.now(),
      student_id: Number(student_id),
      item_name: item_name.trim(),
      amount: Number(amount),
      added_date: added_date || new Date().toISOString().split('T')[0],
      status: 'UNPAID',
      created_at: new Date().toISOString()
    };
    charges.push(newCharge);
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(charges));
    return newCharge;
  }

  clearExtraCharge(chargeId, paymentMode = 'Cash') {
    const charges = this.getExtraCharges();
    const index = charges.findIndex(c => c.id === Number(chargeId));
    if (index !== -1) {
      const charge = charges[index];
      charge.status = 'PAID';
      charge.paid_date = new Date().toISOString();
      charge.payment_mode = paymentMode;
      localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(charges));

      const student = this.getStudentById(charge.student_id);
      const now = new Date();

      const payment = this.recordPayment({
        student_id: charge.student_id,
        month: MONTH_NAMES[now.getMonth()],
        year: now.getFullYear(),
        monthly_fee: student ? student.monthly_fee : 0,
        paid_amount: 0,
        remaining_amount: 0,
        extra_item_name: charge.item_name,
        extra_charge_amount: charge.amount,
        payment_mode: paymentMode,
        payment_date: new Date().toISOString()
      });

      return { charge, payment };
    }
    return null;
  }

  deleteExtraCharge(chargeId) {
    let charges = this.getExtraCharges();
    charges = charges.filter(c => c.id !== Number(chargeId));
    localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(charges));
    return true;
  }

  // --- Payments, Receipts & Mistaken Payment Cancellation (ALWAYS NEWEST FIRST AT TOP!) ---
  getPayments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
  }

  getPaymentById(paymentId) {
    const payments = this.getPayments();
    return payments.find(p => p.id === Number(paymentId));
  }

  getPaymentsByStudent(studentId) {
    const payments = this.getPayments();
    const studentPmts = payments.filter(p => p.student_id === Number(studentId));
    // ALWAYS SORT NEWEST FIRST (TOP POSITION) BY ID & DATE!
    return studentPmts.sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      if (idA !== idB) return idB - idA;
      const dateA = new Date(a.payment_date || a.created_at || 0);
      const dateB = new Date(b.payment_date || b.created_at || 0);
      return dateB - dateA;
    });
  }

  getRecentPayments(limit = 10) {
    const payments = this.getPayments();
    const students = this.getStudents();
    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    // ALWAYS SORT NEWEST FIRST (TOP POSITION) BY ID & DATE!
    const sorted = [...payments].sort((a, b) => {
      const idA = a.id || 0;
      const idB = b.id || 0;
      if (idA !== idB) return idB - idA;
      const dateA = new Date(a.payment_date || a.created_at || 0);
      const dateB = new Date(b.payment_date || b.created_at || 0);
      return dateB - dateA;
    });

    return sorted.slice(0, limit).map(p => ({
      ...p,
      student: studentMap[p.student_id] || { name: 'Unknown Student', class: '' }
    }));
  }

  recordPayment(paymentData) {
    const paidAmt = Number(paymentData.paid_amount || 0);
    const extraItemAmt = Number(paymentData.extra_charge_amount || 0);

    if (paidAmt <= 0 && extraItemAmt <= 0) {
      return null;
    }

    const payments = this.getPayments();
    const newPayment = {
      ...paymentData,
      id: Date.now(),
      student_id: Number(paymentData.student_id),
      monthly_fee: Number(paymentData.monthly_fee),
      paid_amount: paidAmt,
      remaining_amount: Number(paymentData.remaining_amount || 0),
      advance_amount: Number(paymentData.advance_amount || 0),
      extra_item_name: paymentData.extra_item_name || '',
      extra_charge_amount: extraItemAmt,
      year: Number(paymentData.year),
      payment_mode: paymentData.payment_mode || 'Cash',
      payment_date: paymentData.payment_date || new Date().toISOString()
    };
    payments.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    return newPayment;
  }

  deletePayment(paymentId) {
    let payments = this.getPayments();
    const targetPayment = payments.find(p => p.id === Number(paymentId));
    if (!targetPayment) return false;

    // Filter out target payment
    payments = payments.filter(p => p.id !== Number(paymentId));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

    // If this payment was clearing an extra charge item, revert that item back to UNPAID in Khatabook!
    if (targetPayment.extra_item_name) {
      let charges = this.getExtraCharges();
      const matchIdx = charges.findIndex(c => c.student_id === targetPayment.student_id && c.item_name === targetPayment.extra_item_name && c.status === 'PAID');
      if (matchIdx !== -1) {
        charges[matchIdx].status = 'UNPAID';
        delete charges[matchIdx].paid_date;
        delete charges[matchIdx].payment_mode;
        localStorage.setItem(STORAGE_KEYS.EXTRA_CHARGES, JSON.stringify(charges));
      }
    }

    return true;
  }

  // --- SMART FINANCIAL ENGINE: 1-Month Cycle Grace Period for New Students ---
  calculateStudentFinancials(studentId, referenceDate = new Date()) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const payments = this.getPaymentsByStudent(studentId);
    const extraCharges = this.getExtraChargesByStudent(studentId);

    const unpaidKhataItems = extraCharges.filter(c => c.status === 'UNPAID');
    const unpaidKhataTotal = unpaidKhataItems.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const joiningDate = new Date(student.joining_date);
    const refYear = referenceDate.getFullYear();
    const refMonthIdx = referenceDate.getMonth();
    const refDay = referenceDate.getDate();

    const joiningDay = joiningDate.getDate();

    // Calculate completed 1-month billing cycles
    // A 1-month cycle completes ONLY when reference date passes joiningDay of the subsequent month!
    let completedCyclesCount = (refYear - joiningDate.getFullYear()) * 12 + (refMonthIdx - joiningDate.getMonth());
    if (refDay < joiningDay) {
      completedCyclesCount--;
    }
    completedCyclesCount = Math.max(0, completedCyclesCount);

    const billingMonths = [];
    let startY = joiningDate.getFullYear();
    let startM = joiningDate.getMonth();

    // Build month cycle audit breakdown list
    const totalCyclesToAudit = Math.max(1, completedCyclesCount + (refDay >= joiningDay ? 1 : 0));
    for (let i = 0; i < totalCyclesToAudit; i++) {
      billingMonths.push({
        year: startY,
        monthIdx: startM,
        monthName: MONTH_NAMES[startM]
      });

      startM++;
      if (startM > 11) {
        startM = 0;
        startY++;
      }
    }

    // Past completed cycles fee requirement vs Active ongoing cycle fee requirement
    const pastCompletedFeeRequirement = completedCyclesCount * student.monthly_fee;
    const activeCycleFeeRequirement = (completedCyclesCount + 1) * student.monthly_fee;

    const totalPaidPool = payments.reduce((sum, p) => sum + Number(p.paid_amount || 0), 0);

    const advanceBalance = Math.max(0, totalPaidPool - activeCycleFeeRequirement);
    let totalCurrentDue = 0;
    let dueStatus = 'UPCOMING';

    if (totalPaidPool >= activeCycleFeeRequirement) {
      dueStatus = 'PAID';
      totalCurrentDue = 0;
    } else if (totalPaidPool >= pastCompletedFeeRequirement) {
      // Student has paid for all COMPLETED past cycles! Currently inside active 1-month grace cycle!
      dueStatus = (refDay === joiningDay) ? 'DUE TODAY' : 'UPCOMING';
      totalCurrentDue = activeCycleFeeRequirement - totalPaidPool;
    } else {
      // Student has unpaid COMPLETED past cycles -> OVERDUE (Pending Dues)!
      dueStatus = 'OVERDUE';
      totalCurrentDue = activeCycleFeeRequirement - totalPaidPool;
    }

    const fullMonthsPaidCount = Math.floor(totalPaidPool / student.monthly_fee);
    const cycleInfo = this.calculateCyclePaidUntilDate(student.joining_date, fullMonthsPaidCount);

    let remainingPaidPool = totalPaidPool;
    const monthDetails = [];

    billingMonths.forEach((bm, idx) => {
      const baseFee = student.monthly_fee;
      let paidThisMonth = 0;
      let remainingThisMonth = baseFee;
      let isPaid = false;

      let matchingPmt = payments.find(p => p.year === bm.year && p.month === bm.monthName);
      if (!matchingPmt && payments.length > idx) {
        matchingPmt = payments[idx];
      }

      if (remainingPaidPool >= baseFee) {
        paidThisMonth = baseFee;
        remainingThisMonth = 0;
        isPaid = true;
        remainingPaidPool -= baseFee;
      } else {
        paidThisMonth = remainingPaidPool;
        remainingThisMonth = Math.max(0, baseFee - remainingPaidPool);
        isPaid = (remainingThisMonth === 0);
        remainingPaidPool = 0;
      }

      const pmtDateRaw = matchingPmt ? (matchingPmt.payment_date || matchingPmt.created_at) : null;
      const pmtMode = matchingPmt ? matchingPmt.payment_mode : 'Cash';

      monthDetails.push({
        year: bm.year,
        monthName: bm.monthName,
        baseFee,
        paidAmount: paidThisMonth,
        remainingBalance: remainingThisMonth,
        isPaid,
        paymentDate: pmtDateRaw ? this.formatDisplayDate(pmtDateRaw) : null,
        paymentMode: pmtMode,
        paymentRecord: matchingPmt || null
      });
    });

    const currentMonthDetail = monthDetails[monthDetails.length - 1] || null;

    return {
      student,
      billingMonths: monthDetails,
      totalAccumulatedFee: activeCycleFeeRequirement,
      totalPaidPool,
      fullMonthsPaidCount,
      completedCyclesCount,
      cyclePaidUntil: cycleInfo.paidUntilStr,
      cycleNextRenewal: cycleInfo.renewalStr,
      advanceBalance,
      currentArrears: Math.max(0, totalCurrentDue - (currentMonthDetail ? currentMonthDetail.baseFee : 0)),
      currentMonthPayable: totalCurrentDue,
      currentMonthPaid: currentMonthDetail ? currentMonthDetail.paidAmount : 0,
      currentMonthRemaining: totalCurrentDue,
      totalCurrentDue,
      dueStatus,
      unpaidKhataItems,
      unpaidKhataTotal,
      extraCharges
    };
  }

  calculateCyclePaidUntilDate(joiningDateStr, monthsPaid) {
    if (!joiningDateStr) return { paidUntilStr: '', renewalStr: '' };
    const j = new Date(joiningDateStr);
    let y = j.getFullYear();
    let m = j.getMonth() + monthsPaid;
    while (m > 11) {
      m -= 12;
      y += 1;
    }
    const day = j.getDate();

    const maxDays = new Date(y, m + 1, 0).getDate();
    const renewalDay = Math.min(day, maxDays);

    const renewalDate = new Date(y, m, renewalDay);
    const paidUntilDate = new Date(renewalDate.getTime() - 86400000);

    return {
      paidUntilStr: this.formatDisplayDate(paidUntilDate.toISOString()),
      renewalStr: this.formatDisplayDate(renewalDate.toISOString())
    };
  }

  formatDisplayDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${monthsShort[d.getMonth()]} ${d.getFullYear()}`;
  }

  getDashboardMetrics(referenceDate = new Date()) {
    const students = this.getStudents();
    const payments = this.getPayments();

    const currentYear = referenceDate.getFullYear();
    const currentMonthName = MONTH_NAMES[referenceDate.getMonth()];

    const totalStudents = students.length;
    const activeStudentsList = students.filter(s => s.status === 'Active');
    const activeStudents = activeStudentsList.length;

    let thisMonthCollection = 0;
    let thisYearCollection = 0;

    payments.forEach(p => {
      if (p.year === currentYear) {
        thisYearCollection += p.paid_amount;
        if (p.month === currentMonthName) {
          thisMonthCollection += p.paid_amount;
        }
      }
    });

    let pendingStudentsCount = 0;
    let totalAggregateDue = 0;
    const pendingStudentsList = [];

    // ONLY COUNT STUDENTS WHOSE COMPLETED MONTH CYCLES ARE UNPAID (dueStatus === 'OVERDUE')!
    students.forEach(student => {
      const fin = this.calculateStudentFinancials(student.id, referenceDate);
      if (fin && fin.totalCurrentDue > 0 && fin.dueStatus === 'OVERDUE') {
        pendingStudentsCount++;
        totalAggregateDue += fin.totalCurrentDue;
        pendingStudentsList.push({
          student,
          totalCurrentDue: fin.totalCurrentDue,
          dueStatus: fin.dueStatus,
          pendingMonths: fin.billingMonths.filter(m => !m.isPaid)
        });
      }
    });

    const boardCounts = {
      'CBSE': 0,
      'State Board': 0,
      'ICSE': 0,
      'Other': 0
    };

    activeStudentsList.forEach(s => {
      const b = s.board || 'State Board';
      if (boardCounts[b] !== undefined) {
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
      pendingStudentsCount,
      totalAggregateDue,
      pendingStudentsList,
      boardCounts
    };
  }

  getMonthlyRevenueTrend(year = new Date().getFullYear()) {
    const payments = this.getPayments();
    const trend = MONTH_NAMES.map(month => ({
      month: month.substring(0, 3),
      Cash: 0,
      Online: 0,
      Total: 0
    }));

    payments.forEach(p => {
      if (p.year === year) {
        const idx = MONTH_NAMES.indexOf(p.month);
        if (idx !== -1) {
          if (p.payment_mode === 'Cash') {
            trend[idx].Cash += p.paid_amount;
          } else {
            trend[idx].Online += p.paid_amount;
          }
          trend[idx].Total += p.paid_amount;
        }
      }
    });

    return trend;
  }
}

export const db = new DBService();
