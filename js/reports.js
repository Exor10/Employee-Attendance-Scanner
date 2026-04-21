(function (window, document) {
  'use strict';

  const employeeInput = document.getElementById('employee-id-input');
  if (!employeeInput) return;

  const loadBtn = document.getElementById('load-summary-btn');
  const csvBtn = document.getElementById('csv-btn');
  const printBtn = document.getElementById('print-btn');
  const statusEl = document.getElementById('reports-status');
  const tbody = document.getElementById('reports-tbody');

  const sumPresent = document.getElementById('sum-present');
  const sumCompleted = document.getElementById('sum-completed');
  const sumLate = document.getElementById('sum-late');
  const sumHours = document.getElementById('sum-hours');

  let visibleRows = [];

  function setStatus(text, type) {
    statusEl.textContent = text;
    statusEl.className = `status-line ${type || 'muted'}`;
  }

  function renderSummary(summary) {
    sumPresent.textContent = summary.present_days ?? summary.presentDays ?? 0;
    sumCompleted.textContent = summary.completed_days ?? summary.completedDays ?? 0;
    sumLate.textContent = summary.late_days ?? summary.lateDays ?? 0;
    sumHours.textContent = summary.total_worked_hours ?? summary.totalWorkedHours ?? '0';
  }

  function renderTable(rows) {
    visibleRows = rows;
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8">No attendance history found for this employee.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((r) => `<tr>
        <td>${r.date || '—'}</td>
        <td>${r.time_in || '—'}</td>
        <td>${r.break_out || '—'}</td>
        <td>${r.break_in || '—'}</td>
        <td>${r.time_out || '—'}</td>
        <td>${r.total_hours || '—'}</td>
        <td>${r.status || '—'}</td>
        <td>${r.remarks || '—'}</td>
      </tr>`)
      .join('');
  }

  function exportCsv() {
    if (!visibleRows.length) {
      setStatus('No rows to export. Load a summary first.', 'status-warn');
      return;
    }

    const headers = ['Date', 'Time In', 'Break Out', 'Break In', 'Time Out', 'Total Hours', 'Status', 'Remarks'];
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const lines = [headers.join(',')].concat(
      visibleRows.map((r) =>
        [r.date, r.time_in, r.break_out, r.break_in, r.time_out, r.total_hours, r.status, r.remarks]
          .map(escape)
          .join(',')
      )
    );

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${employeeInput.value.trim() || 'employee'}-attendance.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function loadSummary() {
    const employeeId = employeeInput.value.trim().toUpperCase();
    if (!employeeId) {
      setStatus('Please enter an employee ID.', 'status-warn');
      employeeInput.focus();
      return;
    }

    setStatus('Loading employee summary...', 'muted');
    loadBtn.disabled = true;

    try {
      const data = await window.AppApi.get('employeeSummary', { employee_id: employeeId });
      const summary = data && (data.summary || data.data || {});
      const rows = data && (data.history || data.records || []);

      renderSummary(summary);
      renderTable(Array.isArray(rows) ? rows : []);
      setStatus('Summary loaded successfully.', 'status-ok');
    } catch (error) {
      setStatus(error.message || 'Could not load employee summary.', 'status-error');
      renderSummary({});
      renderTable([]);
    } finally {
      loadBtn.disabled = false;
    }
  }

  loadBtn.addEventListener('click', loadSummary);
  employeeInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') loadSummary();
  });
  csvBtn.addEventListener('click', exportCsv);
  printBtn.addEventListener('click', () => window.print());
})(window, document);
