import { db, MONTH_NAMES } from './db.js';

// Application State
let isLoggedIn = localStorage.getItem('anshu_admin_logged_in') === 'true';
let currentTab = 'dashboard';
let searchQuery = '';
let selectedStudentForCollect = null;
let profileStudentId = null;
let editStudentId = null;
let selectedCalendarDay = new Date().getDate(); // Defaults to live Today!
let selectedBoardForList = null;
let activeModal = null; // 'add-student', 'edit-student', 'collect-fee', 'student-profile', 'pending-list', 'board-list', 'calendar-day', 'receipt', 'add-khata', 'backup-restore', 'clear-khata-modal', 'custom-alert-modal'
let receiptData = null;

// Custom In-App Modal State (Replaces all browser native alerts/confirms!)
let activeKhataItemToClear = null; // { chargeId, item_name, amount, student_name }
let customAlertState = null; // { title, message, isConfirm, onConfirmCallback }

// Interactive Calendar Month & Year Navigation State (Defaults to current live month & year!)
let calendarViewYear = new Date().getFullYear();
let calendarViewMonthIdx = new Date().getMonth();

// Track last rendered day number for real-time midnight auto-update
let lastRenderedDayNumber = new Date().getDate();

// Initialize Application, PWA Service Worker, Splash Screen, Back Button Lock & Real-Time Midnight Clock
document.addEventListener('DOMContentLoaded', () => {
  initSplashScreenHandler();
  initHistoryLock();
  renderCurrentTab();
  updateNavActiveState();
  initPWA();
  initMidnightRealtimeClock();
});

// Ultra Premium Splash Screen Auto-Dismiss Transition Handler
function initSplashScreenHandler() {
  const splashEl = document.getElementById('appSplashScreen');
  if (splashEl) {
    setTimeout(() => {
      splashEl.classList.add('fade-out');
      setTimeout(() => {
        splashEl.style.display = 'none';
      }, 500);
    }, 1300);
  }
}

// Custom In-App Alert System
window.showAppAlert = function(title, message) {
  customAlertState = {
    title: title || 'Notice',
    message: message || '',
    isConfirm: false
  };
  openModal('custom-alert-modal');
};

window.showAppConfirm = function(title, message, onConfirmCallback) {
  customAlertState = {
    title: title || 'Confirmation',
    message: message || '',
    isConfirm: true,
    onConfirmCallback
  };
  openModal('custom-alert-modal');
};

// Real-Time Midnight Auto-Update Clock
function initMidnightRealtimeClock() {
  setInterval(() => {
    const currentDayNumber = new Date().getDate();
    if (currentDayNumber !== lastRenderedDayNumber) {
      lastRenderedDayNumber = currentDayNumber;
      selectedCalendarDay = currentDayNumber;
      renderCurrentTab(); // Auto-refresh today's highlight & metrics at midnight!
    }
  }, 15000);
}

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

