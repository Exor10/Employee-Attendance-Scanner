(function (window) {
  'use strict';

  window.APP_CONFIG = {
    API_BASE_URL:
      'https://script.google.com/macros/s/AKfycbyRBQ_W-55M7TtREZmwqV7cqNXBiDXLuHGpiylsEIdm9a7oyrGY0xd0j94DXBSshy4/exec',
    DEVICE_NAME: 'Front Desk Webcam',
    LOCAL_SCAN_COOLDOWN_MS: 1800,
    SCAN_PROCESSING_LOCK_MS: 700,
    SCAN_RESULT_RESET_MS: 5000,
    SCANNER_FPS: 15,
    SCANNER_QRBOX_SIZE: 300,
    SCANNER_ASPECT_RATIO: 1.777,
    SCANNER_DISABLE_FLIP: true,
    DASHBOARD_REFRESH_MS: 45000
  };
})(window);
