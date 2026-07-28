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
    title: 'Notebook / Rough Book',
    amount: 50,
    date: '2026-05-15',
    status: 'Paid',
    paid_with_fee: true
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

    return true;
  }

  // --- Payments CRUD ---
  getPayments() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAYMENTS) || '[]');
  }

  getPaymentsByStudent(studentId) {
    const payments = this.getPayments();
    return payments.filter(p => p.student_id === Number(studentId));
  }

  recordPayment(paymentData) {
    const payments = this.getPayments();
    const newPayment = {
      ...paymentData,
      id: Date.now(),
      student_id: Number(paymentData.student_id),
      monthly_fee: Number(paymentData.monthly_fee),
      paid_amount: Number(paymentData.paid_amount),
      remaining_amount: Number(paymentData.remaining_amount || 0),
      year: Number(paymentData.year),
      payment_date: paymentData.payment_date || new Date().toISOString()
    };
    payments.push(newPayment);
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    return newPayment;
  }

  // --- Financial Engine & Month Breakdown ---
  calculateStudentFinancials(studentId, referenceDate = new Date()) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const payments = this.getPaymentsByStudent(studentId);
    const joiningDate = new Date(student.joining_date);
    const refYear = referenceDate.getFullYear();
    const refMonthIdx = referenceDate.getMonth();

    const billingMonths = [];
    let startY = joiningDate.getFullYear();
    let startM = joiningDate.getMonth();

    while (startY < refYear || (startY === refYear && startM <= refMonthIdx)) {
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

    let runningArrears = 0;
    const monthDetails = [];

    billingMonths.forEach(bm => {
      const monthPayment = payments.find(p => p.year === bm.year && p.month === bm.monthName);
      const baseFee = student.monthly_fee;
      const totalPayableThisMonth = baseFee + runningArrears;

      let paid = 0;
      let isPaid = false;
      let remaining = totalPayableThisMonth;

      if (monthPayment) {
        paid = monthPayment.paid_amount;
        remaining = monthPayment.remaining_amount !== undefined ? monthPayment.remaining_amount : Math.max(0, totalPayableThisMonth - paid);
        isPaid = remaining === 0;
        runningArrears = remaining;
      } else {
        runningArrears = totalPayableThisMonth;
      }

      monthDetails.push({
        year: bm.year,
        monthName: bm.monthName,
        baseFee,
        previousArrears: totalPayableThisMonth - baseFee,
        totalPayable: totalPayableThisMonth,
        paidAmount: paid,
        remainingBalance: remaining,
        isPaid,
        paymentRecord: monthPayment || null
      });
    });

    const currentMonthDetail = monthDetails[monthDetails.length - 1] || null;
    const totalCurrentDue = currentMonthDetail ? currentMonthDetail.remainingBalance : 0;

    const joiningDay = joiningDate.getDate();
    const currentDay = referenceDate.getDate();
    let dueStatus = 'UPCOMING';

    if (currentMonthDetail && currentMonthDetail.isPaid) {
      dueStatus = 'PAID';
    } else {
      if (currentDay > joiningDay || monthDetails.filter(m => !m.isPaid).length > 1) {
        dueStatus = 'OVERDUE';
      } else if (currentDay === joiningDay) {
        dueStatus = 'DUE TODAY';
      } else {
        dueStatus = 'UPCOMING';
      }
    }

    return {
      student,
      billingMonths: monthDetails,
      currentArrears: currentMonthDetail ? currentMonthDetail.previousArrears : 0,
      currentMonthPayable: currentMonthDetail ? currentMonthDetail.totalPayable : student.monthly_fee,
      currentMonthPaid: currentMonthDetail ? currentMonthDetail.paidAmount : 0,
      currentMonthRemaining: currentMonthDetail ? currentMonthDetail.remainingBalance : student.monthly_fee,
      totalCurrentDue,
      dueStatus
    };
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

    activeStudentsList.forEach(student => {
      const fin = this.calculateStudentFinancials(student.id, referenceDate);
      if (fin && fin.totalCurrentDue > 0) {
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

    // Board-wise breakdown
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