// --- Admin Login Screen (Password Only: anshuu - Ultra Premium 3D Emblem Branding) ---
function renderAdminLoginView() {
  return `
    <div style="display:flex; flex-direction:column; justify-content:center; min-height:100%; padding:20px 10px;">
      
      <div style="text-align:center; margin-bottom:24px;">
        <img src="logo.png" alt="Anshu Coaching Emblem" style="width:76px; height:76px; border-radius:50%; margin:0 auto 12px auto; display:block; box-shadow:0 12px 32px rgba(6,39,26,0.35); border:3px solid #FFFFFF;" />
        <h1 style="font-size:22px; font-weight:800; color:var(--emerald-950); letter-spacing:-0.3px;">Anshu Coaching Classes</h1>
        <p style="font-size:12px; color:var(--emerald-600); font-weight:700; margin-top:3px;">VIP Fee Management Portal ✨</p>
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

        <div style="margin-top:14px; border-top:1px dashed var(--card-border); padding-top:10px; text-align:center;">
          <button class="btn-secondary" style="font-size:10px; padding:4px 10px;" onclick="openModal('backup-restore')">
            💾 Backup & Restore Portal Data
          </button>
        </div>
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
  showAppConfirm('Logout Confirmation', 'Are you sure you want to log out from Anshu Coaching Admin Portal?', () => {
    isLoggedIn = false;
    localStorage.removeItem('anshu_admin_logged_in');
    currentTab = 'dashboard';
    renderCurrentTab();
  });
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
  if (modalName === 'clear-khata-modal' && payload) {
    activeKhataItemToClear = payload;
  }
  if (modalName === 'receipt' && payload) {
    if (typeof payload === 'object') {
      receiptData = payload;
    } else {
      const p = db.getPaymentById(payload);
      if (p) {
        const s = db.getStudentById(p.student_id);
        receiptData = {
          payment: p,
          student: s || { name: 'Student', class: '' },
          totalPayable: p.paid_amount + p.remaining_amount,
          remainingArrears: p.remaining_amount
        };
      }
    }
  }
  renderActiveModal();
};

window.closeModal = function() {
  activeModal = null;
  selectedStudentForCollect = null;
  profileStudentId = null;
  editStudentId = null;
  selectedBoardForList = null;
  activeKhataItemToClear = null;
  receiptData = null;
  renderActiveModal();
};

// --- 1. Dashboard View ---
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

    <!-- Backup & Safety Quick Card -->
    <div class="glass-card" style="padding:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(37,75,51,0.2);">
      <div>
        <strong style="font-size:12px; color:var(--emerald-950);">💾 Data Safety & Backup Center</strong>
        <div style="font-size:9px; color:var(--emerald-600);">Export 1-Tap Backup file to WhatsApp / Drive</div>
      </div>
      <button class="btn-secondary" style="padding:6px 10px; font-size:10px;" onclick="openModal('backup-restore')">
        Backup / Restore ➔
      </button>
    </div>

    <!-- Quick Action Button -->
    <div style="margin-bottom:12px;">
      <button class="btn-primary" style="width:100%; padding:12px;" onclick="switchTab('collect')">
        💳 Quick Fee Collection
      </button>
    </div>

    <!-- Carry Forward Formula Highlight -->
    <div class="formula-box">
      <div class="formula-title">💡 Joining Date Cycle Rule</div>
      <div class="formula-text">
        Every student's 1-month tuition cycle starts from their exact <strong>Date of Joining</strong>. Next payment is due on the same day next month!
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
      <div class="student-card-item" onclick="openModal('student-profile', ${s.id})" style="${isDiscontinued ? 'opacity:0.85; background:rgba(254,242,242,0.85); border:1px solid rgba(220,38,38,0.3);' : ''}">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="student-avatar">${avatar}</span>
          <div>
            <div style="font-size:13px; font-weight:700; color:var(--emerald-950); display:flex; align-items:center; gap:6px;">
              ${s.name}
              ${s.status === 'Left' ? '<span class="badge badge-due" style="font-size:8px; background:rgba(220,38,38,0.15); color:#DC2626;">LEFT</span>' : ''}
              ${s.status === 'Session Closed' ? '<span class="badge badge-closed" style="font-size:8px;">CLOSED</span>' : ''}
            </div>
            <div style="font-size:10px; color:var(--emerald-600);">${s.class} • ₹${s.monthly_fee}/mo ${s.school ? '• ' + s.school : ''}</div>
          </div>
        </div>
        <div style="text-align:right;">
          ${renderStatusBadge(fin.dueStatus, fin.totalCurrentDue, fin.cycleNextRenewal)}
          ${fin.unpaidKhataTotal > 0 ? `
            <div style="font-size:9px; color:#DC2626; font-weight:800; margin-top:3px; background:rgba(220,38,38,0.1); padding:2px 6px; border-radius:6px; border:1px solid rgba(220,38,38,0.3); display:inline-block;">
              🔴 Khata: ₹${fin.unpaidKhataTotal}
            </div>
          ` : ''}
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

function renderStatusBadge(status, dueAmount, renewalDateStr) {
  if (status === 'PAID') {
    return `<span class="badge badge-paid">✓ PAID</span>`;
  } else if (status === 'OVERDUE') {
    return `<span class="badge badge-overdue">🔴 OVERDUE ₹${dueAmount}</span>`;
  } else if (status === 'DUE TODAY') {
    return `<span class="badge badge-due">⏰ DUE TODAY ₹${dueAmount}</span>`;
  } else {
    return `<span class="badge badge-upcoming">🟡 ACTIVE (Due ${renewalDateStr || ''})</span>`;
  }
}

// --- 3. Collect Fees View ---
function renderCollectFeesView(students) {
  const activeStudents = students.filter(s => s.status === 'Active' || (s.status === 'Left' && db.calculateStudentFinancials(s.id).totalCurrentDue > 0));
  const selectedStudent = selectedStudentForCollect ? db.getStudentById(selectedStudentForCollect) : activeStudents[0];
  const fin = selectedStudent ? db.calculateStudentFinancials(selectedStudent.id) : null;

  const now = new Date();
  const currentMonthName = MONTH_NAMES[now.getMonth()];
  const currentYear = now.getFullYear();

  // ALWAYS GET RECENT PAYMENTS NEWEST-FIRST AT TOP!
  const recentPayments = db.getRecentPayments(6);

  return `
    <div class="glass-card">
      <h3 style="font-size:15px; font-weight:800; color:var(--emerald-950); margin-bottom:10px;">Fee Collection Wizard</h3>

      <div class="form-group">
        <label class="form-label">Select Student</label>
        <select class="form-control" onchange="onStudentSelectForCollect(this.value)">
          ${activeStudents.map(s => `
            <option value="${s.id}" ${selectedStudent && selectedStudent.id === s.id ? 'selected' : ''}>
              ${s.name} (${s.class}) ${s.status === 'Left' ? '[LEFT - Unpaid Dues]' : ''}
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
              <span style="font-size:9px; color:var(--emerald-600);">Next Fee Due Date:</span>
              <div style="font-weight:700; font-size:11px; color:#254B33;">${fin.cycleNextRenewal}</div>
            </div>
            <div style="grid-column: span 2; margin-top:2px;">
              <span style="font-size:9px; color:var(--emerald-600);">Fee Amount Payable:</span>
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
            <label class="form-label">Paying Fee Amount (₹)</label>
            <input type="number" name="paid_amount" class="form-control" value="${fin.totalCurrentDue}" min="0" required />
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

    <!-- Recent Payment Receipts Log Section (ALWAYS NEWEST FIRST ON TOP!) -->
    <div class="glass-card">
      <h3 style="font-size:13px; font-weight:800; color:var(--emerald-950); margin-bottom:8px;">Recent Payment Receipts 🧾</h3>
      <div style="max-height:220px; overflow-y:auto;">
        ${recentPayments.length > 0 ? recentPayments.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:12px; margin-bottom:6px; font-size:11px;">
            <div>
              <strong style="color:var(--emerald-950);">${p.student.name}</strong> (${p.student.class})
              <div style="font-size:9px; color:var(--emerald-600);">
                ${p.month} ${p.year} • ${db.formatDisplayDate(p.payment_date)} (${p.payment_mode})
                ${p.extra_item_name ? ' • Extra: ' + p.extra_item_name + ' (₹' + p.extra_charge_amount + ')' : ''}
              </div>
            </div>
            <div style="text-align:right; display:flex; align-items:center; gap:6px;">
              <strong style="color:#254B33; font-size:12px;">₹${p.paid_amount + (p.extra_charge_amount || 0)}</strong>
              <button class="btn-secondary" style="padding:3px 7px; font-size:9px;" onclick="openModal('receipt', ${p.id})">🧾 Receipt</button>
              <button class="btn-secondary" style="padding:3px 6px; font-size:9px; color:#DC2626; border-color:rgba(220,38,38,0.3);" onclick="handleVoidPayment(${p.id})">↩️ Void</button>
            </div>
          </div>
        `).join('') : `
          <div style="text-align:center; padding:15px; color:var(--emerald-600); font-size:11px;">No payments recorded yet.</div>
        `}
      </div>
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
  const paidAmount = Number(form.paid_amount.value || 0);
  const paymentMode = form.payment_mode.value;

  if (paidAmount <= 0) {
    showAppAlert('Collection Warning', 'Cannot generate receipt for ₹0 payment. Please enter a valid fee amount.');
    return;
  }

  const fin = db.calculateStudentFinancials(studentId);
  const totalPayable = fin.totalCurrentDue;

  let remaining = 0;
  let advance = 0;

  if (paidAmount >= totalPayable) {
    advance = paidAmount - totalPayable;
    remaining = 0;
  } else {
    remaining = totalPayable - paidAmount;
    advance = 0;
  }

  const payment = db.recordPayment({
    student_id: studentId,
    month,
    year,
    monthly_fee: fin.student.monthly_fee,
    paid_amount: paidAmount,
    remaining_amount: remaining,
    advance_amount: advance,
    extra_item_name: '',
    extra_charge_amount: 0,
    payment_mode: paymentMode,
    payment_date: new Date().toISOString()
  });

  renderCurrentTab(); // Instant re-render so background list updates newest-first at top!

  receiptData = {
    payment,
    student: fin.student,
    totalPayable,
    remainingArrears: remaining,
    advanceCredit: advance
  };

  openModal('receipt');
};

