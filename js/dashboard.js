(function (window, document) {
  'use strict';

  const tbody = document.getElementById('dashboard-tbody');
  if (!tbody) return;

  const searchInput = document.getElementById('search-input');
  const refreshBtn = document.getElementById('refresh-btn');
  const statusEl = document.getElementById('dashboard-status');
  const lastRefreshEl = document.getElementById('last-refresh');
  const statTotal = document.getElementById('stat-total');
  const statCompleted = document.getElementById('stat-completed');
  const statIncomplete = document.getElementById('stat-incomplete');
  const statLate = document.getElementById('stat-late');

  let rows = [];
  let isRefreshing = false;
  let pendingRefresh = false;
  const refreshMs = (window.APP_CONFIG && window.APP_CONFIG.DASHBOARD_REFRESH_MS) || 45000;

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = `status-line ${type || 'muted'}`;
  }

  function toBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s.includes('late')) return '<span class="badge danger">Late</span>';
    if (s.includes('complete')) return '<span class="badge success">Completed</span>';
    if (s.includes('incomplete')) return '<span class="badge warning">Incomplete</span>';
    if (s.includes('break')) return '<span class="badge warning">Currently On Break</span>';
    return `<span class="badge">${status || 'Unknown'}</span>`;
  }

  function rowClass(status, breakOut, breakIn) {
    const s = String(status || '').toLowerCase();
    const onBreak = breakOut && !breakIn;
    return [
      s.includes('complete') ? 'row-completed' : '',
      s.includes('incomplete') || onBreak ? 'row-incomplete' : '',
      s.includes('late') ? 'row-late' : ''
    ].join(' ');
  }

  function renderTable() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      const id = String(r.employee_id || '').toLowerCase();
      const name = String(r.full_name || '').toLowerCase();
      return !q || id.includes(q) || name.includes(q);
    });

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10">No records found for current filter.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered
      .map((r) => {
        const statusText = r.status || (r.break_out && !r.break_in ? 'Currently On Break' : 'Incomplete');
        return `<tr class="${rowClass(statusText, r.break_out, r.break_in)}">
          <td>${r.employee_id || '—'}</td>
          <td>${r.full_name || '—'}</td>
          <td>${r.date || '—'}</td>
          <td>${r.time_in || '—'}</td>
          <td>${r.break_out || '—'}</td>
          <td>${r.break_in || '—'}</td>
          <td>${r.time_out || '—'}</td>
          <td>${r.total_hours || '—'}</td>
          <td>${toBadge(statusText)}</td>
          <td>${r.remarks || '—'}</td>
        </tr>`;
      })
      .join('');
  }

  function renderStats() {
    const total = rows.length;
    const completed = rows.filter((r) => String(r.status || '').toLowerCase().includes('complete')).length;
    const late = rows.filter((r) => String(r.status || '').toLowerCase().includes('late')).length;
    const incomplete = total - completed;

    statTotal.textContent = String(total);
    statCompleted.textContent = String(completed);
    statIncomplete.textContent = String(incomplete);
    statLate.textContent = String(late);
  }

  async function loadDashboard(forceStatus) {
    if (isRefreshing) {
      pendingRefresh = true;
      return;
    }

    isRefreshing = true;
    refreshBtn.disabled = true;
    if (forceStatus || !rows.length) {
      setStatus('Loading dashboard...', 'muted');
    }

    try {
      const data = await window.AppApi.get('dashboard');
      const incoming = data && (data.records || data.data || data.rows);
      rows = Array.isArray(incoming) ? incoming : [];

      renderStats();
      renderTable();
      setStatus(rows.length ? 'Dashboard up to date.' : 'No attendance records returned for today.', 'status-ok');
      lastRefreshEl.textContent = new Date().toLocaleString();
    } catch (error) {
      setStatus(error.message || 'Could not load dashboard.', 'status-error');
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="10">Failed to load data. Please retry.</td></tr>';
      }
    } finally {
      isRefreshing = false;
      refreshBtn.disabled = false;
      if (pendingRefresh) {
        pendingRefresh = false;
        loadDashboard(false);
      }
    }
  }

  searchInput.addEventListener('input', renderTable);
  refreshBtn.addEventListener('click', () => loadDashboard(true));

  loadDashboard(true);
  window.setInterval(() => loadDashboard(false), refreshMs);
})(window, document);
