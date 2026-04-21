(function (window, document) {
  'use strict';

  const tbody = document.getElementById('employees-tbody');
  if (!tbody) return;

  const statusEl = document.getElementById('employee-admin-status');
  const refreshBtn = document.getElementById('refresh-employees-btn');
  const generateTokensBtn = document.getElementById('generate-tokens-btn');
  const generateQrUrlsBtn = document.getElementById('generate-qr-urls-btn');
  const addEmployeeBtn = document.getElementById('add-employee-btn');

  const employeeIdInput = document.getElementById('employee-id-input');
  const fullNameInput = document.getElementById('full-name-input');
  const departmentInput = document.getElementById('department-input');
  const statusInput = document.getElementById('status-input');

  let rows = [];
  let busyCount = 0;
  let activeRequests = new Set();

  function setStatus(message, tone) {
    statusEl.textContent = message;
    statusEl.className = `status-line ${tone || 'muted'}`;
  }

  function setBusy(isBusy) {
    busyCount += isBusy ? 1 : -1;
    if (busyCount < 0) busyCount = 0;
    const disabled = busyCount > 0;
    refreshBtn.disabled = disabled;
    generateTokensBtn.disabled = disabled;
    generateQrUrlsBtn.disabled = disabled;
    addEmployeeBtn.disabled = disabled;
  }

  function sanitize(value) {
    return String(value || '').replace(/[&<>'"]/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[char]));
  }

  function statusBadge(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return '<span class="badge success">Active</span>';
    if (normalized === 'inactive') return '<span class="badge warning">Inactive</span>';
    return `<span class="badge">${sanitize(status || 'Unknown')}</span>`;
  }

  function qrCell(row) {
    if (!row.qr_image_url) return '<span class="badge warning">No QR yet</span>';
    return `<a href="${sanitize(row.qr_image_url)}" target="_blank" rel="noopener" class="btn secondary">Open QR</a>`;
  }

  function renderTable() {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7">No employees found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map((row) => `
        <tr>
          <td>${sanitize(row.employee_id)}</td>
          <td>${sanitize(row.full_name)}</td>
          <td>${sanitize(row.department)}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${row.qr_token ? sanitize(row.qr_token) : '<span class="badge warning">No token</span>'}</td>
          <td>${qrCell(row)}</td>
          <td>
            <div class="actions">
              <button class="btn secondary" data-action="regenerate" data-id="${sanitize(row.employee_id)}" type="button">Regenerate Token</button>
              <button class="btn secondary" data-action="view" data-id="${sanitize(row.employee_id)}" type="button">View QR</button>
              <button class="btn secondary" data-action="print" data-id="${sanitize(row.employee_id)}" type="button">Print QR</button>
            </div>
          </td>
        </tr>
      `)
      .join('');
  }

  function getEmployeeById(employeeId) {
    return rows.find((row) => String(row.employee_id) === String(employeeId));
  }

  function clearForm() {
    employeeIdInput.value = '';
    fullNameInput.value = '';
    departmentInput.value = '';
    statusInput.value = 'Active';
  }

  async function loadEmployees(showLoading) {
    setBusy(true);
    if (showLoading) setStatus('Loading employees...', 'muted');

    try {
      const response = await window.AppApi.get('employees');
      if (!response || response.success === false) {
        throw new Error((response && response.message) || 'Failed to load employees.');
      }

      const incomingRows = response.rows || response.data || [];
      rows = Array.isArray(incomingRows) ? incomingRows : [];
      renderTable();
      setStatus(`Loaded ${rows.length} employee record(s).`, 'status-ok');
    } catch (error) {
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7">Failed to load employees.</td></tr>';
      }
      setStatus(error.message || 'Failed to load employees.', 'status-error');
    } finally {
      setBusy(false);
    }
  }

  async function postAction(payload, successMessage) {
    const actionKey = payload.action + (payload.employee_id || '');
    if (activeRequests.has(actionKey)) return;

    activeRequests.add(actionKey);
    setBusy(true);

    try {
      const response = await window.AppApi.post(payload);
      if (!response || response.success === false) {
        throw new Error((response && response.message) || 'Action failed.');
      }

      setStatus((response && response.message) || successMessage, 'status-ok');
      await loadEmployees(false);
      return true;
    } catch (error) {
      setStatus(error.message || 'Action failed.', 'status-error');
      return false;
    } finally {
      activeRequests.delete(actionKey);
      setBusy(false);
    }
  }

  async function onAddEmployee() {
    const employee_id = employeeIdInput.value.trim().toUpperCase();
    const full_name = fullNameInput.value.trim();
    const department = departmentInput.value.trim();
    const status = statusInput.value;

    if (!employee_id || !full_name || !department) {
      setStatus('Employee ID, Full Name, and Department are required.', 'status-warn');
      return;
    }

    const ok = await postAction(
      {
        action: 'addEmployee',
        employee_id,
        full_name,
        department,
        status
      },
      'Employee added successfully.'
    );

    if (ok) clearForm();
  }

  function viewQr(row) {
    if (!row || !row.qr_image_url) {
      setStatus('No QR URL is available for this employee yet.', 'status-warn');
      return;
    }
    window.open(row.qr_image_url, '_blank', 'noopener');
  }

  function printQr(row) {
    if (!row || !row.qr_image_url) {
      setStatus('No QR URL is available for this employee yet.', 'status-warn');
      return;
    }

    const popup = window.open('', '_blank', 'width=560,height=700');
    if (!popup) {
      setStatus('Popup blocked. Please allow popups to print QR cards.', 'status-error');
      return;
    }

    popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Print QR - ${sanitize(row.employee_id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; max-width: 360px; margin: 0 auto; text-align: center; }
            .name { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
            .meta { color: #444; margin: 3px 0; }
            img { width: 260px; height: 260px; object-fit: contain; margin-top: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <p class="name">${sanitize(row.full_name)}</p>
            <p class="meta">Employee ID: ${sanitize(row.employee_id)}</p>
            <p class="meta">Department: ${sanitize(row.department)}</p>
            <img src="${sanitize(row.qr_image_url)}" alt="QR Code" />
          </div>
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  tbody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const action = target.dataset.action;
    const employeeId = target.dataset.id;
    const row = getEmployeeById(employeeId);

    if (action === 'regenerate') {
      await postAction(
        {
          action: 'regenerateToken',
          employee_id: employeeId
        },
        `Token regenerated for ${employeeId}.`
      );
      return;
    }

    if (action === 'view') {
      viewQr(row);
      return;
    }

    if (action === 'print') {
      printQr(row);
    }
  });

  refreshBtn.addEventListener('click', () => loadEmployees(true));
  generateTokensBtn.addEventListener('click', () =>
    postAction(
      {
        action: 'generateTokens'
      },
      'Missing tokens generated.'
    )
  );
  generateQrUrlsBtn.addEventListener('click', () =>
    postAction(
      {
        action: 'generateQrUrls'
      },
      'QR URLs generated.'
    )
  );
  addEmployeeBtn.addEventListener('click', onAddEmployee);

  loadEmployees(true);
})(window, document);