// --- 4. INTERACTIVE LIVE CALENDAR VIEW WITH SELECTED DATE MASTER REPORT ---
function renderCalendarView(students) {
  const currentMonthName = MONTH_NAMES[calendarViewMonthIdx];
  const isCurrentLiveMonth = (calendarViewYear === new Date().getFullYear() && calendarViewMonthIdx === new Date().getMonth());

  // By default, Today's live date is selected!
  const selectedDay = selectedCalendarDay || (isCurrentLiveMonth ? new Date().getDate() : 1);
  
  const joiningStudents = students.filter(s => {
    const d = new Date(s.joining_date);
    return d.getDate() === selectedDay;
  });

  const allPayments = db.getPayments();
  const studentMap = {};
  students.forEach(s => { studentMap[s.id] = s; });

  // SORT DAILY PAYMENTS NEWEST-FIRST AT VERY TOP!
  const dailyPayments = allPayments.filter(p => {
    const pDate = new Date(p.payment_date || p.created_at);
    return (pDate.getFullYear() === calendarViewYear && pDate.getMonth() === calendarViewMonthIdx && pDate.getDate() === selectedDay);
  }).sort((a, b) => (b.id || 0) - (a.id || 0)).map(p => ({
    ...p,
    student: studentMap[p.student_id] || { name: 'Student', class: '' }
  }));

  const totalDailyCollection = dailyPayments.reduce((sum, p) => sum + p.paid_amount + (p.extra_charge_amount || 0), 0);

  return `
    <div class="glass-card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="navigateCalendarMonth(-1)">◀ Prev</button>
        <div style="text-align:center;">
          <h3 style="font-size:15px; font-weight:800; color:var(--emerald-950); display:flex; align-items:center; justify-content:center; gap:6px;">
            ${currentMonthName} ${calendarViewYear}
            ${!isCurrentLiveMonth ? `<button class="btn-secondary" style="padding:2px 6px; font-size:9px;" onclick="resetCalendarToToday()">📅 Today</button>` : ''}
          </h3>
        </div>
        <button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="navigateCalendarMonth(1)">Next ▶</button>
      </div>

      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; font-size:10px; font-weight:800; color:var(--emerald-600); text-align:center; margin-bottom:8px;">
        <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
      </div>
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px;">
        ${renderCalendarGridDays(students)}
      </div>
    </div>

    <!-- SELECTED DATE MASTER REPORT BAR -->
    <div class="formula-box" style="margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <strong style="font-size:12px; color:var(--emerald-950);">📅 Daily Master Report: ${currentMonthName} ${selectedDay}, ${calendarViewYear}</strong>
          <div style="font-size:9px; color:var(--emerald-600); font-weight:700;">${joiningStudents.length} Joining Anniversary • ${dailyPayments.length} Fee Transactions</div>
        </div>
        <div style="text-align:right;">
          <span style="font-size:9px; color:var(--emerald-600); font-weight:700;">Total Collected:</span>
          <div style="font-size:16px; font-weight:800; color:#254B33;">₹${totalDailyCollection}</div>
        </div>
      </div>
    </div>

    <!-- DUAL PANELS BELOW CALENDAR -->
    
    <!-- PANEL 1: Joining Anniversary Register -->
    <div class="glass-card" style="margin-bottom:10px;">
      <h4 style="font-size:12px; font-weight:800; color:var(--emerald-950); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>🎯 Joining Anniversary Register (${currentMonthName} ${selectedDay})</span>
        <span style="font-size:9px; color:var(--emerald-600);">${joiningStudents.length} Student(s)</span>
      </h4>
      <div style="max-height:130px; overflow-y:auto;">
        ${joiningStudents.length > 0 ? joiningStudents.map(s => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:10px; margin-bottom:4px; font-size:11px;">
            <div>
              <strong style="color:var(--emerald-950);">${s.name}</strong> (${s.class})
              <div style="font-size:9px; color:var(--emerald-600);">Joined: ${s.joining_date} • Baseline Fee: ₹${s.monthly_fee}</div>
            </div>
            <button class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="openModal('student-profile', ${s.id})">Profile</button>
          </div>
        `).join('') : `
          <div style="text-align:center; padding:10px; color:var(--emerald-600); font-size:10px;">No student joining anniversary on ${currentMonthName} ${selectedDay}.</div>
        `}
      </div>
    </div>

    <!-- PANEL 2: Daily Fee Collection Register Log (ALWAYS NEWEST FIRST AT TOP!) -->
    <div class="glass-card">
      <h4 style="font-size:12px; font-weight:800; color:var(--emerald-950); margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
        <span>💵 Fee Collection Register Log (${currentMonthName} ${selectedDay})</span>
        <span style="font-size:9px; color:var(--emerald-600);">${dailyPayments.length} Payment(s)</span>
      </h4>
      <div style="max-height:140px; overflow-y:auto;">
        ${dailyPayments.length > 0 ? dailyPayments.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:10px; margin-bottom:4px; font-size:11px;">
            <div>
              <strong style="color:var(--emerald-950);">${p.student.name}</strong> (${p.student.class})
              <div style="font-size:9px; color:var(--emerald-600);">${p.month} ${p.year} • Mode: ${p.payment_mode}</div>
            </div>
            <div style="text-align:right; display:flex; align-items:center; gap:6px;">
              <strong style="color:#254B33; font-size:12px;">₹${p.paid_amount + (p.extra_charge_amount || 0)}</strong>
              <button class="btn-secondary" style="padding:3px 7px; font-size:9px;" onclick="openModal('receipt', ${p.id})">🧾 Receipt</button>
              <button class="btn-secondary" style="padding:3px 6px; font-size:9px; color:#DC2626; border-color:rgba(220,38,38,0.3);" onclick="handleVoidPayment(${p.id})">↩️ Void</button>
            </div>
          </div>
        `).join('') : `
          <div style="text-align:center; padding:10px; color:var(--emerald-600); font-size:10px;">No fee collection transactions recorded on ${currentMonthName} ${selectedDay}.</div>
        `}
      </div>
    </div>
  `;
}

