(function (window, document) {
  'use strict';

  const statusEl = document.getElementById('scanner-status');
  if (!statusEl) return;

  const resultName = document.getElementById('result-name');
  const resultScanType = document.getElementById('result-scan-type');
  const resultTime = document.getElementById('result-time');
  const resultStatus = document.getElementById('result-status');
  const resultMessage = document.getElementById('result-message');
  const restartBtn = document.getElementById('restart-btn');
  const soundBtn = document.getElementById('sound-toggle-btn');
  const clockEl = document.getElementById('clock');

  let qrScanner = null;
  let isProcessing = false;
  let lastToken = '';
  let lastTokenAt = 0;
  let soundOn = true;

  const cooldownMs = (window.APP_CONFIG && window.APP_CONFIG.LOCAL_SCAN_COOLDOWN_MS) || 4000;
  const deviceName = (window.APP_CONFIG && window.APP_CONFIG.DEVICE_NAME) || 'Front Desk Webcam';

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status-line ${type || 'status-warn'}`;
  }

  function setResult({ employee, scanType, timestamp, ok, message }) {
    resultName.textContent = employee || 'Unknown';
    resultScanType.textContent = scanType || '—';
    resultTime.textContent = timestamp || new Date().toLocaleString();
    resultMessage.textContent = message || '—';
    resultStatus.textContent = ok ? 'Success' : 'Error';
    resultStatus.className = `badge ${ok ? 'success' : 'danger'}`;
  }

  function pingSound(isSuccess) {
    if (!soundOn || !window.AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = isSuccess ? 900 : 320;
    gain.gain.value = 0.03;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
    osc.onended = () => ctx.close();
  }

  async function handleScan(decodedText) {
    const now = Date.now();
    if (isProcessing) return;

    if (decodedText === lastToken && now - lastTokenAt < cooldownMs) {
      setStatus('Same QR recently scanned. Waiting for cooldown...', 'status-warn');
      return;
    }

    isProcessing = true;
    lastToken = decodedText;
    lastTokenAt = now;

    setStatus('QR detected. Sending attendance event...', 'status-warn');

    try {
      const data = await window.AppApi.post({
        action: 'scan',
        qr_token: decodedText,
        device: deviceName
      });

      const ok = !!(data && (data.success || data.status === 'success'));
      const payload = data && (data.data || data.record || data.result || {});
      setResult({
        employee: payload.full_name || payload.employee_name || payload.employee || payload.employee_id,
        scanType: payload.scan_type || payload.step || data.scan_type,
        timestamp: payload.timestamp || payload.datetime || new Date().toLocaleString(),
        ok,
        message: data.message || (ok ? 'Scan accepted.' : 'Scan failed.')
      });

      pingSound(ok);
      setStatus(ok ? 'Ready for next scan.' : 'Backend returned an error.', ok ? 'status-ok' : 'status-error');
    } catch (error) {
      setResult({ ok: false, message: error.message || 'Could not send scan.' });
      pingSound(false);
      setStatus('Failed to submit scan. Please retry.', 'status-error');
    } finally {
      isProcessing = false;
    }
  }

  function handleScanError() {
    // Intentionally quiet to avoid noisy UI updates on each decode attempt.
  }

  async function startScanner() {
    if (!window.Html5Qrcode) {
      setStatus('Scanner library failed to load. Please refresh.', 'status-error');
      return;
    }

    if (qrScanner) {
      try { await qrScanner.stop(); } catch (_e) {}
      try { await qrScanner.clear(); } catch (_e) {}
    }

    qrScanner = new Html5Qrcode('reader');
    setStatus('Requesting camera permission...', 'status-warn');

    try {
      const devices = await Html5Qrcode.getCameras();
      if (!devices || !devices.length) {
        setStatus('No camera found. Connect a webcam and try again.', 'status-error');
        return;
      }

      await qrScanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 280, height: 280 } },
        handleScan,
        handleScanError
      );

      setStatus('Scanner active. Ready for QR scans.', 'status-ok');
    } catch (error) {
      const message = (error && error.message) || '';
      if (message.toLowerCase().includes('permission')) {
        setStatus('Camera permission denied. Please allow access and restart.', 'status-error');
      } else {
        setStatus('Unable to start scanner. Check camera connection.', 'status-error');
      }
    }
  }

  restartBtn.addEventListener('click', () => {
    startScanner();
  });

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
  });

  setInterval(() => {
    if (clockEl) clockEl.textContent = `Local Time: ${new Date().toLocaleString()}`;
  }, 1000);

  startScanner();
})(window, document);
