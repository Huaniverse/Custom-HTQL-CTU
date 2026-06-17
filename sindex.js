// HTQL Custom Theme - sindex.php (Kế hoạch học tập + KHHT toàn khóa)
(function () {
  'use strict';

  if (
    location.hostname !== 'dkmh.ctu.edu.vn' ||
    !location.pathname.startsWith('/htql/sinhvien/ctdt/codes/sindex.php')
  ) {
    return;
  }

  const DEFAULT_BG_URL = chrome.runtime.getURL('background.png');
  const ROOT_ID = 'htql-sindex-custom-root';
  const STYLE_ID = 'htql-sindex-custom-style';
  const LOADING_STYLE_ID = 'htql-sindex-loading-style';

  // Detect current sub-page
  const CURRENT_MID = new URLSearchParams(location.search).get('mID') || '';
  const IS_S101 = CURRENT_MID === 'S101';

  const DEFAULTS = {
    glassOpacity: 0.3,
    glassBlur: 20,
    themeColor: '#152550',
    textColor: '#1e293b',
    headingColor: '#152550',
    fontFamily: 'Plus Jakarta Sans',
    bgUrl: '',
  };

  let booted = false;
  let currentSettings = { ...DEFAULTS };

  const loadingStyle = document.createElement('style');
  loadingStyle.id = LOADING_STYLE_ID;
  loadingStyle.textContent = `
    html.htql-sindex-loading,
    html.htql-sindex-loading body {
      visibility: hidden !important;
      background: #0a0f1e !important;
    }
  `;
  (document.documentElement || document.head || document.body).appendChild(loadingStyle);
  document.documentElement.classList.add('htql-sindex-loading');
  document.documentElement.style.background = '#0a0f1e';

  function disableOriginalCSS() {
    const keepIds = new Set([STYLE_ID, LOADING_STYLE_ID]);
    for (let i = 0; i < document.styleSheets.length; i += 1) {
      try {
        const sheet = document.styleSheets[i];
        if (sheet.ownerNode && keepIds.has(sheet.ownerNode.id)) continue;
        sheet.disabled = true;
      } catch (_) {}
    }
    document
      .querySelectorAll('link[rel="stylesheet"], link[rel="preload"][as="style"], style')
      .forEach((el) => {
        if (keepIds.has(el.id)) return;
        try { el.disabled = true; } catch (_) {}
        el.remove();
      });
  }

  function injectStyle(css) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }

  function hexToRgb(hex) {
    const normalized = String(hex || '').replace('#', '');
    if (normalized.length !== 6) return null;
    const value = parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
  }

  function themeTint(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(56, 89, 199, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function cssBackgroundUrl(url) {
    return `url("${String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  }

  function isVideoUrl(url) {
    return url && (url.startsWith('data:video') || /\.(mp4|webm)(\?|$)/i.test(url));
  }

  function resolveBgUrl(settings) {
    const bg = settings && settings.bgUrl;
    return bg && bg !== '' ? bg : DEFAULT_BG_URL;
  }

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function svgIcon(name) {
    return window.HTQL_Shared.svgIcon(name);
  }

  // ─── DATA EXTRACTION ─────────────────────────────────────────────────────

  function extractAdvisorData() {
    const advisor = { name: '', email: '', phone: '' };
    const container = document.getElementById('ttcvht');
    if (!container) return advisor;
    container.querySelectorAll('tr').forEach((tr) => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 2) return;
      const label = normalize(cells[0].textContent).toLowerCase();
      const value = normalize(cells[1].textContent);
      if (label.includes('họ') && label.includes('tên')) advisor.name = value;
      else if (label.includes('email')) advisor.email = value;
      else if (label.includes('điện thoại')) advisor.phone = value.replace(/^DĐ:\s*/i, '');
    });
    return advisor;
  }

  function extractNotices() {
    const notices = [];
    document.querySelectorAll('font[color="#FF0000"]').forEach((el) => {
      const text = normalize(el.textContent);
      if (text.length > 10) notices.push(text);
    });
    return notices;
  }

  function extractMenuItems() {
    const links = [];
    const seen = new Set();
    document.querySelectorAll('div.mmenu a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const label = normalize(a.textContent);
      if (!label || seen.has(href)) return;
      seen.add(href);
      links.push({ label, href });
    });
    return links;
  }

  // Trang chính sindex.php — bảng kế hoạch theo học kỳ (7 cột)
  function extractStudyPlanData() {
    const data = {
      summary: '',
      rows: [],
      tableNote: '',
      advisor: extractAdvisorData(),
      notices: extractNotices(),
      menuItems: extractMenuItems(),
    };

    const allTd = Array.from(document.querySelectorAll('td.main_3'));
    const summaryTd = allTd.find((td) => td.textContent.includes('tích lũy'));
    if (summaryTd) data.summary = normalize(summaryTd.textContent);

    document.querySelectorAll('font[color="#003300"]').forEach((el) => {
      const text = normalize(el.textContent);
      if (text.includes('tín chỉ đã nhập')) data.tableNote = text;
    });

    document.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length === 7) {
        const namHoc = normalize(cells[1].textContent);
        if (namHoc.includes('-')) {
          data.rows.push({
            stt: normalize(cells[0].textContent),
            namHoc,
            hocKy: normalize(cells[2].textContent),
            tcChoPhep: normalize(cells[3].textContent),
            tcDaNhap: normalize(cells[4].textContent),
            caiThien: normalize(cells[5].textContent),
            ghiChu: normalize(cells[6].textContent),
          });
        }
      }
    });

    return data;
  }

  // Trang S101 — bảng KHHT toàn khóa (6 cột)
  function extractS101Data() {
    const data = {
      title: 'XEM KẾ HOẠCH HỌC TẬP TOÀN KHÓA',
      total: '',
      rows: [],
      advisor: extractAdvisorData(),
      notices: extractNotices(),
      menuItems: extractMenuItems(),
    };

    // Extract total credits (green text)
    document.querySelectorAll('span[style*="color:#008000"], span[style*="color: #008000"]').forEach((el) => {
      const text = normalize(el.textContent);
      if (text.includes('Tổng số tín chỉ')) data.total = text.replace(/^\s*&?nbsp;?/, '').trim();
    });
    // fallback: scan all elements
    if (!data.total) {
      Array.from(document.querySelectorAll('td')).forEach((td) => {
        const text = normalize(td.textContent);
        if (text.includes('Tổng số tín chỉ')) data.total = text;
      });
    }

    // Extract 6-column data rows
    document.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length === 6) {
        const stt = normalize(cells[0].textContent);
        const maHP = normalize(cells[1].textContent);
        const tenHP = normalize(cells[2].textContent);
        const soTC = normalize(cells[3].textContent);
        const namHoc = normalize(cells[4].textContent);
        const hocKy = normalize(cells[5].textContent);
        // Valid row: STT contains a number, mã HP has content, tên HP has content
        if (maHP && tenHP && /\d+/.test(stt) && namHoc.includes('-')) {
          data.rows.push({ stt, maHP, tenHP, soTC, namHoc, hocKy });
        }
      }
    });

    return data;
  }

  // ─── CSS ─────────────────────────────────────────────────────────────────

  function getCSS(settings) {
    const s = { ...DEFAULTS, ...(settings || {}) };
    const opacity = s.glassOpacity;
    const blur = s.glassBlur;
    const theme = s.themeColor;
    const text = s.textColor;
    const heading = s.headingColor || theme;
    const font = s.fontFamily || 'Plus Jakarta Sans';
    const bgUrl = resolveBgUrl(s);
    const cardBg = `rgba(255, 255, 255, ${opacity})`;
    const chipBg = `rgba(255, 255, 255, ${Math.min(opacity + 0.18, 0.92)})`;
    const tileBg = `rgba(255, 255, 255, ${Math.max(opacity - 0.02, 0.12)})`;

    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');

      :root {
        --htql-sindex-blue: ${theme};
        --htql-sindex-label: ${heading};
        --htql-sindex-ink: ${text};
        --htql-sindex-card: ${cardBg};
        --htql-sindex-border: rgba(255, 255, 255, 0.22);
        --htql-sindex-shadow: 0 14px 38px rgba(27, 43, 92, 0.10);
        --htql-sindex-blur: ${blur}px;
        --htql-sindex-chip-bg: ${chipBg};
        --htql-sindex-tile-bg: ${tileBg};
        --htql-sindex-pill-bg: ${themeTint(theme, 0.14)};
        --htql-sindex-badge-bg: ${themeTint(theme, 0.12)};
        --htql-sindex-muted: ${themeTint(text, 0.72)};
        --htql-sindex-green: rgba(20, 120, 60, 0.85);
        --htql-sindex-green-bg: rgba(20, 120, 60, 0.08);
      }

      html, body {
        margin: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
        overflow: auto !important;
        scrollbar-width: none !important;
        font-family: '${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        background: ${isVideoUrl(bgUrl) ? 'transparent' : `${cssBackgroundUrl(bgUrl)} center center / cover fixed no-repeat`} !important;
      }

      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }

      body.htql-sindex-active > *:not(#${ROOT_ID}):not(#htql-hindex-video-bg) {
        display: none !important;
      }

      * { box-sizing: border-box !important; }

      #${ROOT_ID} {
        position: relative;
        z-index: 1;
        width: 100%;
        min-height: 100vh;
        padding: 16px;
      }

      .htql-sindex-shell {
        width: min(1600px, 100%);
        margin: 0 auto;
        display: grid;
        gap: 14px;
      }

      .htql-sindex-card {
        background: var(--htql-sindex-card);
        border: 1px solid var(--htql-sindex-border);
        box-shadow: var(--htql-sindex-shadow);
        backdrop-filter: blur(var(--htql-sindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-sindex-blur));
      }

      /* SHARED HEADER CSS */
      ${window.HTQL_Shared.getHeaderCSS(theme, text, chipBg, blur)}

      /* ── TOP ROW ─────────────────────────────────── */
      .htql-sindex-top-row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 14px;
      }
      @media (max-width: 768px) { .htql-sindex-top-row { grid-template-columns: 1fr; } }

      /* ── ADVISOR CARD ────────────────────────────── */
      .htql-sindex-advisor-card {
        padding: 20px 24px;
        border-radius: 18px;
      }
      .htql-sindex-panel-head {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.82rem;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--htql-sindex-blue);
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--htql-sindex-border);
      }
      .htql-sindex-panel-head-icon {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: var(--htql-sindex-badge-bg);
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }
      .htql-sindex-panel-head-icon svg { width: 18px; height: 18px; fill: var(--htql-sindex-blue); }
      .htql-sindex-advisor-rows { display: flex; flex-direction: column; gap: 10px; }
      .htql-sindex-meta-row {
        display: flex;
        align-items: baseline;
        gap: 10px;
        font-size: 0.9rem;
      }
      .htql-sindex-meta-label {
        color: var(--htql-sindex-muted);
        font-weight: 600;
        flex: 0 0 90px;
        font-size: 0.82rem;
      }
      .htql-sindex-meta-value {
        color: var(--htql-sindex-ink);
        font-weight: 600;
        flex: 1;
        min-width: 0;
        word-break: break-word;
      }
      .htql-sindex-meta-value-accent {
        color: var(--htql-sindex-ink);
        font-weight: 700;
      }

      /* ── NOTICE CARD ─────────────────────────────── */
      .htql-sindex-notice-card {
        padding: 20px 24px;
        border-radius: 18px;
      }
      .htql-sindex-notice-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .htql-sindex-notice-item {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        font-size: 0.875rem;
        color: var(--htql-sindex-ink);
        line-height: 1.55;
        font-weight: 500;
      }
      .htql-sindex-notice-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #e05252;
        margin-top: 6px;
        flex: 0 0 8px;
      }

      /* ── NAV MENU ────────────────────────────────── */
      .htql-sindex-nav-card {
        padding: 10px 18px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .htql-sindex-nav-links {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .htql-sindex-nav-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 999px;
        border: 1px solid var(--htql-sindex-border);
        background: var(--htql-sindex-chip-bg);
        color: var(--htql-sindex-blue);
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        cursor: pointer;
        transition: background 0.18s ease;
      }
      .htql-sindex-nav-link:hover { background: rgba(255,255,255,0.75); }
      .htql-sindex-nav-link.active {
        background: var(--htql-sindex-blue);
        color: #fff;
        border-color: transparent;
      }

      /* ── SEMESTER PLAN TABLE (sindex base) ───────── */
      .htql-sindex-main { display: flex; flex-direction: column; gap: 14px; }
      .htql-sindex-table-card { border-radius: 20px; overflow: hidden; }
      .htql-sindex-note-card {
        padding: 14px 20px;
        border-radius: 16px;
      }
      .htql-sindex-table-note {
        font-size: 0.82rem;
        font-weight: 600;
        color: #1a5c30;
      }
      .htql-sindex-summary-card {
        padding: 20px 24px;
        border-radius: 18px;
      }
      .htql-sindex-summary {
        font-size: 0.9rem;
        font-weight: 700;
        color: var(--htql-sindex-ink);
        line-height: 1.5;
      }
      .htql-sindex-table-wrapper {
        overflow-x: auto;
        border-radius: 14px;
        border: 1px solid var(--htql-sindex-border);
      }
      .htql-sindex-table {
        width: 100%;
        border-collapse: collapse;
        text-align: center;
      }
      .htql-sindex-table th {
        background: rgba(0,0,0,0.04);
        padding: 16px 12px;
        font-weight: 700;
        color: var(--htql-sindex-ink);
        border-bottom: 2px solid var(--htql-sindex-border);
        white-space: nowrap;
      }
      .htql-sindex-table td {
        padding: 14px 12px;
        border-bottom: 1px solid var(--htql-sindex-border);
        color: var(--htql-sindex-ink);
      }
      .htql-sindex-table tbody tr:last-child td { border-bottom: none; }
      .htql-sindex-table tbody tr:hover { background: rgba(255,255,255,0.4); }
      .htql-sindex-badge-year {
        background: var(--htql-sindex-pill-bg);
        color: var(--htql-sindex-blue);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .htql-sindex-tc-value { font-weight: 700; color: var(--htql-sindex-blue); }

      /* ── S101 KHHT TOÀN KHÓA TABLE ───────────────── */
      .htql-s101-plan-card { padding: 24px; border-radius: 20px; }
      .htql-s101-page-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: var(--htql-sindex-blue);
        text-align: center;
        margin-bottom: 20px;
        letter-spacing: 0.04em;
      }
      .htql-s101-group-header td {
        background: var(--htql-sindex-badge-bg) !important;
        padding: 10px 12px !important;
        font-weight: 800 !important;
        color: var(--htql-sindex-ink) !important;
        font-size: 0.85rem !important;
        letter-spacing: 0.04em !important;
        text-align: left !important;
        border-bottom: 1px solid var(--htql-sindex-border) !important;
      }
      .htql-s101-ma-hp {
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--htql-sindex-blue);
        background: var(--htql-sindex-pill-bg);
        padding: 3px 8px;
        border-radius: 5px;
        white-space: nowrap;
      }
      .htql-s101-tc {
        font-weight: 800;
        color: var(--htql-sindex-blue);
        font-size: 1rem;
      }
      .htql-s101-total-row td {
        background: rgba(20, 120, 60, 0.08) !important;
        color: #1a5c30 !important;
        font-weight: 800 !important;
        font-size: 0.95rem !important;
        padding: 14px 12px !important;
        border-top: 2px solid rgba(20, 120, 60, 0.2) !important;
        border-bottom: none !important;
      }
      .htql-s101-table td:first-child { color: var(--htql-sindex-muted); font-size: 0.82rem; }
    `;
  }

  // ─── SHARED BUILDERS ─────────────────────────────────────────────────────

  function buildAdvisorHTML(advisor) {
    return `
      <div class="htql-sindex-card htql-sindex-advisor-card">
        <div class="htql-sindex-panel-head">
          <span class="htql-sindex-panel-head-icon">${svgIcon('advisor')}</span>
          <span>CỐ VẤN HỌC TẬP</span>
        </div>
        <div class="htql-sindex-advisor-rows">
          <div class="htql-sindex-meta-row">
            <span class="htql-sindex-meta-label">Họ và tên</span>
            <span class="htql-sindex-meta-value htql-sindex-meta-value-accent">${advisor.name || '---'}</span>
          </div>
          <div class="htql-sindex-meta-row">
            <span class="htql-sindex-meta-label">Email</span>
            <span class="htql-sindex-meta-value">${advisor.email || '---'}</span>
          </div>
          <div class="htql-sindex-meta-row">
            <span class="htql-sindex-meta-label">Điện thoại</span>
            <span class="htql-sindex-meta-value">${advisor.phone || '---'}</span>
          </div>
        </div>
      </div>
    `;
  }

  function buildNoticesHTML(notices) {
    if (!notices || notices.length === 0) return '<div></div>';
    return `
      <div class="htql-sindex-card htql-sindex-notice-card">
        <div class="htql-sindex-panel-head">
          <span class="htql-sindex-panel-head-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 15h-2v-2h2v2Zm0-4h-2V7h2v6Z"/></svg>
          </span>
          <span>THÔNG BÁO QUAN TRỌNG</span>
        </div>
        <ul class="htql-sindex-notice-list">
          ${notices.map((n) => `
            <li class="htql-sindex-notice-item">
              <span class="htql-sindex-notice-dot"></span>
              <span>${n}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  function buildNavHTML(menuItems, activeMID) {
    if (!menuItems || menuItems.length === 0) return '';
    return `
      <nav class="htql-sindex-card htql-sindex-nav-card" aria-label="Điều hướng kế hoạch học tập">
        <ul class="htql-sindex-nav-links">
          ${menuItems.map((item) => {
            const itemMID = (item.href.match(/mID=(\w+)/) || [])[1] || '';
            const isActive = activeMID && itemMID === activeMID;
            return `<li><a class="htql-sindex-nav-link${isActive ? ' active' : ''}" href="${item.href}">${item.label}</a></li>`;
          }).join('')}
        </ul>
      </nav>
    `;
  }

  // ─── SEMESTER PLAN SHELL (sindex base) ───────────────────────────────────

  function buildSindexShell(data) {
    const root = document.createElement('div');
    root.id = ROOT_ID;

    const tableRows = data.rows.map((row) => `
      <tr>
        <td>${row.stt}</td>
        <td><span class="htql-sindex-badge-year">${row.namHoc}</span></td>
        <td>HK ${row.hocKy}</td>
        <td>${row.tcChoPhep}</td>
        <td class="htql-sindex-tc-value">${row.tcDaNhap}</td>
        <td>${row.caiThien}</td>
        <td>${row.ghiChu}</td>
      </tr>
    `).join('');

    root.innerHTML = `
      <div class="htql-sindex-shell">
        ${window.HTQL_Shared.buildHeaderHTML('htql-sindex-card', 'Kế hoạch học tập')}

        ${buildNavHTML(data.menuItems, '')}

        <div class="htql-sindex-top-row">
          ${buildAdvisorHTML(data.advisor)}
          ${buildNoticesHTML(data.notices)}
          ${data.summary ? `
          <div class="htql-sindex-card htql-sindex-summary-card">
            <div class="htql-sindex-panel-head">
              <span class="htql-sindex-panel-head-icon">${svgIcon('document')}</span>
              <span>TỔNG KẾT TÍN CHỈ</span>
            </div>
            <div class="htql-sindex-summary">${data.summary}</div>
          </div>` : '<div></div>'}
        </div>

        <main class="htql-sindex-main" id="htql-sindex-main-content">
          <div class="htql-sindex-card htql-sindex-table-card">
            <div class="htql-sindex-table-wrapper">
              <table class="htql-sindex-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Năm học</th>
                    <th>Học kỳ</th>
                    <th>TC cho phép</th>
                    <th>TC đã nhập</th>
                    <th>Cải thiện</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows || '<tr><td colspan="7" style="text-align:center;padding:20px;opacity:0.6;">Không có dữ liệu</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
          ${data.tableNote ? `
          <div class="htql-sindex-card htql-sindex-note-card">
            <div class="htql-sindex-table-note">⚠ ${data.tableNote}</div>
          </div>` : ''}
        </main>
      </div>
    `;

    window.HTQL_Shared.setupHeaderActions(root, '../../hindex.php', '../../../../logout.php');
    return root;
  }

  // ─── S101 KHHT TOÀN KHÓA SHELL ───────────────────────────────────────────

  function buildS101Shell(data) {
    const root = document.createElement('div');
    root.id = ROOT_ID;

    // Group rows by (namHoc + hocKy)
    const groups = [];
    const groupMap = new Map();
    data.rows.forEach((row) => {
      const key = `${row.namHoc}|HK${row.hocKy}`;
      if (!groupMap.has(key)) {
        const group = { key, namHoc: row.namHoc, hocKy: row.hocKy, rows: [] };
        groupMap.set(key, group);
        groups.push(group);
      }
      groupMap.get(key).rows.push(row);
    });

    // Build grouped table rows
    const tableBodyRows = groups.map((group) => {
      const groupHeader = `
        <tr class="htql-s101-group-header">
          <td colspan="4">N\u0103m h\u1ecdc ${group.namHoc} — H\u1ecdc k\u1ef3 ${group.hocKy}</td>
        </tr>
      `;
      const dataRows = group.rows.map((row) => `
        <tr>
          <td>${row.stt}</td>
          <td><span class="htql-s101-ma-hp">${row.maHP}</span></td>
          <td style="text-align:left">${row.tenHP}</td>
          <td><span class="htql-s101-tc">${row.soTC}</span></td>
        </tr>
      `).join('');
      return groupHeader + dataRows;
    }).join('');

    const totalRow = data.total ? `
      <tr class="htql-s101-total-row">
        <td colspan="4">${data.total}</td>
      </tr>
    ` : '';

    root.innerHTML = `
      <div class="htql-sindex-shell">
        ${window.HTQL_Shared.buildHeaderHTML('htql-sindex-card', 'Kế hoạch học tập')}

        ${buildNavHTML(data.menuItems, 'S101')}

        <div class="htql-sindex-top-row">
          ${buildAdvisorHTML(data.advisor)}
          ${buildNoticesHTML(data.notices)}
          ${data.total ? `
          <div class="htql-sindex-card htql-sindex-summary-card">
            <div class="htql-sindex-panel-head">
              <span class="htql-sindex-panel-head-icon">${svgIcon('document')}</span>
              <span>TỔNG KẾT TÍN CHỈ</span>
            </div>
            <div class="htql-sindex-summary">${data.total}</div>
          </div>` : '<div></div>'}
        </div>

        <main class="htql-sindex-main" id="htql-sindex-main-content">
          <div class="htql-sindex-card htql-sindex-table-card">
            <div class="htql-sindex-table-wrapper">
              <table class="htql-sindex-table htql-s101-table">
                <thead>
                  <tr>
                    <th style="width:5%">STT</th>
                    <th style="width:10%">Mã HP</th>
                    <th style="text-align:left">Tên học phần</th>
                    <th style="width:8%">Số TC</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.rows.length > 0
                    ? tableBodyRows
                    : '<tr><td colspan="4" style="text-align:center;padding:20px;opacity:0.6;">Không có dữ liệu</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;

    window.HTQL_Shared.setupHeaderActions(root, '../../hindex.php', '../../../../logout.php');
    return root;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  function render(settings) {
    disableOriginalCSS();
    injectStyle(getCSS(settings));

    let root = document.getElementById(ROOT_ID);
    if (!root) {
      if (IS_S101) {
        const data = extractS101Data();
        root = buildS101Shell(data);
      } else {
        const data = extractStudyPlanData();
        root = buildSindexShell(data);
      }
      document.body.appendChild(root);
      document.body.classList.add('htql-sindex-active');
    }
  }

  function applySettings(settings) {
    currentSettings = { ...currentSettings, ...settings };
    render(currentSettings);
  }

  function removeLoadingState() {
    document.documentElement.classList.remove('htql-sindex-loading');
    const ls = document.getElementById(LOADING_STYLE_ID);
    if (ls) ls.remove();
  }

  function boot() {
    if (booted) return;
    if (!document.body) { setTimeout(boot, 20); return; }
    booted = true;
    chrome.storage.local.get(DEFAULTS, (settings) => {
      applySettings(settings);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      boot();
      setTimeout(removeLoadingState, 50);
    });
  } else {
    boot();
    removeLoadingState();
  }

})();