window.navigateCalendarMonth = function(delta) {
  calendarViewMonthIdx += delta;
  if (calendarViewMonthIdx > 11) {
    calendarViewMonthIdx = 0;
    calendarViewYear++;
  } else if (calendarViewMonthIdx < 0) {
    calendarViewMonthIdx = 11;
    calendarViewYear--;
  }
  renderCurrentTab();
};

window.resetCalendarToToday = function() {
  const now = new Date();
  calendarViewYear = now.getFullYear();
  calendarViewMonthIdx = now.getMonth();
  selectedCalendarDay = now.getDate();
  renderCurrentTab();
};

function renderCalendarGridDays(students) {
  const now = new Date();
  const currentLiveYear = now.getFullYear();
  const currentLiveMonthIdx = now.getMonth();
  const todayDateNumber = now.getDate();

  const isLiveView = (calendarViewYear === currentLiveYear && calendarViewMonthIdx === currentLiveMonthIdx);

  const firstDayOfWeek = new Date(calendarViewYear, calendarViewMonthIdx, 1).getDay();
  const totalDaysInMonth = new Date(calendarViewYear, calendarViewMonthIdx + 1, 0).getDate();

  let gridHTML = '';
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridHTML += `<div style="height:38px; background:rgba(0,0,0,0.03); border-radius:8px;"></div>`;
  }

  for (let day = 1; day <= totalDaysInMonth; day++) {
    const isToday = isLiveView && (day === todayDateNumber);
    const isSelectedDay = (selectedCalendarDay === day);
    const dueStudents = students.filter(s => s.status === 'Active' && new Date(s.joining_date).getDate() === day);
    const hasDue = dueStudents.length > 0;

    gridHTML += `
      <div class="clickable-card" onclick="onCalendarDaySelect(${day})" style="height:38px; background:${isToday ? 'var(--emerald-800)' : isSelectedDay ? 'var(--emerald-400)' : hasDue ? 'var(--emerald-200)' : '#FFFFFF'}; color:${isToday ? 'white' : 'var(--emerald-950)'}; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:11px; font-weight:700; border:${isToday ? '2px solid var(--emerald-950)' : isSelectedDay ? '2px solid var(--emerald-800)' : '1px solid rgba(94, 145, 133, 0.15)'}; box-shadow:${isToday || isSelectedDay ? '0 4px 12px rgba(37,75,51,0.3)' : 'none'};">
        <span>${day}</span>
        ${hasDue ? `<span style="width:4px; height:4px; background:${isToday ? '#B5D8C7' : '#254B33'}; border-radius:50%; margin-top:2px;"></span>` : ''}
      </div>
    `;
  }
  return gridHTML;
}

window.onCalendarDaySelect = function(day) {
  selectedCalendarDay = day;
  renderCurrentTab();
};

