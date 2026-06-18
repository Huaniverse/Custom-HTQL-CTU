// HTQL Custom Theme - Shared Library
(function () {
  'use strict';

  window.HTQL_Shared = window.HTQL_Shared || {};

  window.HTQL_Shared.svgIcon = function (name) {
    switch (name) {
      case 'home':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 10.5V21h6v-7h6v7h6V10.5L12 3Z"/></svg>`;
      case 'profile':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 13.5c2.9 0 5.25-2.35 5.25-5.25S14.9 3 12 3 6.75 5.35 6.75 8.25 9.1 13.5 12 13.5Zm0 2.25c-4.03 0-9 2.02-9 5.25V22h18v-.99c0-3.23-4.97-5.26-9-5.26Z"/></svg>`;
      case 'document':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l5 5v15H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm8 1.5V8h4.5L14 3.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z"/></svg>`;
      case 'edit':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25Zm18-10.5a1 1 0 0 0 0-1.42l-2.33-2.33a1 1 0 0 0-1.42 0l-1.83 1.83 3.75 3.75L21 6.75Z"/></svg>`;
      case 'bell':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a5.5 5.5 0 0 0-5.5 5.5v2.2c0 .83-.28 1.63-.79 2.28L4.4 15.5c-.52.7-.03 1.7.83 1.7h13.54c.86 0 1.35-1 .83-1.7l-1.31-1.52c-.51-.65-.79-1.45-.79-2.28V8.5A5.5 5.5 0 0 0 12 3Zm0 18a2.25 2.25 0 0 0 2.19-1.75H9.81A2.25 2.25 0 0 0 12 21Z"/></svg>`;
      case 'calendar':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10Z"/></svg>`;
      case 'class':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v4H4V4Zm0 6h10v10H4V10Zm12 0h4v10h-4V10Z"/></svg>`;
      case 'gender':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-3.17 3.17a6 6 0 1 1-1.41-1.41L17.59 5H14V3ZM10 9a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/></svg>`;
      case 'advisor':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 1a3 3 0 1 0-2.94-3.6A5.97 5.97 0 0 1 18 13Zm-8 1c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5Zm9 0h1c2.21 0 4 1.34 4 3v3h-4v-2c0-1.55-.45-2.95-1-4Z"/></svg>`;
      case 'family':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 12a3 3 0 1 0-2.999-3A3 3 0 0 0 8 12Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM4 14a4 4 0 0 0-4 4v4h4v-4h4v4h4v-4a4 4 0 0 0-4-4H4Zm16 0a4 4 0 0 0-4 4v4h8v-4a4 4 0 0 0-4-4Z"/></svg>`;
      case 'course':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4v2h10V7H7Zm0 4v2h6v-2H7Z"/></svg>`;
      case 'print':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7V3h12v4H6Zm10-2H8v2h8V5Zm2 3H6a3 3 0 0 0-3 3v4h4v5h10v-5h4v-4a3 3 0 0 0-3-3Zm-4 10H10v-5h4v5Zm4-6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>`;
      default:
        return '';
    }
  };

  window.HTQL_Shared.getHeaderCSS = function (themeColor, mutedColor, chipBg, blur, glassHex) {
    glassHex = glassHex || '#ffffff';
    function gcH(a) {
      const clean = glassHex.replace('#', '');
      const full = clean.length === 3 ? clean.split('').map(function(c){return c+c;}).join('') : clean;
      const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
      const rgb = (isNaN(r)||isNaN(g)||isNaN(b)) ? '255,255,255' : r+','+g+','+b;
      return 'rgba('+rgb+','+a+')';
    }
    return `
      .htql-shared-topbar {
        border-radius: 20px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .htql-shared-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .htql-shared-brand-mark {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: transparent;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }
      .htql-shared-brand-copy {
        min-width: 0;
      }
      .htql-shared-brand-title {
        color: ${themeColor};
        font-size: 1.05rem;
        line-height: 1.4;
        font-weight: 800;
        letter-spacing: 0em;
        text-transform: uppercase;
        white-space: normal;
        overflow: visible;
        word-break: break-word;
      }
      .htql-shared-brand-subtitle {
        margin-top: 4px;
        font-size: 0.84rem;
        color: ${mutedColor};
        font-weight: 600;
      }
      .htql-shared-top-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }
      .htql-shared-home-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid ${gcH(0.35)};
        background: ${chipBg};
        color: ${themeColor};
        font-family: inherit;
        font-size: 0.84rem;
        font-weight: 800;
        box-shadow: 0 6px 14px rgba(46, 70, 160, 0.08);
        backdrop-filter: blur(${blur}px);
        -webkit-backdrop-filter: blur(${blur}px);
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .htql-shared-home-btn:hover {
        background: ${gcH(0.8)};
      }
      .htql-shared-home-btn svg {
        width: 18px;
        height: 18px;
        fill: currentColor;
      }
      .htql-shared-logout-btn {
        height: 40px;
        padding: 0 18px;
        border: 1px solid ${gcH(0.35)};
        border-radius: 13px;
        background: rgba(195, 77, 63, 0.55);
        backdrop-filter: blur(${blur}px);
        -webkit-backdrop-filter: blur(${blur}px);
        color: #fff;
        font-family: inherit;
        font-weight: 800;
        font-size: 0.88rem;
        box-shadow: 0 8px 16px rgba(169, 52, 44, 0.14);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .htql-shared-logout-btn:hover {
        background: rgba(195, 77, 63, 0.72);
        border-color: ${gcH(0.45)};
      }
    `;
  };

  window.HTQL_Shared.buildHeaderHTML = function (cardClassStr, subtitle) {
    const subtitleText = subtitle || 'Portal Sinh viên &amp; Đào tạo';
    return `
        <header class="htql-shared-topbar ${cardClassStr}">
          <div class="htql-shared-brand">
            <div class="htql-shared-brand-mark">
              <img src="${chrome.runtime.getURL('logo.png')}" alt="CTU Logo" style="width:36px;height:36px;object-fit:contain;display:block;">
            </div>
            <div class="htql-shared-brand-copy">
              <div class="htql-shared-brand-title">HỆ THỐNG QUẢN LÝ ĐẠI HỌC CẦN THƠ</div>
              <div class="htql-shared-brand-subtitle">${subtitleText}</div>
            </div>
          </div>
          <div class="htql-shared-top-actions">
            <button class="htql-shared-home-btn" type="button" aria-label="Trang chủ">
              ${window.HTQL_Shared.svgIcon('home')}
              <span>Trang chủ</span>
            </button>
            <button class="htql-shared-logout-btn" type="button">Thoát</button>
          </div>
        </header>
    `;
  };

  window.HTQL_Shared.setupHeaderActions = function (rootElement, homeUrl, logoutUrl) {
    const homeBtn = rootElement.querySelector('.htql-shared-home-btn');
    if (homeBtn) {
      homeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        location.href = homeUrl || 'hindex.php';
      });
    }

    const logoutBtn = rootElement.querySelector('.htql-shared-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (event) => {
        event.preventDefault();
        if (typeof window.thoat === 'function' && !logoutUrl) {
          window.thoat('../logout.php');
        } else {
          location.href = logoutUrl || '../logout.php';
        }
      });
    }
  };

})();
