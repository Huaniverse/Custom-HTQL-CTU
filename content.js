// HTQL Custom Theme - Content Script
// Xóa tất cả CSS gốc và áp dụng giao diện Modern Glassmorphism theo mẫu

(function () {
  "use strict";

  // Chèn overlay đen ngay khi script chạy (document_start) để tránh flash nội dung gốc.
  // Sẽ được fade-out sau khi theme áp dụng xong.
  (function () {
    const ov = document.createElement('div');
    ov.id = 'htql-fade-overlay';
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'background:#000', 'opacity:1', 'pointer-events:none',
      'transition:opacity 380ms ease',
      'will-change:opacity',
    ].join(';');
    (document.documentElement || document).appendChild(ov);
  })();

  const DEFAULT_BG_URL = chrome.runtime.getURL('background.png');
  let observer;

  const DEFAULTS = {
    glassOpacity: 0.3,
    glassBlur: 20,
    glassColor: "#ffffff",
    themeColor: "#152550",
    textColor: "#1E293B",
    fontFamily: "Plus Jakarta Sans",
    bgUrl: "",
    enabled: true,
  };

  // ============================================================
  // HELPERS
  // ============================================================
  function cssBackgroundUrl(url) {
    return `url("${String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  }

  function isVideoUrl(url) {
    return url && (url.startsWith('data:video') || /\.(mp4|webm)(\?|$)/i.test(url));
  }

  function isSolidUrl(url) {
    return url && url.startsWith('solid:');
  }

  function solidUrlToColor(url) {
    return url && url.startsWith('solid:') ? url.slice(6) : '#1a1a2e';
  }

  // Chuyển hex #rrggbb → "r,g,b"
  function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '255,255,255';
    return `${r},${g},${b}`;
  }

  function applyVideoBg(url) {
    let vid = document.getElementById('htql-video-bg');
    if (!url) {
      if (vid) {
        vid.pause();
        vid.src = '';
        vid.load();
        vid.remove();
      }
      return;
    }
    if (!vid) {
      vid = document.createElement('video');
      vid.id = 'htql-video-bg';
      vid.style.cssText = [
        'position:fixed', 'inset:0', 'width:100%', 'height:100%',
        'object-fit:cover', 'z-index:-1', 'pointer-events:none',
        'will-change:transform', 'transform:translateZ(0)',
      ].join(';');
      vid.autoplay = true;
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.disablePictureInPicture = true;
      vid.preload = 'auto';
      // Tạm dừng khi tab bị ẩn, resume khi tab hiện lại
      document.addEventListener('visibilitychange', () => {
        if (!document.getElementById('htql-video-bg')) return;
        document.hidden ? vid.pause() : vid.play().catch(() => {});
      });
      document.body.insertBefore(vid, document.body.firstChild);
    }
    if (vid.dataset.src !== url) {
      vid.src = url;
      vid.dataset.src = url;
      vid.play().catch(() => {});
    }
  }

  // ============================================================
  // 1) XÓA & VÔ HIỆU HÓA TẤT CẢ CSS GỐC
  // ============================================================
  function disableOriginalCSS() {
    // Vô hiệu hóa stylesheets qua API
    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        if (sheet.ownerNode && sheet.ownerNode.id === "htql-custom-theme-style") {
          continue;
        }
        sheet.disabled = true;
      } catch (e) {}
    }

    // Xóa link và style elements cũ
    document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"], style').forEach(el => {
      if (el.id !== "htql-custom-theme-style") {
        try { el.disabled = true; } catch(e) {}
        el.remove();
      }
    });

    // Xóa adoptedStyleSheets
    try {
      if (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0) {
        document.adoptedStyleSheets = [];
      }
    } catch (e) {}
  }

  // ============================================================
  // 2) NHÚNG GIAO DIỆN CUSTOM CSS (GLASSMORPHISM)
  // ============================================================
  function injectCustomCSS(settings) {
    const s = settings || DEFAULTS;

    let style = document.getElementById("htql-custom-theme-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "htql-custom-theme-style";
      (document.head || document.documentElement).appendChild(style);
    }

    // Xác định ảnh nền
    const finalBgUrl = (s.bgUrl && s.bgUrl !== "") ? s.bgUrl : DEFAULT_BG_URL;
    const opacity = s.glassOpacity !== undefined ? s.glassOpacity : DEFAULTS.glassOpacity;
    const blur = s.glassBlur !== undefined ? s.glassBlur : DEFAULTS.glassBlur;
    const themeColor = s.themeColor || DEFAULTS.themeColor;
    const textColor = s.textColor || DEFAULTS.textColor;
    const fontFamily = s.fontFamily || DEFAULTS.fontFamily;

    const isSolid = isSolidUrl(finalBgUrl);
    const isVideo = isVideoUrl(finalBgUrl);
    const glassColor = s.glassColor || DEFAULTS.glassColor;
    const glassRgb = hexToRgb(glassColor);
    // rgba() không nhận CSS var dạng "r,g,b" — inject thẳng giá trị
    const gc = (a) => `rgba(${glassRgb},${a})`;

    style.textContent = `
      /* --- Thiết lập nền tảng --- */
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');
      ${(() => {
        const presets = ['Plus Jakarta Sans','Inter','Be Vietnam Pro','Nunito','Lexend','DM Sans','Outfit','Roboto','Space Grotesk','Sora','Manrope'];
        const f = s.fontFamily || DEFAULTS.fontFamily;
        if (!presets.includes(f)) {
          const encoded = f.replace(/ /g, '+');
          return `@import url('https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800&display=swap');`;
        }
        return '';
      })()}

      :root {
        --theme-glass-opacity: ${opacity};
        --theme-glass-blur: ${blur}px;
        --theme-primary-color: ${themeColor};
        --theme-text-color: ${textColor};
        --login-card-width: 440px;
        --login-sidebar-width: 380px;
        --login-edge-gap: 24px;
      }

      * {
        box-sizing: border-box !important;
      }

      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }

      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }

      /* --- Page Wrapper --- */
      .page-wrapper {
        display: flex !important;
        width: 100vw !important;
        height: 100vh !important;
        position: relative !important;
        align-items: center !important;
        justify-content: center !important;
      }

      #header, #footer {
        display: none !important;
      }

      /* --- Khu vực chính --- */
      main.center-segment {
        display: flex !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        position: relative !important;
        align-items: center !important;
        justify-content: center !important;
      }

      /* --- Căn giữa Login Container ---
         Mặc định: căn giữa màn hình hoàn toàn.
         Chỉ shift sang trái khi có sidebar (>=1024px) mà không đủ chỗ. */
      .ui.container.medium {
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        margin: 0 !important;
        max-width: none !important;
        width: auto !important;
        padding: 0 !important;
        z-index: 200 !important;
      }

      /* Khi có sidebar (>=1024px): dịch sang trái một nửa width sidebar */
      @media (min-width: 1024px) {
        .ui.container.medium {
          left: min(
            50%,
            calc(100vw - var(--login-sidebar-width) - (var(--login-card-width) / 2) - var(--login-edge-gap))
          ) !important;
        }
      }

      /* --- Modal thông báo timeout từ code gốc --- */
      #asg-modal-0 {
        display: none !important;
      }

      #asg-modal-0.active {
        display: flex !important;
        flex-direction: column !important;
        position: fixed !important;
        left: 50% !important;
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 420px !important;
        max-width: 90% !important;
        background: ${gc(opacity)} !important;
        backdrop-filter: blur(var(--theme-glass-blur)) !important;
        -webkit-backdrop-filter: blur(var(--theme-glass-blur)) !important;
        border: 1px solid ${gc(0.35)} !important;
        border-radius: 28px !important;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15) !important;
        padding: 32px !important;
        z-index: 10000 !important;
        box-sizing: border-box !important;
      }

      #asg-modal-0-title {
        font-size: 20px !important;
        font-weight: 700 !important;
        color: var(--theme-primary-color) !important;
        margin-bottom: 12px !important;
        text-align: center !important;
      }

      #asg-modal-0-description {
        font-size: 14px !important;
        color: var(--theme-text-color) !important;
        line-height: 1.5 !important;
        margin-bottom: 24px !important;
        text-align: center !important;
      }

      #asg-modal-0 .actions {
        display: flex !important;
        justify-content: center !important;
        gap: 12px !important;
        background: transparent !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      #asg-modal-0-dismiss-button, #asg-modal-0-action-button {
        border-radius: 20px !important;
        padding: 10px 24px !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        border: none !important;
      }

      #asg-modal-0-dismiss-button {
        background: rgba(0, 0, 0, 0.05) !important;
        color: var(--theme-text-color) !important;
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }

      #asg-modal-0-dismiss-button:hover {
        background: rgba(0, 0, 0, 0.1) !important;
      }

      #asg-modal-0-action-button {
        background: var(--theme-primary-color) !important;
        color: #FFFFFF !important;
      }

      #asg-modal-0-action-button:hover {
        background: var(--theme-primary-color) !important;
        filter: brightness(0.85) !important;
      }

      .ui.dimmer.modals.page {
        background: rgba(0, 0, 0, 0.25) !important;
        backdrop-filter: blur(5px) !important;
        -webkit-backdrop-filter: blur(5px) !important;
        z-index: 9999 !important;
      }

      /* --- Login Card (Glassmorphism) --- */
      .ui.segment.segment-layout {
        background: ${gc(opacity)} !important;
        backdrop-filter: blur(var(--theme-glass-blur)) !important;
        -webkit-backdrop-filter: blur(var(--theme-glass-blur)) !important;
        border: 1px solid ${gc(0.35)} !important;
        border-radius: 36px !important;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08),
                    inset 0 0 0 1px ${gc(0.2)} !important;
        width: 440px !important;
        padding: 48px 40px !important;
        margin: 0 !important;
        border-style: solid !important;
      }

      /* --- Form Elements --- */
      .ui.segment.segment-layout h3.ui.header {
        color: var(--theme-primary-color) !important;
        font-size: 36px !important;
        font-weight: 700 !important;
        text-align: center !important;
        margin-top: 0 !important;
        margin-bottom: 32px !important;
        border: none !important;
        letter-spacing: -0.5px !important;
      }

      .custom-field-label {
        display: block !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        color: var(--theme-text-color) !important;
        margin-bottom: 8px !important;
        margin-top: 20px !important;
        text-align: left !important;
      }

      .ui.form .field {
        margin: 0 !important;
      }

      .ui.form .field .ui.input {
        position: relative !important;
        display: block !important;
        width: 100% !important;
      }

      .ui.form .field .ui.input input {
        background: ${gc(0.45)} !important;
        border: 1px solid ${gc(0.3)} !important;
        border-radius: 24px !important;
        color: var(--theme-text-color) !important;
        font-family: inherit !important;
        font-size: 15px !important;
        font-weight: 500 !important;
        padding: 14px 20px 14px 46px !important;
        width: 100% !important;
        height: auto !important;
        outline: none !important;
        transition: all 0.25s ease !important;
      }

      .ui.form .field .ui.input input:focus {
        background: ${gc(0.65)} !important;
        border-color: var(--theme-primary-color) !important;
        box-shadow: 0 0 0 3px rgba(21, 37, 80, 0.15) !important;
      }

      .ui.form .field .ui.input input::placeholder {
        color: #64748B !important;
        font-weight: 400 !important;
      }

      /* Icons bên trong input */
      .ui.form .field .ui.input i.icon {
        position: absolute !important;
        left: 18px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        color: #64748B !important;
        margin: 0 !important;
        font-size: 16px !important;
        pointer-events: none !important;
      }

      /* Eye Icon toggle password */
      .ui.form .field .ui.input i.icon.right-align {
        left: auto !important;
        right: 18px !important;
        pointer-events: auto !important;
        cursor: pointer !important;
      }

      /* --- Nút đăng nhập --- */
      #sign-in-button {
        background: var(--theme-primary-color) !important;
        color: #FFFFFF !important;
        border: none !important;
        border-radius: 24px !important;
        padding: 14px 28px !important;
        font-size: 16px !important;
        font-weight: 600 !important;
        width: 100% !important;
        cursor: pointer !important;
        margin-top: 28px !important;
        box-shadow: 0 4px 12px rgba(21, 37, 80, 0.2) !important;
        transition: all 0.25s ease !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
      }

      #sign-in-button:hover {
        filter: brightness(0.85) !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 16px rgba(21, 37, 80, 0.3) !important;
      }

      #sign-in-button:active {
        transform: translateY(1px) !important;
      }

      /* --- Ẩn thông báo lỗi validation khi chưa submit --- */
      #usernameError:not(.htql-show-error),
      #passwordError:not(.htql-show-error) {
        display: none !important;
      }

      /* --- Báo lỗi đăng nhập --- */
      #error-msg {
        background: rgba(239, 68, 68, 0.1) !important;
        border: 1px solid rgba(239, 68, 68, 0.2) !important;
        color: #B91C1C !important;
        border-radius: 12px !important;
        padding: 12px 16px !important;
        font-size: 14px !important;
        margin-bottom: 16px !important;
        text-align: center !important;
      }

      #usernameError.htql-show-error,
      #passwordError.htql-show-error {
        display: flex !important;
        color: #EF4444 !important;
        font-size: 12px !important;
        margin-top: 6px !important;
        text-align: left !important;
        align-items: center !important;
        gap: 6px !important;
      }

      #usernameError i, #passwordError i {
        color: #EF4444 !important;
        margin: 0 !important;
      }

      /* --- Sidebar thông báo --- */
      .slogan-container {
        position: fixed !important;
        right: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
        width: 380px !important;
        height: 100vh !important;
        background: ${gc(opacity * 0.5)} !important;
        backdrop-filter: blur(calc(var(--theme-glass-blur) + 5px)) !important;
        -webkit-backdrop-filter: blur(calc(var(--theme-glass-blur) + 5px)) !important;
        border-left: 1px solid ${gc(0.2)} !important;
        padding: 40px 24px !important;
        box-sizing: border-box !important;
        z-index: 100 !important;
        overflow-y: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        display: block !important;
      }

      .slogan-container::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important;
      }

      /* Ẩn header thông báo gốc */
      .notification-header, .notification-panel > .notification-header {
        display: none !important;
      }

      @media (max-width: 1023px) {
        .slogan-container {
          display: none !important;
        }
      }

      .custom-noti-header {
        display: flex !important;
        align-items: center !important;
        margin-bottom: 32px !important;
        gap: 12px !important;
      }

      .custom-noti-icon-container {
        width: 38px !important;
        height: 38px !important;
        border-radius: 50% !important;
        background: ${gc(0.3)} !important;
        border: 1px solid ${gc(0.2)} !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--theme-primary-color) !important;
      }

      .custom-noti-title {
        font-size: 18px !important;
        font-weight: 700 !important;
        color: var(--theme-primary-color) !important;
        letter-spacing: -0.2px !important;
      }

      .custom-noti-list {
        display: flex !important;
        flex-direction: column !important;
        gap: 16px !important;
      }

      .custom-noti-item {
        display: flex !important;
        align-items: center !important;
        background: ${gc(opacity)} !important;
        border: 1px solid ${gc(0.2)} !important;
        border-radius: 18px !important;
        padding: 14px 18px !important;
        backdrop-filter: blur(var(--theme-glass-blur)) !important;
        -webkit-backdrop-filter: blur(var(--theme-glass-blur)) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
        transition: transform 0.2s ease, background 0.2s ease !important;
        cursor: pointer !important;
        text-decoration: none !important;
      }

      .custom-noti-item:hover {
        transform: translateY(-2px) !important;
        background: ${gc(Math.min(opacity + 0.2, 1))} !important;
      }

      .custom-noti-text {
        font-size: 13px !important;
        color: var(--theme-text-color) !important;
        line-height: 1.45 !important;
        font-weight: 600 !important;
        text-align: left !important;
      }

      .custom-noti-item:hover .custom-noti-text {
        color: var(--theme-primary-color) !important;
      }
    `;
  }

  // ============================================================
  // 3) THAY THẾ DOM THÔNG BÁO & THÊM LABELS
  // ============================================================
  function rebuildPageElements() {
    // Thêm Labels cho Form đăng nhập
    const usernameInput = document.getElementById('usernameUserInput');
    if (usernameInput && !document.getElementById('custom-label-username')) {
      const label = document.createElement('label');
      label.id = 'custom-label-username';
      label.className = 'custom-field-label';
      label.textContent = 'Mã số sinh viên';
      const container = usernameInput.closest('.field');
      if (container) {
        container.parentNode.insertBefore(label, container);
      }
      usernameInput.placeholder = 'Nhập mã số sinh viên';
    }

    const passwordInput = document.getElementById('password');
    if (passwordInput && !document.getElementById('custom-label-password')) {
      const label = document.createElement('label');
      label.id = 'custom-label-password';
      label.className = 'custom-field-label';
      label.textContent = 'Mật khẩu';
      const container = passwordInput.closest('.field');
      if (container) {
        container.parentNode.insertBefore(label, container);
      }
    }

    // Ẩn lỗi validation cho đến khi user bấm đăng nhập
    setupValidationHide();

    // Tái cấu trúc khung Thông báo bên phải
    const panel = document.querySelector('.notification-panel');
    if (panel) {
      // Header
      if (!panel.querySelector('.custom-noti-header')) {
        const header = document.createElement('div');
        header.className = 'custom-noti-header';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'custom-noti-icon-container';
        iconContainer.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
            <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.267 2.5z"/>
            <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25z" clip-rule="evenodd"/>
          </svg>
        `;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'custom-noti-title';
        titleSpan.textContent = 'Thông báo';

        header.appendChild(iconContainer);
        header.appendChild(titleSpan);
        panel.insertBefore(header, panel.firstChild);
      }

      // Sync data thực tế từ notification list gốc
      syncNotifications();
    }

    // Watermark
    if (!document.getElementById('htql-watermark')) {
      const wm = document.createElement('div');
      wm.id = 'htql-watermark';
      wm.textContent = 'Custom by Huaniverse';
      wm.style.cssText = [
        'position:fixed',
        'bottom:14px',
        'right:auto',
        'left:18px',
        'font-size:11px',
        'font-weight:600',
        'color:rgba(255,255,255,0.45)',
        'letter-spacing:0.03em',
        'pointer-events:none',
        'z-index:9999',
        'font-family:inherit',
        'user-select:none',
      ].join(';');
      document.body.appendChild(wm);
    }
  }

  // ============================================================
  // 3.5) ẨN LỖI VALIDATION CHO ĐẾN KHI BẤM NÚT ĐĂNG NHẬP
  // ============================================================
  let validationSetup = false;
  function setupValidationHide() {
    if (validationSetup) return;
    const loginBtn = document.getElementById('sign-in-button');
    if (!loginBtn) return;
    validationSetup = true;

    const usernameInput = document.getElementById('usernameUserInput');
    const passwordInput = document.getElementById('password');
    const usernameErr = document.getElementById('usernameError');
    const passwordErr = document.getElementById('passwordError');

    function syncValidationErrors() {
      if (usernameErr) {
        usernameErr.classList.toggle('htql-show-error', !usernameInput?.value?.trim());
      }
      if (passwordErr) {
        passwordErr.classList.toggle('htql-show-error', !passwordInput?.value?.trim());
      }
    }

    loginBtn.addEventListener('click', syncValidationErrors);

    usernameInput?.addEventListener('input', () => {
      if (usernameInput.value.trim()) {
        usernameErr?.classList.remove('htql-show-error');
      }
    });

    passwordInput?.addEventListener('input', () => {
      if (passwordInput.value.trim()) {
        passwordErr?.classList.remove('htql-show-error');
      }
    });
  }

  // ============================================================
  // 3.6) ĐỒNG BỘ THÔNG BÁO TỪ TRANG GỐC
  // ============================================================
  function syncNotifications() {
    const originalList = document.getElementById('notification-list');
    if (!originalList) return;

    let customList = document.getElementById('custom-styled-noti-list');
    if (!customList) {
      customList = document.createElement('div');
      customList.id = 'custom-styled-noti-list';
      customList.className = 'custom-noti-list';
      originalList.parentNode.insertBefore(customList, originalList.nextSibling);
    }

    // Ẩn danh sách gốc
    originalList.style.setProperty('display', 'none', 'important');

    // Lọc các tin thông báo thực tế
    const originalItems = Array.from(originalList.children);
    const validItems = [];

    originalItems.forEach(item => {
      if (item.id === 'custom-styled-noti-list') return;

      const text = item.textContent.trim();
      if (!text) return;

      // Tìm thẻ <a> bên trong hoặc kiểm tra nếu chính nó là thẻ A
      const linkEl = item.tagName === 'A' ? item : item.querySelector('a');
      const href = linkEl ? linkEl.getAttribute('href') : null;
      const target = linkEl ? (linkEl.getAttribute('target') || '_blank') : null;

      if (validItems.some(i => i.text === text)) return;

      const isEmptyMsg = text.toLowerCase().includes('không có thông báo') || item.id === 'notification-empty';
      validItems.push({ text, isEmptyMsg, href, target });
    });

    // Kiểm tra xem có cần cập nhật DOM không
    const currentCustomTexts = Array.from(customList.querySelectorAll('.custom-noti-text')).map(el => el.textContent.trim());
    const targetTexts = validItems.filter(i => !i.isEmptyMsg).map(i => i.text);

    if (targetTexts.length === 0) {
      if (currentCustomTexts.length === 1 && currentCustomTexts[0] === 'Không có thông báo!') return;
    } else {
      if (JSON.stringify(currentCustomTexts) === JSON.stringify(targetTexts)) return;
    }

    // Tạm dừng Observer khi thay đổi DOM
    if (observer) observer.disconnect();

    customList.innerHTML = '';

    if (targetTexts.length === 0) {
      const item = document.createElement('div');
      item.className = 'custom-noti-item';
      item.style.justifyContent = 'center';
      const textDiv = document.createElement('div');
      textDiv.className = 'custom-noti-text';
      textDiv.style.cssText = 'text-align: center; color: #64748B;';
      textDiv.textContent = 'Không có thông báo!';
      item.appendChild(textDiv);
      customList.appendChild(item);
    } else {
      validItems.filter(i => !i.isEmptyMsg).forEach(itemInfo => {
        const item = document.createElement(itemInfo.href ? 'a' : 'div');
        item.className = 'custom-noti-item';
        if (itemInfo.href) {
          item.href = itemInfo.href;
          item.target = itemInfo.target || '_blank';
        }
        const textDiv = document.createElement('div');
        textDiv.className = 'custom-noti-text';
        textDiv.textContent = itemInfo.text;
        item.appendChild(textDiv);
        customList.appendChild(item);
      });
    }

    // Kết nối lại Observer
    reconnectObserver();
  }

  // ============================================================
  // 4) THEME: LOAD & APPLY
  // ============================================================

  function applyBackground(settings) {
    const bgUrl = settings.bgUrl || '';
    const isSolid = isSolidUrl(bgUrl);
    const isVideo = isVideoUrl(bgUrl);
    const finalBgUrl = (bgUrl && bgUrl !== '') ? bgUrl : DEFAULT_BG_URL;

    if (isSolid) {
      const color = solidUrlToColor(bgUrl);
      document.documentElement.style.setProperty('background', color, 'important');
      document.body.style.setProperty('background-color', color, 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
      applyVideoBg(null);
    } else if (isVideo) {
      document.documentElement.style.setProperty('background', 'transparent', 'important');
      document.body.style.setProperty('background', 'transparent', 'important');
      applyVideoBg(bgUrl);
    } else {
      document.documentElement.style.removeProperty('background');
      document.body.style.setProperty('background-image', cssBackgroundUrl(finalBgUrl), 'important');
      document.body.style.setProperty('background-size', 'cover', 'important');
      document.body.style.setProperty('background-position', 'center', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
      document.body.style.setProperty('background-color', '', 'important');
      applyVideoBg(null);
    }
  }

  function loadAndApplyTheme() {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULTS, (settings) => {
        if (settings && settings.enabled === false) return;
        disableOriginalCSS();
        injectCustomCSS(settings);
        applyBackground(settings);
        rebuildPageElements();
        fadeInPage();
      });
    } else {
      disableOriginalCSS();
      injectCustomCSS(DEFAULTS);
      applyBackground(DEFAULTS);
      rebuildPageElements();
      fadeInPage();
    }
  }

  // ============================================================
  // FADE TRANSITION HELPERS
  // ============================================================
  // Fade-out toàn trang rồi reload để tránh chớp màn hình
  function reloadWithFade() {
    let overlay = document.getElementById('htql-fade-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'htql-fade-overlay';
      overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'background:#000', 'opacity:0', 'pointer-events:none',
        'transition:opacity 320ms ease',
        'will-change:opacity',
      ].join(';');
      document.documentElement.appendChild(overlay);
    }
    void overlay.offsetWidth;
    overlay.style.opacity = '1';
    setTimeout(() => location.reload(), 350);
  }

  // Fade-in trang sau khi theme đã được áp dụng
  function fadeInPage() {
    const overlay = document.getElementById('htql-fade-overlay');
    if (!overlay) return;
    void overlay.offsetWidth;
    overlay.style.opacity = '0';
    setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 420);
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if ('enabled' in changes) {
        // Fade rồi reload khi bật hoặc tắt để tránh chớp màn hình
        reloadWithFade();
        return;
      }
      chrome.storage.local.get(DEFAULTS, (settings) => {
        if (settings && settings.enabled === false) return;
        injectCustomCSS(settings);
        applyBackground(settings);
      });
    });
  }

  // ============================================================
  // 5) OBSERVER & INIT
  // ============================================================
  function reconnectObserver() {
    if (!observer) return;
    if (document.documentElement) {
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: false
      });
    }
  }

  // MutationObserver: giữ theme & xử lý DOM động
  let observerThrottle = false;
  observer = new MutationObserver(() => {
    if (observerThrottle) return;
    observerThrottle = true;
    requestAnimationFrame(() => {
      disableOriginalCSS();
      rebuildPageElements();
      observerThrottle = false;
    });
  });

  // Khởi động: kiểm tra enabled trước, chỉ inject nếu được bật
  chrome.storage.local.get({ enabled: true }, (result) => {
    if (result.enabled === false) {
      // Extension bị tắt — fade-in nhanh rồi để trang hiển thị CSS gốc bình thường
      setTimeout(() => fadeInPage(), 80);
      return;
    }

    // Chạy sớm nhất có thể — disable CSS gốc, đặt màu nền tạm
    // để tránh flash trang trắng trước khi storage callback trả về
    disableOriginalCSS();
    document.documentElement.style.background = '#0a0f1e';

    reconnectObserver();

    // Khi DOM sẵn sàng: load settings và apply (xóa màu nền tạm)
    document.addEventListener("DOMContentLoaded", () => {
      document.documentElement.style.background = '';
      loadAndApplyTheme();
    });
    window.addEventListener("load", () => {
      document.documentElement.style.background = '';
      loadAndApplyTheme();
      setTimeout(loadAndApplyTheme, 1000);
      setTimeout(loadAndApplyTheme, 3000);
    });

    // Nếu DOM đã sẵn sàng rồi (script chạy muộn)
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      document.documentElement.style.background = '';
      loadAndApplyTheme();
    }
  });

})();
