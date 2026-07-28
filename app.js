import { db, MONTH_NAMES } from './db.js';

// Application State
let isLoggedIn = localStorage.getItem('anshu_admin_logged_in') === 'true';
let currentTab = 'dashboard';
let searchQuery = '';
let selectedStudentForCollect = null;
let profileStudentId = null;
let editStudentId = null;
let selectedCalendarDay = null;
let selectedBoardForList = null;
let activeModal = null; // 'add-student', 'edit-student', 'collect-fee', 'student-profile', 'pending-list', 'board-list', 'calendar-day', 'receipt'
let receiptData = null;

// Initialize Application, PWA Service Worker & Back Button Lock
document.addEventListener('DOMContentLoaded', () => {
  initHistoryLock();
  renderCurrentTab();
  updateNavActiveState();
  initPWA();
});

// PWA Back Button Lock
function initHistoryLock() {
  history.pushState(null, '', location.href);
  window.onpopstate = function() {
    history.pushState(null, '', location.href);
    if (activeModal) {
      closeModal();
    }
  };
}

// Auto-Update PWA Service Worker Handler
function initPWA() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      reg.update();
    }).catch(err => console.log('PWA ServiceWorker registration notice:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

// Global Tab Switcher
window.switchTab = function(tabName) {
  if (currentTab === tabName) return;
  currentTab = tabName;
  updateNavActiveState();
  renderCurrentTab();
};

function updateNavActiveState() {
  const navItems = document.querySelectorAll('.fixed-bottom-nav .nav-item');
  navItems.forEach(btn => {
    const isTarget = btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${currentTab}'`);
    if (isTarget) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function renderCurrentTab() {
  const contentEl = document.getElementById('tab-content');
  const navEl = document.querySelector('.fixed-bottom-nav');
  const headerEl = document.querySelector('.app-header');
  if (!contentEl) return;

  if (!isLoggedIn) {
    if (navEl) navEl.style.display = 'none';
    if (headerEl) headerEl.style.display = 'none';
    contentEl.innerHTML = renderAdminLoginView();
    return;
  }

  if (navEl) navEl.style.display = 'flex';
  if (headerEl) headerEl.style.display = 'flex';

  const metrics = db.getDashboardMetrics();
  const students = db.getStudents();

  switch (currentTab) {
    case 'dashboard':
      contentEl.innerHTML = renderDashboardView(metrics);
      setTimeout(initDashboardCharts, 50);
      break;
    case 'students':
      contentEl.innerHTML = renderStudentsView(students);
      break;
    case 'collect':
      contentEl.innerHTML = renderCollectFeesView(students);
      break;
    case 'calendar':
      contentEl.innerHTML = renderCalendarView(students);
      break;
    default:
      contentEl.innerHTML = renderDashboardView(metrics);
      setTimeout(initDashboardCharts, 50);
  }

  renderActiveModal();
}

// --- Admin Login Screen (Password Only: anshuu) ---
function renderAdminLoginView() {
  return `
    <div style="display:flex; flex-direction:column; justify-content:center; min-height:100%; padding:20px 10px;">
      
      <div style="text-align:center; margin-bottom:28px;">
        <div class="brand-icon" style="width:60px; height:60px; font-size:28px; border-radius:18px; margin:0 auto 12px auto; box-shadow:0 12px 28px rgba(37,75,51,0.25);">A</div>
        <h1 style="font-size:24px; font-weight:800; color:var(--emerald-950);">Anshu Coaching Classes</h1>
        <p style="font-size:13px; color:var(--emerald-600); font-weight:700; margin-top:2px;">VIP Fee Management Portal ✨</p>
      </div>

      <div class="glass-card" style="padding:22px; border-radius:24px;">
        <h3 style="font-size:15px; font-weight:800; color:var(--emerald-950); margin-bottom:14px; text-align:center;">Enter Admin Password</h3>

        <form onsubmit="handleAdminLoginSubmit(event)">
          <div class="form-group">
            <input type="password" id="loginPassword" class="form-control" style="text-align:center; font-size:16px; padding:12px;" value="anshuu" required placeholder="••••••••" />
          </div>

          <div id="loginErrorMsg" style="color:var(--status-overdue-text); font-size:11px; font-weight:700; margin-bottom:10px; text-align:center; display:none;">
            Incorrect Password!
          </div>

          <button type="submit" class="btn-primary" style="width:100%; padding:12px; font-size:14px; margin-top:6px;">
            Log In ➔
          </button>
        </form>
      </div>

      <div style="text-align:center; margin-top:20px; font-size:10px; color:var(--emerald-600);">
        Anshu Coaching Classes VIP Edition v1.0.0
      </div>

    </div>
  `;
}

window.handleAdminLoginSubmit = function(e) {
  e.preventDefault();
  const p = document.getElementById('loginPassword').value;

  if (p.trim() === 'anshuu') {
    isLoggedIn = true;
    localStorage.setItem('anshu_admin_logged_in', 'true');
    renderCurrentTab();
  } else {
    const err = document.getElementById('loginErrorMsg');
    if (err) err.style.display = 'block';
  }
};

window.handleAdminLogout = function() {
  if (confirm('Log out from Anshu Coaching Admin Portal?')) {
    isLoggedIn = false;
    localStorage.removeItem('anshu_admin_logged_in');
    currentTab = 'dashboard';
    renderCurrentTab();
  }
};

// Modal Trigger Helpers
window.openModal = function(modalName, payload = null) {
  activeModal = modalName;
  if (modalName === 'collect-fee' && payload) {
    selectedStudentForCollect = payload;
  }
  if (modalName === 'student-profile' && payload) {
    profileStudentId = payload;
  }
  if (modalName === 'edit-student' && payload) {
    editStudentId = payload;
  }
  if (modalName === 'calendar-day' && payload) {
    selectedCalendarDay = payload;
  }
  if (modalName === 'board-list' && payload) {
    selectedBoardForList = payload;
  }
  renderActiveModal();
};

window.closeModal = function() {
  activeModal = null;
  selectedStudentForCollect = null;
  profileStudentId = null;
  editStudentId = null;
  selectedCalendarDay = null;
  selectedBoardForList = null;
  receiptData = null;
  renderActiveModal();
};

// --- 1. Dashboard View (Real-Time Dynamic Month & Year) ---
function renderDashboardView(metrics) {
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

  return `
    <!-- 2x2 Metric Grid -->
    <div class="metrics-grid-2x2">
      <div class="glass-card metric-card-compact">
        <div class="metric-lbl">ACTIVE STUDENTS</div>
        <div class="metric-val">${metrics.activeStudents} <span style="font-size:12px; color:var(--emerald-600);">/ ${metrics.totalStudents}</span></div>
        <div class="metric-sub">Enrolled Students</div>
      </div>

      <div class="glass-card metric-card-compact">
        <div class="metric-lbl">THIS MONTH</div>
        <div class="metric-val">₹${metrics.thisMonthCollection}</div>
        <div class="metric-sub">${currentMonthName} Collection</div>
      </div>

      <div class="glass-card metric-card-compact">
        <div class="metric-lbl">THIS YEAR</div>
        <div class="metric-val">₹${metrics.thisYearCollection}</div>
        <div class="metric-sub">Fiscal YTD (${currentYear})</div>
      </div>

      <!-- Clickable Pending Dues Card -->
      <div class="glass-card metric-card-compact clickable-card" onclick="openModal('pending-list')" style="border:1.5px solid rgba(220, 38, 38, 0.45); background:rgba(254, 242, 242, 0.95);">
        <div class="metric-lbl" style="color:var(--status-overdue-text);">PENDING DUES 🔍</div>
        <div class="metric-val" style="color:var(--status-overdue-text)">₹${metrics.totalAggregateDue}</div>
        <div class="metric-sub" style="font-weight:700; color:var(--status-overdue-text);">${metrics.pendingStudentsCount} Students (Tap for list)</div>
      </div>
    </div>

    <!-- Board-Wise Student Count Breakdown Section -->
    <div class="glass-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <h3 style="font-size:13px; font-weight:800; color:var(--emerald-950);">Board-Wise Student Count</h3>
        <span style="font-size:10px; color:var(--emerald-600); font-weight:700;">💡 Tap to view list</span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div class="clickable-card" onclick="openModal('board-list', 'CBSE')" style="padding:10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px;">
          <div style="font-size:10px; font-weight:800; color:var(--emerald-600);">CBSE BOARD</div>
          <div style="font-size:18px; font-weight:800; color:var(--emerald-950); margin-top:2px;">
            ${metrics.boardCounts['CBSE'] || 0} <span style="font-size:10px; font-weight:600; color:var(--emerald-600);">Students</span>
          </div>
          <div style="font-size:9px; color:var(--emerald-600); margin-top:2px; font-weight:700;">Tap to view ➔</div>
        </div>

        <div class="clickable-card" onclick="openModal('board-list', 'State Board')" style="padding:10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px;">
          <div style="font-size:10px; font-weight:800; color:var(--emerald-600);">STATE / MP BOARD</div>
          <div style="font-size:18px; font-weight:800; color:var(--emerald-950); margin-top:2px;">
            ${metrics.boardCounts['State Board'] || 0} <span style="font-size:10px; font-weight:600; color:var(--emerald-600);">Students</span>
          </div>
          <div style="font-size:9px; color:var(--emerald-600); margin-top:2px; font-weight:700;">Tap to view ➔</div>
        </div>

        <div class="clickable-card" onclick="openModal('board-list', 'ICSE')" style="padding:10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px;">
          <div style="font-size:10px; font-weight:800; color:var(--emerald-600);">ICSE BOARD</div>
          <div style="font-size:18px; font-weight:800; color:var(--emerald-950); margin-top:2px;">
            ${metrics.boardCounts['ICSE'] || 0} <span style="font-size:10px; font-weight:600; color:var(--emerald-600);">Students</span>
          </div>
          <div style="font-size:9px; color:var(--emerald-600); margin-top:2px; font-weight:700;">Tap to view ➔</div>
        </div>

        <div class="clickable-card" onclick="openModal('board-list', 'Other')" style="padding:10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px;">
          <div style="font-size:10px; font-weight:800; color:var(--emerald-600);">OTHER BOARDS</div>
          <div style="font-size:18px; font-weight:800; color:var(--emerald-950); margin-top:2px;">
            ${metrics.boardCounts['Other'] || 0} <span style="font-size:10px; font-weight:600; color:var(--emerald-600);">Students</span>
          </div>
          <div style="font-size:9px; color:var(--emerald-600); margin-top:2px; font-weight:700;">Tap to view ➔</div>
        </div>
      </div>
    </div>

    <!-- Quick Action Button -->
    <div style="margin-bottom:12px;">
      <button class="btn-primary" style="width:100%; padding:12px;" onclick="switchTab('collect')">
        💳 Quick Fee Collection
      </button>
    </div>

    <!-- Carry Forward Formula Highlight -->
    <div class="formula-box">
      <div class="formula-title">💡 Arrears Carry-Forward Formula</div>
      <div class="formula-text">
        Monthly Fee ₹300, Paid ₹250 ➔ Balance ₹50.<br/>
        Next month total payable automatically compounds: <strong>₹300 (New Fee) + ₹50 (Arrears) = ₹350</strong>.
      </div>
    </div>

    <!-- Collection Trend Chart -->
    <div class="glass-card">
      <h3 style="font-size:13px; font-weight:800; color:var(--emerald-950); margin-bottom:8px;">Revenue Collection Trend (${currentYear})</h3>
      <div style="height:160px;">
        <canvas id="revenueTrendChart"></canvas>
      </div>
    </div>
  `;
}

function initDashboardCharts() {
  const trendCtx = document.getElementById('revenueTrendChart');
  if (!trendCtx) return;

  const currentYear = new Date().getFullYear();
  const trendData = db.getMonthlyRevenueTrend(currentYear);

  new Chart(trendCtx, {
    type: 'bar',
    data: {
      labels: trendData.slice(0, 7).map(d => d.month),
      datasets: [
        {
          label: 'Cash',
          data: trendData.slice(0, 7).map(d => d.Cash),
          backgroundColor: '#254B33',
          borderRadius: 6
        },
        {
          label: 'Online',
          data: trendData.slice(0, 7).map(d => d.Online),
          backgroundColor: '#5E9185',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { boxWidth: 8, font: { size: 9 }, color: '#254B33' } } },
      scales: {
        x: { stacked: true, ticks: { color: '#254B33' } },
        y: { stacked: true, ticks: { color: '#254B33' } }
      }
    }
  });
}

// --- 2. Students Directory View ---
function renderStudentsView(students) {
  return `
    <!-- Search Pill -->
    <div class="search-pill-wrapper">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" id="studentSearchInput" class="search-pill-input" placeholder="Search student name, class, active, left..." value="${searchQuery}" oninput="onStudentSearchInput(event)" onkeydown="onStudentSearchKeyDown(event)" />
    </div>

    <p style="font-size:10px; color:var(--emerald-600); margin-bottom:8px; text-align:right;">💡 Tap any student to view profile, edit status (Active/Left/Closed) or collect fee</p>

    <!-- Student Cards List Container -->
    <div id="students-list-container">
      ${renderStudentCardListHTML(students)}
    </div>
  `;
}

function renderStudentCardListHTML(students) {
  let filtered = students;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.class.toLowerCase().includes(q) || s.status.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    return `<div style="text-align:center; padding:30px 10px; color:var(--emerald-600); font-size:12px;">No student records found matching "${searchQuery}".</div>`;
  }

  return filtered.map(s => {
    const fin = db.calculateStudentFinancials(s.id);
    const avatar = s.gender === 'Female' ? '👧' : '👦';
    const isDiscontinued = s.status === 'Left' || s.status === 'Session Closed';

    return `
      <div class="student-card-item" onclick="openModal('student-profile', ${s.id})" style="${isDiscontinued ? 'opacity:0.75; background:rgba(240,247,244,0.7);' : ''}">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="student-avatar">${avatar}</span>
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--emerald-950); display:flex; align-items:center; gap:6px;">
              ${s.name}
              ${s.status === 'Left' ? '<span class="badge badge-due" style="font-size:8px;">LEFT</span>' : ''}
              ${s.status === 'Session Closed' ? '<span class="badge badge-closed" style="font-size:8px;">CLOSED</span>' : ''}
            </div>
            <div style="font-size:10px; color:var(--emerald-600);">${s.class} • ₹${s.monthly_fee}/mo ${s.school ? '• ' + s.school : ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          ${isDiscontinued ? `<span class="badge badge-closed">${s.status.toUpperCase()}</span>` : renderStatusBadge(fin.dueStatus, fin.totalCurrentDue)}
        </div>
      </div>
    `;
  }).join('');
}

window.onStudentSearchInput = function(e) {
  searchQuery = e.target.value;
  const container = document.getElementById('students-list-container');
  if (container) {
    container.innerHTML = renderStudentCardListHTML(db.getStudents());
  }
};

window.onStudentSearchKeyDown = function(e) {
  if (e.key === 'Enter') {
    e.target.blur();
  }
};

function renderStatusBadge(status, dueAmount) {
  if (status === 'PAID') {
    return `<span class="badge badge-paid">PAID</span>`;
  } else if (status === 'OVERDUE') {
    return `<span class="badge badge-overdue">OVERDUE ₹${dueAmount}</span>`;
  } else if (status === 'DUE TODAY') {
    return `<span class="badge badge-due">DUE TODAY ₹${dueAmount}</span>`;
  } else {
    return `<span class="badge badge-upcoming">UPCOMING ₹${dueAmount}</span>`;
  }
}

// --- 3. Collect Fees View (Real-time Month & Year Defaults) ---
function renderCollectFeesView(students) {
  const activeStudents = students.filter(s => s.status === 'Active');
  const selectedStudent = selectedStudentForCollect ? db.getStudentById(selectedStudentForCollect) : activeStudents[0];
  const fin = selectedStudent ? db.calculateStudentFinancials(selectedStudent.id) : null;

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

  return `
    <div class="glass-card">
      <h3 style="font-size:15px; font-weight:800; color:var(--emerald-950); margin-bottom:10px;">Fee Collection Wizard</h3>

      <div class="form-group">
        <label class="form-label">Select Student</label>
        <select class="form-control" onchange="onStudentSelectForCollect(this.value)">
          ${activeStudents.map(s => `
            <option value="${s.id}" ${selectedStudent && selectedStudent.id === s.id ? 'selected' : ''}>
              ${s.name} (${s.class})
            </option>
          `).join('')}
        </select>
      </div>

      ${fin ? `
        <div class="formula-box">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
            <div>
              <span style="font-size:9px; color:var(--emerald-600);">Monthly Fee:</span>
              <div style="font-weight:700; font-size:12px;">₹${fin.student.monthly_fee}</div>
            </div>
            <div>
              <span style="font-size:9px; color:var(--emerald-600);">Arrears:</span>
              <div style="font-weight:700; font-size:12px; color:var(--status-overdue-text);">₹${fin.currentArrears}</div>
            </div>
            <div style="grid-column: span 2; margin-top:2px;">
              <span style="font-size:9px; color:var(--emerald-600);">Total Payable:</span>
              <div style="font-size:16px; font-weight:800; color:var(--emerald-950);">₹${fin.totalCurrentDue}</div>
            </div>
          </div>
        </div>

        <form onsubmit="handleFeeCollection(event)">
          <input type="hidden" name="student_id" value="${selectedStudent.id}" />

          <div class="form-group">
            <label class="form-label">Month & Year</label>
            <div style="display:flex; gap:8px;">
              <select name="month" class="form-control" style="flex:2;">
                ${MONTH_NAMES.map(m => `<option value="${m}" ${m === currentMonthName ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
              <input type="number" name="year" class="form-control" value="${currentYear}" style="flex:1;" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Paying Amount (₹)</label>
            <input type="number" name="paid_amount" class="form-control" value="${fin.totalCurrentDue}" required />
          </div>

          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <div style="display:flex; gap:16px; margin-top:2px;">
              <label style="font-size:11px; font-weight:600; cursor:pointer;">
                <input type="radio" name="payment_mode" value="Cash" checked /> Cash 💵
              </label>
              <label style="font-size:11px; font-weight:600; cursor:pointer;">
                <input type="radio" name="payment_mode" value="Online" /> Online 🌐
              </label>
            </div>
          </div>

          <button type="submit" class="btn-primary" style="width:100%; margin-top:8px; padding:10px;">
            ✅ Collect & Print Receipt
          </button>
        </form>
      ` : ''}
    </div>
  `;
}

window.onStudentSelectForCollect = function(studentId) {
  selectedStudentForCollect = studentId;
  renderCurrentTab();
};

window.handleFeeCollection = function(event) {
  event.preventDefault();
  const form = event.target;
  const studentId = form.student_id.value;
  const month = form.month.value;
  const year = form.year.value;
  const paidAmount = Number(form.paid_amount.value);
  const paymentMode = form.payment_mode.value;

  const fin = db.calculateStudentFinancials(studentId);
  const totalPayable = fin.totalCurrentDue;
  const remaining = Math.max(0, totalPayable - paidAmount);

  const payment = db.recordPayment({
    student_id: studentId,
    month,
    year,
    monthly_fee: fin.student.monthly_fee,
    paid_amount: paidAmount,
    remaining_amount: remaining,
    payment_mode: paymentMode
  });

  receiptData = {
    payment,
    student: fin.student,
    totalPayable,
    remainingArrears: remaining
  };

  openModal('receipt');
};

// --- 4. REAL-TIME LIVE FEE CALENDAR VIEW ---
function renderCalendarView(students) {
  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

  return `
    <div class="glass-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="font-size:15px; font-weight:800; color:var(--emerald-950);">${currentMonthName} ${currentYear} Fee Calendar</h3>
        <span style="font-size:10px; color:var(--emerald-600); font-weight:700;">💡 Tap date to view dues</span>
      </div>

      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; font-size:10px; font-weight:800; color:var(--emerald-600); text-align:center; margin-bottom:8px;">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px;">
        ${renderCalendarGridDays(students)}
      </div>
    </div>
  `;
}

function renderCalendarGridDays(students) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const todayDateNumber = now.getDate(); // Real-time today's day number!

  // Dynamic calculation of starting day offset and total days in month
  const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay();
  const totalDaysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();

  let gridHTML = '';
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridHTML += `<div style="height:38px; background:rgba(0,0,0,0.03); border-radius:8px;"></div>`;
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const isToday = (day === todayDateNumber); // Real-time Today check!
    const dueStudents = students.filter(s => s.status === 'Active' && new Date(s.joining_date).getDate() === day);
    const hasDue = dueStudents.length > 0;

    gridHTML += `
      <div class="clickable-card" onclick="openModal('calendar-day', ${day})" style="height:38px; background:${isToday ? 'var(--emerald-800)' : hasDue ? 'var(--emerald-200)' : '#FFFFFF'}; color:${isToday ? 'white' : 'var(--emerald-950)'}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:${isToday ? '2px solid var(--emerald-950)' : '1px solid rgba(94, 145, 133, 0.15)'}; box-shadow:${isToday ? '0 4px 12px rgba(37,75,51,0.3)' : 'none'};">
        <span>${day}</span>
        ${hasDue ? `<span style="width:4px; height:4px; background:${isToday ? '#B5D8C7' : '#254B33'}; border-radius:50%; margin-top:2px;"></span>` : ''}
      </div>
    `;
  }
  return gridHTML;
}

// --- Modal & Bottom Sheet Renderer ---
function renderActiveModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  if (!activeModal) {
    container.innerHTML = '';
    return;
  }

  // Modal 1: Add Student (Default joining_date to today's real current date!)
  if (activeModal === 'add-student') {
    const todayDateStr = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Register Student</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>
          <form onsubmit="handleAddStudentSubmit(event)">
            <div class="form-group">
              <label class="form-label">Student Name *</label>
              <input type="text" name="name" class="form-control" required placeholder="e.g. Aarav Sharma" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">Gender *</label>
                <select name="gender" class="form-control" required>
                  <option value="Male">Male 👦</option>
                  <option value="Female">Female 👧</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Class (1st to 10th) *</label>
                <select name="class" class="form-control" required>
                  ${[1,2,3,4,5,6,7,8,9,10].map(c => `<option value="Class ${c}" ${c===10?'selected':''}>Class ${c}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">Monthly Fee (₹) *</label>
                <input type="number" name="monthly_fee" class="form-control" required value="300" />
              </div>
              <div class="form-group">
                <label class="form-label">Joining Date (Default Today) *</label>
                <input type="date" name="joining_date" class="form-control" required value="${todayDateStr}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Enrollment Lifecycle Status</label>
              <select name="status" class="form-control">
                <option value="Active" selected>Active (Currently Enrolled)</option>
                <option value="Left">Left (Discontinued Coaching)</option>
                <option value="Session Closed">Session Closed (Completed Year)</option>
              </select>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">School Name (Optional)</label>
                <input type="text" name="school" class="form-control" placeholder="e.g. St. Xavier" />
              </div>
              <div class="form-group">
                <label class="form-label">Board (Optional)</label>
                <select name="board" class="form-control">
                  <option value="CBSE">CBSE</option>
                  <option value="State Board">State / MP Board</option>
                  <option value="ICSE">ICSE</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:10px; margin-top:8px;">Save Student</button>
          </form>
        </div>
      </div>
    `;
  } 

  // Modal 2: Edit Student Modal
  else if (activeModal === 'edit-student' && editStudentId) {
    const student = db.getStudentById(editStudentId);
    if (!student) return;

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Edit Student Details</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>
          <form onsubmit="handleEditStudentSubmit(event)">
            <input type="hidden" name="id" value="${student.id}" />
            
            <div class="form-group">
              <label class="form-label">Student Name *</label>
              <input type="text" name="name" class="form-control" required value="${student.name}" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">Gender *</label>
                <select name="gender" class="form-control">
                  <option value="Male" ${student.gender === 'Male' ? 'selected' : ''}>Male 👦</option>
                  <option value="Female" ${student.gender === 'Female' ? 'selected' : ''}>Female 👧</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Class *</label>
                <select name="class" class="form-control" required>
                  ${[1,2,3,4,5,6,7,8,9,10].map(c => `
                    <option value="Class ${c}" ${student.class === 'Class ' + c ? 'selected' : ''}>Class ${c}</option>
                  `).join('')}
                </select>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">Monthly Fee (₹) *</label>
                <input type="number" name="monthly_fee" class="form-control" required value="${student.monthly_fee}" />
              </div>
              <div class="form-group">
                <label class="form-label">Joining Date *</label>
                <input type="date" name="joining_date" class="form-control" required value="${student.joining_date}" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Enrollment Status</label>
              <select name="status" class="form-control">
                <option value="Active" ${student.status === 'Active' ? 'selected' : ''}>Active (Enrolled)</option>
                <option value="Left" ${student.status === 'Left' ? 'selected' : ''}>Left (Discontinued Coaching)</option>
                <option value="Session Closed" ${student.status === 'Session Closed' ? 'selected' : ''}>Session Closed (Completed Year)</option>
              </select>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">School Name (Optional)</label>
                <input type="text" name="school" class="form-control" value="${student.school || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Board (Optional)</label>
                <select name="board" class="form-control">
                  <option value="CBSE" ${student.board === 'CBSE' ? 'selected' : ''}>CBSE</option>
                  <option value="State Board" ${student.board === 'State Board' ? 'selected' : ''}>State / MP Board</option>
                  <option value="ICSE" ${student.board === 'ICSE' ? 'selected' : ''}>ICSE</option>
                  <option value="Other" ${student.board === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:12px;">
              <button type="submit" class="btn-primary" style="flex:1;">Update Student</button>
              <button type="button" class="btn-secondary" style="border-color:var(--status-overdue-text); color:var(--status-overdue-text);" onclick="handleDeleteStudent(${student.id})">Delete</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Modal 3: Board Student List Drawer
  else if (activeModal === 'board-list' && selectedBoardForList) {
    const boardStudents = db.getStudentsByBoard(selectedBoardForList);
    const displayBoardTitle = selectedBoardForList === 'State Board' ? 'State / MP Board' : selectedBoardForList;

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">${displayBoardTitle} Students</h3>
              <div style="font-size:11px; color:var(--emerald-600); font-weight:700;">
                Total Enrolled: ${boardStudents.length} Student(s)
              </div>
            </div>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="max-height:260px; overflow-y:auto; margin-bottom:14px;">
            ${boardStudents.length > 0 ? boardStudents.map(s => {
              const fin = db.calculateStudentFinancials(s.id);
              return `
                <div class="student-card-item" onclick="closeModal(); openModal('student-profile', ${s.id});" style="margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="student-avatar">${s.gender === 'Female' ? '👧' : '👦'}</span>
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--emerald-950);">${s.name}</div>
                      <div style="font-size:10px; color:var(--emerald-600);">${s.class} • ₹${s.monthly_fee}/mo ${s.school ? '• ' + s.school : ''}</div>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    ${renderStatusBadge(fin.dueStatus, fin.totalCurrentDue)}
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="text-align:center; padding:30px 10px; color:var(--emerald-600); font-size:12px;">
                No active students enrolled under ${displayBoardTitle}.
              </div>
            `}
          </div>

          <button class="btn-secondary" style="width:100%; padding:10px;" onclick="closeModal()">Close List</button>
        </div>
      </div>
    `;
  }

  // Modal 4: Student Profile Drawer
  else if (activeModal === 'student-profile' && profileStudentId) {
    const fin = db.calculateStudentFinancials(profileStudentId);
    if (!fin) return;
    const avatar = fin.student.gender === 'Female' ? '👧' : '👦';
    const isDiscontinued = fin.student.status === 'Left' || fin.student.status === 'Session Closed';

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="student-avatar" style="width:42px; height:42px; font-size:20px;">${avatar}</span>
              <div>
                <h3 class="modal-title">${fin.student.name}</h3>
                <div style="font-size:10px; color:var(--emerald-600);">
                  ${fin.student.class} ${fin.student.board ? '• ' + fin.student.board : ''} ${fin.student.status !== 'Active' ? '• ' + fin.student.status : ''}
                </div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="openModal('edit-student', ${fin.student.id})">✏️ Edit</button>
              <button class="close-btn" onclick="closeModal()">✕</button>
            </div>
          </div>

          <div class="formula-box" style="margin-top:4px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:10px; color:var(--emerald-600);">Monthly Fee: ₹${fin.student.monthly_fee} • Joined: ${fin.student.joining_date}</span>
                <div style="font-size:15px; font-weight:800; color:var(--emerald-950);">Total Outstanding Dues</div>
              </div>
              <div style="font-size:20px; font-weight:800; color:${fin.totalCurrentDue === 0 ? '#254B33' : 'var(--status-overdue-text)'};">₹${fin.totalCurrentDue}</div>
            </div>
          </div>

          <h4 style="font-size:11px; font-weight:800; color:var(--emerald-800); margin-bottom:6px;">Month-by-Month Fee Audit</h4>
          
          <div style="max-height:180px; overflow-y:auto; margin-bottom:12px;">
            ${fin.billingMonths.map(bm => `
              <div class="month-pending-row">
                <div>
                  <strong>${bm.monthName} ${bm.year}</strong>
                  <div style="font-size:9px; color:var(--emerald-600);">Monthly Baseline Fee: ₹${bm.baseFee}</div>
                </div>
                <div>
                  ${bm.isPaid ? 
                    '<span class="badge badge-paid">✓ PAID (₹' + bm.baseFee + ')</span>' : 
                    '<span class="badge badge-overdue">🔴 PENDING ₹' + bm.remainingBalance + '</span>'
                  }
                </div>
              </div>
            `).join('')}
          </div>

          <div style="display:flex; gap:8px;">
            ${!isDiscontinued ? `
              <button class="btn-primary" style="flex:1; padding:10px;" onclick="closeModal(); switchTab('collect'); onStudentSelectForCollect(${fin.student.id});">
                💳 Collect Fee
              </button>
            ` : ''}
            <button class="btn-secondary" style="border-color:var(--status-overdue-text); color:var(--status-overdue-text); padding:10px;" onclick="handleDeleteStudent(${fin.student.id})">
              🗑️ Delete Student
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Modal 5: Dynamic Calendar Day Details Bottom Sheet
  else if (activeModal === 'calendar-day' && selectedCalendarDay) {
    const students = db.getStudents();
    const dueStudents = students.filter(s => s.status === 'Active' && new Date(s.joining_date).getDate() === selectedCalendarDay);
    const now = new Date();
    const currentMonthName = MONTH_NAMES[now.getMonth()];
    const currentYear = now.getFullYear();

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">${currentMonthName} ${selectedCalendarDay}, ${currentYear} - Dues Timeline</h3>
              <div style="font-size:10px; color:var(--emerald-600); font-weight:700;">
                ${dueStudents.length} Student(s) with monthly fee baseline on the ${selectedCalendarDay}th
              </div>
            </div>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="max-height:240px; overflow-y:auto; margin-bottom:14px;">
            ${dueStudents.length > 0 ? dueStudents.map(s => {
              const fin = db.calculateStudentFinancials(s.id);
              return `
                <div class="student-card-item" onclick="closeModal(); openModal('student-profile', ${s.id});" style="margin-bottom:8px;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span class="student-avatar">${s.gender === 'Female' ? '👧' : '👦'}</span>
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--emerald-950);">${s.name}</div>
                      <div style="font-size:10px; color:var(--emerald-600);">${s.class} • Monthly Fee: ₹${s.monthly_fee}</div>
                    </div>
                  </div>
                  <div style="text-align:right;">
                    ${renderStatusBadge(fin.dueStatus, fin.totalCurrentDue)}
                  </div>
                </div>
              `;
            }).join('') : `
              <div style="text-align:center; padding:30px 10px; color:var(--emerald-600); font-size:12px;">
                No recurring student dues scheduled on ${currentMonthName} ${selectedCalendarDay}.
              </div>
            `}
          </div>

          <button class="btn-secondary" style="width:100%; padding:10px;" onclick="closeModal()">Close Timeline</button>
        </div>
      </div>
    `;
  }

  // Modal 6: Dashboard Pending Dues List
  else if (activeModal === 'pending-list') {
    const metrics = db.getDashboardMetrics();
    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">Outstanding Pending Dues</h3>
              <div style="font-size:11px; color:var(--status-overdue-text); font-weight:700;">
                Total Aggregate Due: ₹${metrics.totalAggregateDue} (${metrics.pendingStudentsCount} Students)
              </div>
            </div>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="max-height:260px; overflow-y:auto; margin-bottom:14px;">
            ${metrics.pendingStudentsList.map(item => `
              <div class="student-card-item" onclick="closeModal(); openModal('student-profile', ${item.student.id});" style="margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="student-avatar">${item.student.gender === 'Female' ? '👧' : '👦'}</span>
                  <div>
                    <div style="font-size:12px; font-weight:700; color:var(--emerald-950);">${item.student.name}</div>
                    <div style="font-size:10px; color:var(--emerald-600);">${item.student.class}</div>
                  </div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13px; font-weight:800; color:var(--status-overdue-text);">₹${item.totalCurrentDue}</div>
                  <div style="font-size:9px; color:var(--emerald-600);">${item.pendingMonths.length} Pending Month(s)</div>
                </div>
              </div>
            `).join('')}
          </div>

          <button class="btn-secondary" style="width:100%; padding:10px;" onclick="closeModal()">Close List</button>
        </div>
      </div>
    `;
  }

  // Modal 7: Receipt Sheet
  else if (activeModal === 'receipt' && receiptData) {
    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Receipt Acknowledgement</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>
          <div style="border:1px dashed var(--emerald-600); border-radius:14px; padding:14px; font-size:11px;">
            <div style="text-align:center; font-weight:800; font-size:13px; margin-bottom:8px; color:var(--emerald-950);">ANSHU COACHING CLASSES</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Student:</span><strong>${receiptData.student.name}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Period:</span><strong>${receiptData.payment.month} ${receiptData.payment.year}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Paid Amount:</span><strong style="font-size:13px; color:#254B33;">₹${receiptData.payment.paid_amount}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Remaining Arrears:</span><strong>₹${receiptData.remainingArrears}</strong>
            </div>
          </div>
          <button class="btn-primary" style="width:100%; margin-top:12px;" onclick="closeModal()">Done</button>
        </div>
      </div>
    `;
  }
}

window.handleAddStudentSubmit = function(event) {
  event.preventDefault();
  const form = event.target;
  db.addStudent({
    name: form.name.value,
    gender: form.gender.value,
    class: form.class.value,
    monthly_fee: form.monthly_fee.value,
    joining_date: form.joining_date.value,
    status: form.status ? form.status.value : 'Active',
    school: form.school ? form.school.value : '',
    board: form.board ? form.board.value : ''
  });
  closeModal();
  renderCurrentTab();
};

window.handleEditStudentSubmit = function(event) {
  event.preventDefault();
  const form = event.target;
  db.updateStudent(form.id.value, {
    name: form.name.value,
    gender: form.gender.value,
    class: form.class.value,
    monthly_fee: form.monthly_fee.value,
    joining_date: form.joining_date.value,
    status: form.status ? form.status.value : 'Active',
    school: form.school ? form.school.value : '',
    board: form.board ? form.board.value : ''
  });
  closeModal();
  renderCurrentTab();
};

window.handleDeleteStudent = function(studentId) {
  const student = db.getStudentById(studentId);
  if (!student) return;
  
  const confirmWarning = confirm(
    `⚠️ WARNING: Are you sure you want to permanently delete student "${student.name}" (${student.class})?\n\nThis action CANNOT be undone and all fee history records for this student will be permanently erased.`
  );

  if (confirmWarning) {
    db.deleteStudent(studentId);
    closeModal();
    renderCurrentTab();
  }
};

window.resetDemoData = function() {
  if (confirm('Reset system data to original sample dataset?')) {
    db.resetToDefaults();
    renderCurrentTab();
  }
};