// --- Modal & Bottom Sheet Renderer ---
function renderActiveModal() {
  const container = document.getElementById('modal-container');
  if (!container) return;

  if (!activeModal) {
    container.innerHTML = '';
    return;
  }

  // Modal: Custom Glassmorphic In-App Alert / Confirm Sheet
  if (activeModal === 'custom-alert-modal' && customAlertState) {
    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">${customAlertState.title}</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="font-size:12px; color:var(--emerald-950); margin-bottom:16px; line-height:1.4;">
            ${customAlertState.message}
          </div>

          <div style="display:flex; gap:8px;">
            ${customAlertState.isConfirm ? `
              <button class="btn-primary" style="flex:1; padding:10px;" onclick="executeCustomConfirm()">
                Confirm & Proceed
              </button>
              <button class="btn-secondary" style="flex:1; padding:10px;" onclick="closeModal()">
                Cancel
              </button>
            ` : `
              <button class="btn-primary" style="width:100%; padding:10px;" onclick="closeModal()">
                OK
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // Modal: Clear Khata Item Selection Sheet (Payment Mode Selection inside App!)
  else if (activeModal === 'clear-khata-modal' && activeKhataItemToClear) {
    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Clear Khatabook Item</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="padding:10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:12px; margin-bottom:12px; font-size:11px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Student:</span><strong>${activeKhataItemToClear.student_name}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Item Description:</span><strong>${activeKhataItemToClear.item_name}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Amount Due:</span><strong style="color:#DC2626; font-size:13px;">₹${activeKhataItemToClear.amount}</strong>
            </div>
          </div>

          <form onsubmit="submitClearKhataPayment(event)">
            <div class="form-group">
              <label class="form-label">Select Payment Collection Mode</label>
              <div style="display:flex; gap:16px; margin-top:4px;">
                <label style="font-size:11px; font-weight:700; cursor:pointer;">
                  <input type="radio" name="clear_payment_mode" value="Cash" checked /> Cash 💵
                </label>
                <label style="font-size:11px; font-weight:700; cursor:pointer;">
                  <input type="radio" name="clear_payment_mode" value="Online" /> Online 🌐
                </label>
              </div>
            </div>

            <div style="display:flex; gap:8px; margin-top:12px;">
              <button type="submit" class="btn-primary" style="flex:1; padding:10px;">
                ✅ Clear & Print Receipt
              </button>
              <button type="button" class="btn-secondary" style="flex:1; padding:10px;" onclick="closeModal()">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // Modal 1: Add Student
  else if (activeModal === 'add-student') {
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

  // Modal 2: Add Khata / Udhaar Extra Charge Item Modal
  else if (activeModal === 'add-khata' && profileStudentId) {
    const student = db.getStudentById(profileStudentId);
    if (!student) return;
    const todayDateStr = new Date().toISOString().split('T')[0];

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Add Extra Charge (Khatabook Udhaar)</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>
          
          <div style="font-size:11px; color:var(--emerald-600); margin-bottom:10px;">
            Adding stationery/extra item for <strong>${student.name}</strong> (${student.class}). This adds to their red unpaid Khata ledger.
          </div>

          <form onsubmit="handleAddKhataSubmit(event)">
            <input type="hidden" name="student_id" value="${student.id}" />

            <!-- Quick Presets -->
            <div class="form-group">
              <label class="form-label">Quick Presets</label>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                <button type="button" class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="applyKhataModalPreset('Rough Book', 50)">📘 Rough Book (₹50)</button>
                <button type="button" class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="applyKhataModalPreset('Copy', 40)">📓 Copy (₹40)</button>
                <button type="button" class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="applyKhataModalPreset('Pen', 10)">🖊️ Pen (₹10)</button>
                <button type="button" class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="applyKhataModalPreset('Pouch', 60)">🎒 Pouch (₹60)</button>
                <button type="button" class="btn-secondary" style="padding:3px 8px; font-size:9px;" onclick="applyKhataModalPreset('Notes', 100)">📚 Notes (₹100)</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Item Description *</label>
              <input type="text" id="khata_modal_item_name" name="item_name" class="form-control" required placeholder="e.g. Rough Book / Class Copy" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div class="form-group">
                <label class="form-label">Amount (₹) *</label>
                <input type="number" id="khata_modal_amount" name="amount" class="form-control" required min="1" placeholder="50" />
              </div>
              <div class="form-group">
                <label class="form-label">Date *</label>
                <input type="date" name="added_date" class="form-control" required value="${todayDateStr}" />
              </div>
            </div>

            <button type="submit" class="btn-primary" style="width:100%; padding:10px; margin-top:8px;">➕ Add to Red Khata Ledger</button>
          </form>
        </div>
      </div>
    `;
  }

  // Modal 3: Backup & Restore Data Modal
  else if (activeModal === 'backup-restore') {
    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">💾 Backup & Restore Data</h3>
            <button class="close-btn" onclick="closeModal()">✕</button>
          </div>

          <div style="font-size:11px; color:var(--emerald-600); margin-bottom:12px;">
            Keep your coaching data 100% safe! Download a 1-tap backup file anytime and save it in your Google Drive or WhatsApp.
          </div>

          <!-- Section 1: Export Download -->
          <div style="padding:12px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px; margin-bottom:12px;">
            <strong style="font-size:12px; color:var(--emerald-950);">📥 Step 1: Export Complete Backup</strong>
            <p style="font-size:10px; color:var(--emerald-600); margin-top:2px; margin-bottom:8px;">
              Downloads a <code>.json</code> file with all students, payments, receipts, and Khatabook records.
            </p>
            <button class="btn-primary" style="width:100%; padding:10px;" onclick="triggerDownloadBackupJSON()">
              📥 Download Backup File (.json)
            </button>
          </div>

          <!-- Section 2: Import Restore -->
          <div style="padding:12px; background:rgba(37,75,51,0.06); border:1px solid var(--card-border); border-radius:14px; margin-bottom:10px;">
            <strong style="font-size:12px; color:var(--emerald-950);">📤 Step 2: Restore Backup on New Device</strong>
            <p style="font-size:10px; color:var(--emerald-600); margin-top:2px; margin-bottom:8px;">
              Got a new phone or lost device? Upload your saved <code>.json</code> backup file to restore all records instantly!
            </p>
            <input type="file" id="backupFileInput" accept=".json" style="display:none;" onchange="handleImportBackupFile(event)" />
            <button class="btn-secondary" style="width:100%; padding:10px;" onclick="document.getElementById('backupFileInput').click()">
              📤 Upload & Restore Backup File
            </button>
          </div>

          <button class="btn-secondary" style="width:100%; padding:8px;" onclick="closeModal()">Close</button>
        </div>
      </div>
    `;
  }

  // Modal 4: Edit Student Modal
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

  // Modal 5: Board Student List Drawer
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
                    ${renderStatusBadge(fin.dueStatus, fin.totalCurrentDue, fin.cycleNextRenewal)}
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

  // Modal 6: Student Profile Drawer (Crystal Clear Coaching Cycle UI)
  else if (activeModal === 'student-profile' && profileStudentId) {
    const fin = db.calculateStudentFinancials(profileStudentId);
    if (!fin) return;
    const avatar = fin.student.gender === 'Female' ? '👧' : '👦';
    const isLeft = fin.student.status === 'Left';
    const isOverdue = fin.dueStatus === 'OVERDUE';
    // ALWAYS FETCH STUDENT PAYMENTS NEWEST-FIRST AT TOP!
    const studentPayments = db.getPaymentsByStudent(profileStudentId);

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="student-avatar" style="width:42px; height:42px; font-size:20px;">${avatar}</span>
              <div>
                <h3 class="modal-title">${fin.student.name}</h3>
                <div style="font-size:10px; color:var(--emerald-600);">
                  ${fin.student.class} ${fin.student.board ? '• ' + fin.student.board : ''} ${fin.student.status !== 'Active' ? '• STATUS: ' + fin.student.status.toUpperCase() : ''}
                </div>
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="btn-secondary" style="padding:4px 8px; font-size:10px;" onclick="openModal('edit-student', ${fin.student.id})">✏️ Edit</button>
              <button class="close-btn" onclick="closeModal()">✕</button>
            </div>
          </div>

          <!-- Total Dues Summary Header Card -->
          <div class="formula-box" style="margin-top:4px; margin-bottom:8px; ${isOverdue ? 'background:rgba(254,242,242,0.95); border-left-color:#DC2626;' : ''}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span style="font-size:10px; color:var(--emerald-600);">Monthly Fee: ₹${fin.student.monthly_fee} • Joined: ${db.formatDisplayDate(fin.student.joining_date)}</span>
                <div style="font-size:14px; font-weight:800; color:${isOverdue ? '#DC2626' : 'var(--emerald-950)'};">
                  ${isLeft ? 'Outstanding Left Tuition Dues' : isOverdue ? '🔴 Overdue Pending Tuition Dues' : 'Current Active Month Fee'}
                </div>
              </div>
              <div style="font-size:20px; font-weight:800; color:${isOverdue ? '#DC2626' : fin.totalCurrentDue === 0 ? '#254B33' : 'var(--emerald-950)'};">₹${fin.totalCurrentDue}</div>
            </div>
          </div>

          <!-- Simple, Crystal Clear Coaching Cycle Card -->
          <div style="padding:10px 12px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:14px; margin-bottom:10px; font-size:11px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <span style="color:var(--emerald-600); font-weight:700;">🗓️ Current Monthly Cycle:</span>
              <div style="font-weight:800; color:var(--emerald-950); font-size:11px; margin-top:2px;">${fin.cyclePeriodStr}</div>
            </div>
            <div>
              <span style="color:var(--emerald-600); font-weight:700;">⏰ Next Fee Due Date:</span>
              <div style="font-weight:800; color:${isOverdue ? '#DC2626' : '#254B33'}; font-size:11px; margin-top:2px;">${fin.cycleNextRenewal}</div>
            </div>
          </div>

          <!-- KHATABOOK EXTRA CHARGES LEDGER SECTION (RED FOR UNPAID) -->
          <div style="padding:10px; background:rgba(254, 242, 242, 0.9); border:1.5px solid rgba(220, 38, 38, 0.4); border-radius:14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div>
                <strong style="font-size:11px; color:#DC2626;">🛍️ Khatabook Extra Charges (Udhaar)</strong>
                <div style="font-size:9px; color:#DC2626; font-weight:700;">
                  ${fin.unpaidKhataTotal > 0 ? `Unpaid Total: ₹${fin.unpaidKhataTotal}` : 'No Pending Khata Dues'}
                </div>
              </div>
              <button class="btn-primary" style="padding:4px 8px; font-size:10px; background:#DC2626; border-color:#DC2626;" onclick="openModal('add-khata')">
                ➕ Add Item
              </button>
            </div>

            <div style="max-height:110px; overflow-y:auto;">
              ${fin.extraCharges.length > 0 ? fin.extraCharges.map(item => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:#FFFFFF; border:1px solid ${item.status === 'UNPAID' ? 'rgba(220,38,38,0.4)' : 'var(--card-border)'}; border-radius:10px; margin-bottom:4px; font-size:10px;">
                  <div>
                    <strong style="color:${item.status === 'UNPAID' ? '#DC2626' : 'var(--emerald-950)'};">${item.item_name}</strong>
                    <div style="font-size:8px; color:var(--emerald-600);">${db.formatDisplayDate(item.added_date)} ${item.status === 'UNPAID' ? '• 🔴 UNPAID' : '• ✓ PAID (' + item.payment_mode + ')'}</div>
                  </div>
                  <div style="text-align:right; display:flex; align-items:center; gap:6px;">
                    <strong style="font-size:12px; color:${item.status === 'UNPAID' ? '#DC2626' : '#254B33'};">₹${item.amount}</strong>
                    ${item.status === 'UNPAID' ? `
                      <button class="btn-primary" style="padding:3px 7px; font-size:9px; background:#254B33;" onclick="triggerKhataClearInAppModal(${item.id}, '${item.item_name.replace(/'/g, "\\'")}', ${item.amount}, '${fin.student.name.replace(/'/g, "\\'")}')">💳 Clear</button>
                    ` : `
                      <span class="badge badge-paid" style="font-size:8px;">PAID</span>
                    `}
                  </div>
                </div>
              `).join('') : `
                <div style="text-align:center; padding:8px; color:var(--emerald-600); font-size:10px;">No extra charges added yet.</div>
              `}
            </div>
          </div>

          <!-- Section A: Month-by-Month Baseline Audit Breakdown -->
          <h4 style="font-size:11px; font-weight:800; color:var(--emerald-800); margin-bottom:6px;">Month-by-Month Cycle Breakdown</h4>
          <div style="max-height:110px; overflow-y:auto; margin-bottom:10px;">
            ${fin.billingMonths.map(bm => `
              <div class="month-pending-row">
                <div>
                  <strong>Cycle: ${bm.cycleLabel}</strong>
                  <div style="font-size:9px; color:var(--emerald-600);">Baseline Fee: ₹${bm.baseFee}</div>
                </div>
                <div>
                  ${bm.isPaid ? 
                    `<span class="badge badge-paid">✓ PAID</span>` : 
                    isOverdue ? 
                    `<span class="badge badge-overdue">🔴 PENDING ₹${bm.remainingBalance}</span>` : 
                    `<span class="badge badge-upcoming" style="font-size:8px;">🟡 ACTIVE MONTH (Due ${fin.cycleNextRenewal})</span>`
                  }
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Section B: Payment Transaction & Digital Receipt History (ALWAYS NEWEST FIRST AT TOP!) -->
          <h4 style="font-size:11px; font-weight:800; color:var(--emerald-800); margin-bottom:6px;">Payment Receipts & Transaction Log 🧾</h4>
          <div style="max-height:110px; overflow-y:auto; margin-bottom:12px;">
            ${studentPayments.length > 0 ? studentPayments.map(p => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--emerald-50); border:1px solid var(--card-border); border-radius:10px; margin-bottom:4px; font-size:10px;">
                <div>
                  <strong style="color:var(--emerald-950);">₹${p.paid_amount + (p.extra_charge_amount || 0)} Paid</strong> (${p.payment_mode})
                  <div style="font-size:9px; color:var(--emerald-600);">
                    ${p.month} ${p.year} • Date: ${db.formatDisplayDate(p.payment_date)}
                    ${p.extra_item_name ? ' • Extra: ' + p.extra_item_name + ' (₹' + p.extra_charge_amount + ')' : ''}
                  </div>
                </div>
                <div style="display:flex; gap:4px;">
                  <button class="btn-secondary" style="padding:3px 6px; font-size:9px;" onclick="openModal('receipt', ${p.id})">Receipt</button>
                  <button class="btn-secondary" style="padding:3px 6px; font-size:9px; color:#DC2626; border-color:rgba(220,38,38,0.3);" onclick="handleVoidPayment(${p.id})">Void</button>
                </div>
              </div>
            `).join('') : `
              <div style="text-align:center; padding:10px; color:var(--emerald-600); font-size:10px;">No transaction receipts logged yet.</div>
            `}
          </div>

          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="flex:1; padding:10px;" onclick="closeModal(); switchTab('collect'); onStudentSelectForCollect(${fin.student.id});">
              💳 Collect Fee
            </button>
            <button class="btn-secondary" style="border-color:var(--status-overdue-text); color:var(--status-overdue-text); padding:10px;" onclick="handleDeleteStudent(${fin.student.id})">
              🗑️ Delete Student
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Modal 7: Calendar Day Details Bottom Sheet
  else if (activeModal === 'calendar-day' && selectedCalendarDay) {
    const students = db.getStudents();
    const dueStudents = students.filter(s => s.status === 'Active' && new Date(s.joining_date).getDate() === selectedCalendarDay);
    const currentMonthName = MONTH_NAMES[calendarViewMonthIdx];

    container.innerHTML = `
      <div class="modal-overlay" onclick="closeModal()">
        <div class="modal-content" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">${currentMonthName} ${selectedCalendarDay}, ${calendarViewYear} - Dues Timeline</h3>
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
                    ${renderStatusBadge(fin.dueStatus, fin.totalCurrentDue, fin.cycleNextRenewal)}
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

  // Modal 8: Dashboard Pending Dues List
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
              <div class="student-card-item" onclick="closeModal(); openModal('student-profile', ${item.student.id});" style="margin-bottom:8px; ${item.student.status === 'Left' ? 'background:rgba(254,242,242,0.85); border:1px solid rgba(220,38,38,0.3);' : ''}">
                <div style="display:flex; align-items:center; gap:8px;">
                  <span class="student-avatar">${item.student.gender === 'Female' ? '👧' : '👦'}</span>
                  <div>
                    <div style="font-size:12px; font-weight:700; color:var(--emerald-950); flex-wrap:wrap; display:flex; align-items:center; gap:4px;">
                      ${item.student.name}
                      ${item.student.status === 'Left' ? '<span class="badge badge-due" style="font-size:8px; background:rgba(220,38,38,0.15); color:#DC2626;">LEFT</span>' : ''}
                    </div>
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

  // Modal 9: Digital Receipt Sheet (with Void / Cancel Button!)
  else if (activeModal === 'receipt' && receiptData) {
    const totalCollected = receiptData.payment.paid_amount + (receiptData.payment.extra_charge_amount || 0);

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
              <span>Student:</span><strong>${receiptData.student.name} (${receiptData.student.class || ''})</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Period:</span><strong>${receiptData.payment.month} ${receiptData.payment.year}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Payment Date:</span><strong style="color:var(--emerald-950);">${db.formatDisplayDate(receiptData.payment.payment_date)} (${receiptData.payment.payment_mode})</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span>Coaching Fee Paid:</span><strong>₹${receiptData.payment.paid_amount}</strong>
            </div>
            ${receiptData.payment.extra_item_name ? `
              <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--emerald-800);">
                <span>Extra (${receiptData.payment.extra_item_name}):</span><strong>₹${receiptData.payment.extra_charge_amount}</strong>
              </div>
            ` : ''}
            <div style="display:flex; justify-content:space-between; margin-bottom:4px; padding-top:4px; border-top:1px dashed var(--card-border);">
              <span>Total Received:</span><strong style="font-size:13px; color:#254B33;">₹${totalCollected}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>Remaining Balance:</span><strong>₹${receiptData.remainingArrears || 0}</strong>
            </div>
            ${receiptData.advanceCredit > 0 ? `
              <div style="display:flex; justify-content:space-between; margin-top:4px; color:#254B33;">
                <span>Advance Credit Added:</span><strong>₹${receiptData.advanceCredit}</strong>
              </div>
            ` : ''}
          </div>

          <div style="display:flex; gap:8px; margin-top:12px;">
            <button class="btn-primary" style="flex:2; padding:10px;" onclick="closeModal()">Done</button>
            <button class="btn-secondary" style="flex:1; padding:10px; color:#DC2626; border-color:rgba(220,38,38,0.4);" onclick="handleVoidPayment(${receiptData.payment.id})">
              ↩️ Cancel Payment
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

window.executeCustomConfirm = function() {
  if (customAlertState && typeof customAlertState.onConfirmCallback === 'function') {
    const cb = customAlertState.onConfirmCallback;
    customAlertState = null;
    closeModal();
    cb();
  } else {
    closeModal();
  }
};

window.handleVoidPayment = function(paymentId) {
  const payment = db.getPaymentById(paymentId);
  if (!payment) return;
  const student = db.getStudentById(payment.student_id);
  const totalAmt = payment.paid_amount + (payment.extra_charge_amount || 0);

  showAppConfirm(
    'Void & Cancel Payment',
    `⚠️ Are you sure you want to void & cancel this payment of ₹${totalAmt} for ${student ? student.name : 'Student'}?\n\nThis will reverse the fee back to unpaid status in the student's dues ledger.`,
    () => {
      db.deletePayment(paymentId);
      closeModal();
      renderCurrentTab();
      showAppAlert('Payment Voided', `Payment transaction of ₹${totalAmt} has been cancelled and reversed.`);
    }
  );
};

