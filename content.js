// HTQL Custom Theme - Content Script
// Xóa tất cả CSS gốc và áp dụng giao diện Modern Glassmorphism theo mẫu

(function () {
  "use strict";

  // Chèn overlay đen chỉ khi trang được reload do bật/tắt extension.
  // Dùng sessionStorage để đánh dấu: chỉ hiện overlay 1 lần duy nhất khi toggle.
  (function () {
    const TOGGLE_KEY = 'htql_toggle_reload';
    const isToggleReload = sessionStorage.getItem(TOGGLE_KEY) === '1';
    if (isToggleReload) {
      // Xóa cờ ngay lập tức để các lần reload sau không bị ảnh hưởng
      sessionStorage.removeItem(TOGGLE_KEY);
      const ov = document.createElement('div');
      ov.id = 'htql-fade-overlay';
      ov.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:2147483647',
        'background:#000', 'opacity:1', 'pointer-events:none',
        'transition:opacity 380ms ease',
        'will-change:opacity',
      ].join(';');
      (document.documentElement || document).appendChild(ov);
    }
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
         Luôn giữa màn hình. Chỉ lệch trái khi sidebar mở và không đủ không gian. */
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

      /* Chỉ lệch khi sidebar mở VÀ màn hình không đủ rộng để cả hai */
      @media (min-width: 1024px) {
        body.htql-sidebar-open .ui.container.medium {
          left: clamp(
            calc(var(--login-card-width) / 2 + var(--login-edge-gap)),
            50%,
            calc(100vw - var(--login-sidebar-width) - var(--login-card-width) / 2 - var(--login-edge-gap))
          ) !important;
          transition: left 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
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

      /* Ẩn h3 gốc "Đăng nhập" — thay bằng block branding tùy chỉnh */
      .ui.segment.segment-layout h3.ui.header {
        display: none !important;
      }

      /* --- Login Branding Block --- */
      .htql-login-brand {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 14px !important;
        margin-bottom: 32px !important;
      }

      .htql-login-brand-logo {
        width: 56px !important;
        height: 56px !important;
        object-fit: contain !important;
        border-radius: 14px !important;
        filter: drop-shadow(0 4px 12px rgba(21,37,80,0.18)) !important;
        display: block !important;
        flex-shrink: 0 !important;
      }

      .htql-login-brand-text {
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 2px !important;
      }

      .htql-login-brand-title {
        font-size: 30px !important;
        font-weight: 800 !important;
        color: var(--theme-primary-color) !important;
        letter-spacing: -0.4px !important;
        line-height: 1.2 !important;
        text-align: left !important;
        font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif !important;
        margin: 0 !important;
      }

      .htql-login-brand-subtitle {
        font-size: 16px !important;
        font-weight: 700 !important;
        color: var(--theme-text-color) !important;
        opacity: 0.68 !important;
        letter-spacing: 0.01em !important;
        text-align: left !important;
        margin: 0 !important;
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
        padding: 74px 24px 32px !important;
        box-sizing: border-box !important;
        z-index: 100 !important;
        overflow-y: auto !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
        transform: translateX(100%) !important;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
        display: block !important;
      }

      .slogan-container.htql-sidebar-open {
        transform: translateX(0) !important;
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
        #htql-sidebar-toggle {
          display: none !important;
        }
      }

      /* --- Nút toggle sidebar --- */
      #htql-sidebar-toggle {
        position: fixed !important;
        right: 16px !important;
        top: 16px !important;
        z-index: 200 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 42px !important;
        height: 42px !important;
        padding: 0 !important;
        border-radius: 50% !important;
        border: 1px solid ${gc(0.35)} !important;
        background: ${gc(opacity * 0.7)} !important;
        backdrop-filter: blur(var(--theme-glass-blur)) !important;
        -webkit-backdrop-filter: blur(var(--theme-glass-blur)) !important;
        color: var(--theme-primary-color) !important;
        cursor: pointer !important;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
        transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease !important;
        user-select: none !important;
      }

      #htql-sidebar-toggle:hover {
        background: ${gc(Math.min(opacity * 0.7 + 0.15, 1))} !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18) !important;
      }

      /* Icon chuông (khi đóng) */
      #htql-toggle-icon-bell {
        display: flex !important;
        width: 18px !important;
        height: 18px !important;
        fill: currentColor !important;
        flex-shrink: 0 !important;
      }

      /* Icon × (khi mở) — ẩn mặc định */
      #htql-toggle-icon-close {
        display: none !important;
        width: 16px !important;
        height: 16px !important;
        stroke: currentColor !important;
        fill: none !important;
        flex-shrink: 0 !important;
      }

      #htql-sidebar-toggle.htql-sidebar-open #htql-toggle-icon-bell {
        display: none !important;
      }

      #htql-sidebar-toggle.htql-sidebar-open #htql-toggle-icon-close {
        display: flex !important;
      }

      /* Badge số thông báo mới trên nút toggle */
      #htql-toggle-badge {
        display: none !important;
        position: absolute !important;
        top: -4px !important;
        right: -4px !important;
        min-width: 18px !important;
        height: 18px !important;
        border-radius: 999px !important;
        background: #EF4444 !important;
        color: #fff !important;
        font-size: 10px !important;
        font-weight: 700 !important;
        padding: 0 5px !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
        border: 2px solid transparent !important;
      }

      #htql-toggle-badge.htql-badge-visible {
        display: flex !important;
      }

      /* Header bên trong sidebar — ngang hàng với nút toggle ngoài */
      .custom-noti-header {
        position: sticky !important;
        top: -74px !important;
        margin: -74px -24px 24px !important;
        padding: 16px 24px 16px 20px !important;
        height: 74px !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        background: transparent !important;
        box-sizing: border-box !important;
        z-index: 2 !important;
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
        flex-shrink: 0 !important;
      }

      .custom-noti-title {
        font-size: 16px !important;
        font-weight: 700 !important;
        color: var(--theme-primary-color) !important;
        letter-spacing: -0.2px !important;
        flex: 1 !important;
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

      /* --- Popup thông báo mới (hiển thị 1 lần) --- */
      #htql-noti-popup {
        position: fixed !important;
        right: 16px !important;
        bottom: 24px !important;
        z-index: 10000 !important;
        max-width: 340px !important;
        background: ${gc(Math.min(opacity + 0.2, 0.95))} !important;
        backdrop-filter: blur(calc(var(--theme-glass-blur) + 8px)) !important;
        -webkit-backdrop-filter: blur(calc(var(--theme-glass-blur) + 8px)) !important;
        border: 1px solid ${gc(0.35)} !important;
        border-radius: 20px !important;
        padding: 18px 20px !important;
        box-shadow: 0 16px 40px rgba(0,0,0,0.18) !important;
        transform: translateY(20px) !important;
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1) !important;
        box-sizing: border-box !important;
      }

      #htql-noti-popup.htql-popup-show {
        transform: translateY(0) !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }

      .htql-popup-header {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        margin-bottom: 12px !important;
      }

      .htql-popup-title {
        font-size: 13px !important;
        font-weight: 700 !important;
        color: var(--theme-primary-color) !important;
        display: flex !important;
        align-items: center !important;
        gap: 7px !important;
      }

      .htql-popup-dot {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50% !important;
        background: #EF4444 !important;
        flex-shrink: 0 !important;
        animation: htql-pulse 1.4s ease-in-out infinite !important;
      }

      @keyframes htql-pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(0.85); }
      }

      .htql-popup-close {
        width: 24px !important;
        height: 24px !important;
        border-radius: 50% !important;
        border: none !important;
        background: ${gc(0.2)} !important;
        color: var(--theme-text-color) !important;
        font-size: 14px !important;
        line-height: 1 !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: background 0.2s !important;
        flex-shrink: 0 !important;
        font-family: inherit !important;
      }

      .htql-popup-close:hover {
        background: ${gc(0.4)} !important;
      }

      .htql-popup-body {
        font-size: 12.5px !important;
        color: var(--theme-text-color) !important;
        line-height: 1.5 !important;
        font-weight: 500 !important;
      }

      .htql-popup-count {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        background: #EF4444 !important;
        color: #fff !important;
        border-radius: 999px !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        padding: 2px 7px !important;
        margin-right: 5px !important;
      }

      .htql-popup-action {
        margin-top: 12px !important;
        width: 100% !important;
        padding: 9px !important;
        border-radius: 12px !important;
        border: none !important;
        background: var(--theme-primary-color) !important;
        color: #fff !important;
        font-size: 12px !important;
        font-weight: 700 !important;
        font-family: inherit !important;
        cursor: pointer !important;
        transition: filter 0.2s ease !important;
        box-sizing: border-box !important;
      }

      .htql-popup-action:hover {
        filter: brightness(0.85) !important;
      }
    `;
  }

  // ============================================================
  // 3) THAY THẾ DOM THÔNG BÁO & THÊM LABELS
  // ============================================================
  function rebuildPageElements() {
    // --- Inject Login Branding Block (logo + CTU Management + Hệ thống quản lý) ---
    const loginCard = document.querySelector('.ui.segment.segment-layout');
    if (loginCard && !document.getElementById('htql-login-brand')) {
      const h3 = loginCard.querySelector('h3.ui.header');
      const brand = document.createElement('div');
      brand.id = 'htql-login-brand';
      brand.className = 'htql-login-brand';
      brand.innerHTML = `
        <img class="htql-login-brand-logo"
             src="${chrome.runtime.getURL('logo.png')}"
             alt="CTU Logo" />
        <div class="htql-login-brand-text">
          <div class="htql-login-brand-title">CTU Management</div>
          <div class="htql-login-brand-subtitle">Hệ thống quản lý Đại học Cần Thơ</div>
        </div>
      `;
      if (h3) {
        h3.parentNode.insertBefore(brand, h3);
      } else {
        loginCard.insertBefore(brand, loginCard.firstChild);
      }
    }

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

    // Sidebar toggle button
    setupSidebarToggle();

    // Popup thông báo mới
    setupNotiPopup();
  }

  // ============================================================
  // SIDEBAR TOGGLE
  // ============================================================
  let sidebarToggleSetup = false;
  function setupSidebarToggle() {
    if (sidebarToggleSetup) return;
    const sidebar = document.querySelector('.slogan-container');
    if (!sidebar) return;
    sidebarToggleSetup = true;

    // Tạo nút toggle nếu chưa có
    if (!document.getElementById('htql-sidebar-toggle')) {
      const btn = document.createElement('button');
      btn.id = 'htql-sidebar-toggle';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Mở/đóng thông báo');
      btn.innerHTML = `
        <svg id="htql-toggle-icon-bell" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.85 3.5a.75.75 0 00-1.117-1 9.719 9.719 0 00-2.348 4.876.75.75 0 001.479.248A8.219 8.219 0 015.85 3.5zM19.267 2.5a.75.75 0 10-1.118 1 8.22 8.22 0 011.987 4.124.75.75 0 001.48-.248A9.72 9.72 0 0019.267 2.5z"/>
          <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 005.25 9v.75a8.217 8.217 0 01-2.119 5.52.75.75 0 00.298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 107.48 0 24.583 24.583 0 004.83-1.244.75.75 0 00.298-1.205 8.217 8.217 0 01-2.118-5.52V9A6.75 6.75 0 0012 2.25z" clip-rule="evenodd"/>
        </svg>
        <svg id="htql-toggle-icon-close" viewBox="0 0 24 24" aria-hidden="true" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <span id="htql-toggle-badge"></span>
      `;
      btn.style.position = 'relative';

      btn.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('htql-sidebar-open');
        if (isOpen) {
          sidebar.classList.remove('htql-sidebar-open');
          btn.classList.remove('htql-sidebar-open');
          document.body.classList.remove('htql-sidebar-open');
        } else {
          sidebar.classList.add('htql-sidebar-open');
          btn.classList.add('htql-sidebar-open');
          document.body.classList.add('htql-sidebar-open');
          // Xóa badge khi mở sidebar
          const badge = btn.querySelector('#htql-toggle-badge');
          if (badge) {
            badge.textContent = '';
            badge.classList.remove('htql-badge-visible');
          }
        }
      });

      document.body.appendChild(btn);
    }
  }

  // ============================================================
  // POPUP THÔNG BÁO MỚI (hiển thị 1 lần khi có thay đổi)
  // ============================================================
  const NOTI_STORAGE_KEY = 'htql_last_noti_texts';
  let notiPopupSetup = false;

  function setupNotiPopup() {
    if (notiPopupSetup) return;
    const originalList = document.getElementById('notification-list');
    if (!originalList) return;

    // Lấy danh sách thông báo hiện tại
    const currentTexts = getNotificationTexts(originalList);
    if (currentTexts.length === 0) return; // Chưa load xong, bỏ qua

    notiPopupSetup = true;

    const saved = sessionStorage.getItem(NOTI_STORAGE_KEY);
    const savedTexts = saved ? JSON.parse(saved) : null;

    // Lưu danh sách lần đầu
    if (!savedTexts) {
      sessionStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(currentTexts));
      return;
    }

    // So sánh — tìm thông báo mới (có trong current nhưng không có trong saved)
    const newTexts = currentTexts.filter(t => !savedTexts.includes(t));
    if (newTexts.length === 0) {
      // Cập nhật danh sách lưu nếu có thay đổi khác
      sessionStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(currentTexts));
      return;
    }

    // Cập nhật bộ đệm
    sessionStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(currentTexts));

    // Hiển thị popup 1 lần
    showNotiPopup(newTexts.length);
  }

  function getNotificationTexts(listEl) {
    return Array.from(listEl.children)
      .map(el => el.textContent.trim())
      .filter(t => t && !t.toLowerCase().includes('không có thông báo'));
  }

  function showNotiPopup(count) {
    if (document.getElementById('htql-noti-popup')) return; // Chỉ 1 lần

    const popup = document.createElement('div');
    popup.id = 'htql-noti-popup';
    popup.innerHTML = `
      <div class="htql-popup-header">
        <div class="htql-popup-title">
          <span class="htql-popup-dot"></span>
          Thông báo mới
        </div>
        <button class="htql-popup-close" aria-label="Đóng">✕</button>
      </div>
      <div class="htql-popup-body">
        Có <span class="htql-popup-count">${count}</span>
        thông báo mới kể từ lần đăng nhập trước.
      </div>
      <button class="htql-popup-action">Xem thông báo</button>
    `;

    document.body.appendChild(popup);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popup.classList.add('htql-popup-show');
      });
    });

    // Tự động ẩn sau 6 giây
    const autoHide = setTimeout(() => dismissNotiPopup(popup), 6000);

    // Nút đóng
    popup.querySelector('.htql-popup-close').addEventListener('click', () => {
      clearTimeout(autoHide);
      dismissNotiPopup(popup);
    });

    // Nút "Xem thông báo" — mở sidebar và đóng popup
    popup.querySelector('.htql-popup-action').addEventListener('click', () => {
      clearTimeout(autoHide);
      dismissNotiPopup(popup);
      // Mở sidebar
      const sidebar = document.querySelector('.slogan-container');
      const toggleBtn = document.getElementById('htql-sidebar-toggle');
      if (sidebar && !sidebar.classList.contains('htql-sidebar-open')) {
        sidebar.classList.add('htql-sidebar-open');
        document.body.classList.add('htql-sidebar-open');
        if (toggleBtn) {
          toggleBtn.classList.add('htql-sidebar-open');
        }
      }
    });

    // Cập nhật badge trên nút toggle
    const toggleBtn = document.getElementById('htql-sidebar-toggle');
    if (toggleBtn) {
      const badge = toggleBtn.querySelector('#htql-toggle-badge');
      if (badge) {
        badge.textContent = count;
        badge.classList.add('htql-badge-visible');
      }
    }
  }

  function dismissNotiPopup(popup) {
    if (!popup) return;
    popup.classList.remove('htql-popup-show');
    setTimeout(() => { if (popup.parentNode) popup.parentNode.removeChild(popup); }, 350);
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
  // Đặt cờ sessionStorage để trang kế tiếp biết cần hiện overlay fade-in
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
    // Đánh dấu để trang sau khi reload mới hiện overlay fade-in
    sessionStorage.setItem('htql_toggle_reload', '1');
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