// Backup & Restore Handlers
window.triggerDownloadBackupJSON = function() {
  const jsonStr = db.exportBackupJSON();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `Anshu_Coaching_Backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

window.handleImportBackupFile = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const result = db.importBackupJSON(e.target.result);
    if (result.success) {
      showAppAlert('Backup Restored', `✅ Backup Restored Successfully! Restored ${result.studentCount} student records.`);
      renderCurrentTab();
    } else {
      showAppAlert('Restore Failed', `❌ Backup Restore Failed: ${result.error}`);
    }
  };
  reader.readAsText(file);
};

// Khata Modal Preset Helper
window.applyKhataModalPreset = function(itemName, price) {
  const nameInput = document.getElementById('khata_modal_item_name');
  const priceInput = document.getElementById('khata_modal_amount');
  if (nameInput && priceInput) {
    nameInput.value = itemName;
    priceInput.value = price;
  }
};

window.handleAddKhataSubmit = function(event) {
  event.preventDefault();
  const form = event.target;
  const studentId = form.student_id.value;
  const itemName = form.item_name.value;
  const amount = form.amount.value;
  const addedDate = form.added_date.value;

  db.addExtraCharge({
    student_id: studentId,
    item_name: itemName,
    amount: amount,
    added_date: addedDate
  });

  closeModal();
  renderCurrentTab(); // Instant real-time background re-render!
  openModal('student-profile', studentId);
};

window.triggerKhataClearInAppModal = function(chargeId, itemName, amount, studentName) {
  openModal('clear-khata-modal', {
    chargeId,
    item_name: itemName,
    amount,
    student_name: studentName
  });
};

window.submitClearKhataPayment = function(event) {
  event.preventDefault();
  const form = event.target;
  const paymentMode = form.clear_payment_mode.value;

  if (!activeKhataItemToClear) return;

  const result = db.clearExtraCharge(activeKhataItemToClear.chargeId, paymentMode);

  renderCurrentTab(); // Instant real-time background re-render!

  if (result && result.payment) {
    const student = db.getStudentById(result.charge.student_id);
    receiptData = {
      payment: result.payment,
      student: student || { name: 'Student', class: '' },
      totalPayable: result.charge.amount,
      remainingArrears: 0
    };
    openModal('receipt');
  }
};

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

  showAppConfirm(
    'Delete Student Permanently',
    `⚠️ Are you sure you want to permanently delete student "${student.name}" (${student.class})?\n\nThis action CANNOT be undone and all fee history records for this student will be erased.`,
    () => {
      db.deleteStudent(studentId);
      closeModal();
      renderCurrentTab();
    }
  );
};

window.resetDemoData = function() {
  showAppConfirm('Reset Demo System Data', 'Reset all system data to original sample dataset?', () => {
    db.resetToDefaults();
    renderCurrentTab();
  });
};
