// HTQL Custom Dashboard - hindex.php only
(function () {
  'use strict';

  if (
    location.hostname !== 'dkmh.ctu.edu.vn' ||
    location.pathname !== '/htql/sinhvien/hindex.php' ||
    location.search
  ) {
    return;
  }

  const DEFAULT_BG_URL = chrome.runtime.getURL('background.png');
  const ROOT_ID = 'htql-hindex-custom-root';
  const STYLE_ID = 'htql-hindex-custom-style';
  const LOADING_STYLE_ID = 'htql-hindex-loading-style';

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
    html.htql-hindex-loading,
    html.htql-hindex-loading body {
      visibility: hidden !important;
      background: #0a0f1e !important;
    }
  `;
  (document.documentElement || document.head || document.body).appendChild(loadingStyle);
  document.documentElement.classList.add('htql-hindex-loading');

  /* Đặt màu nền tạm ngay lên <html> để tránh flash trắng khi removeLoadingState */
  document.documentElement.style.background = '#0a0f1e';

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function foldText(value) {
    return normalize(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase();
  }

  function cleanDisplay(value) {
    return normalize(value)
      .replace(/\s*\/\s*/g, ' / ')
      .replace(/&(?=\S)/g, '& ')
      .replace(/\s+/g, ' ')
      .trim();
  }

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
        try {
          el.disabled = true;
        } catch (_) {}
        el.remove();
      });

    try {
      if (document.adoptedStyleSheets && document.adoptedStyleSheets.length > 0) {
        document.adoptedStyleSheets = [];
      }
    } catch (_) {}
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

  function getTableByText(text) {
    const needle = foldText(text);
    return Array.from(document.querySelectorAll('table')).find((table) =>
      foldText(table.textContent).includes(needle)
    );
  }

  function extractKeyValueRows(table) {
    const map = new Map();
    if (!table) return map;

    Array.from(table.querySelectorAll('tr')).forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 2) return;
      const key = foldText(cells[0].textContent).replace(/:$/, '');
      const value = normalize(cells[cells.length - 1].textContent);
      if (key && value) map.set(key, value);
    });

    return map;
  }

  function extractStudentData() {
    const table = getTableByText('THONG TIN SINH VIEN');
    const map = extractKeyValueRows(table);
    return {
      name: cleanDisplay(map.get('ho ten') || ''),
      studentId: cleanDisplay(map.get('ma sv') || ''),
      birthDate: cleanDisplay(map.get('ngay sinh') || ''),
      gender: cleanDisplay(map.get('gioi tinh') || ''),
      className: cleanDisplay(map.get('lop') || ''),
      major: cleanDisplay(map.get('nganh hoc') || ''),
      faculty: cleanDisplay(map.get('khoa') || ''),
      courseYear: cleanDisplay(map.get('khoa hoc') || ''),
    };
  }

  function extractAdvisorData() {
    const table = getTableByText('CO VAN HOC TAP');
    const map = extractKeyValueRows(table);
    return {
      id: cleanDisplay(map.get('ma so cb') || map.get('ma can bo') || ''),
      name: cleanDisplay(map.get('ho va ten') || ''),
      email: cleanDisplay(map.get('email') || ''),
      phone: cleanDisplay((map.get('dien thoai') || '').replace(/^DĐ:\s*/i, '')),
    };
  }

  function extractFamilyData() {
    const table = getTableByText('THONG TIN GIA DINH SINH VIEN');
    const lines = table
      ? Array.from(table.querySelectorAll('tr')).map((row) => normalize(row.textContent)).filter(Boolean)
      : [];

    const dataLines = lines.filter((line) => {
      const folded = foldText(line);
      return !folded.startsWith('thong tin gia dinh sinh vien') && !folded.startsWith('cac thong tin nay');
    });
    const findLine = (needle) => dataLines.find((line) => foldText(line).includes(foldText(needle))) || '';
    const namesLine = findLine('ONG/BA:');
    const contactLine = findLine('DIA CHI LIEN LAC:');
    const householdLine = findLine('DIA CHI HO KHAU:');
    const birthPlaceLine = findLine('NOI CAP GIAY KHAI SINH:');
    const originLine = findLine('TEN NOI SINH:');
    const noteLine = lines.find((line) => foldText(line).startsWith('cac thong tin nay')) || '';

    const memberParts = [];
    const memberMatcher = /Ông\/Bà:\s*(.*?)(?=\s*Ông\/Bà:|$)/g;
    let memberMatch;
    while ((memberMatch = memberMatcher.exec(namesLine))) {
      const part = normalize(memberMatch[1]);
      if (part) memberParts.push(part);
    }

    const contactParts = contactLine.includes(':') ? contactLine.split(':') : [];
    const rawPhone = contactParts.length > 2 ? contactParts.slice(2).join(':') : '';
    const rawAddress = contactParts.length > 1 ? contactParts[1].replace(/\s*Số điện thoại.*$/i, '') : '';

    return {
      members: cleanDisplay(memberParts.join(' / ')),
      contactAddress: cleanDisplay(rawAddress.replace(/,\s*khu vực\s*\/\s*ấp\s*[^,]+,/i, ', ')),
      phone: cleanDisplay(rawPhone.split('/')[0]),
      household: cleanDisplay(householdLine.includes(':') ? householdLine.slice(householdLine.indexOf(':') + 1) : ''),
      birthPlace: cleanDisplay(birthPlaceLine.includes(':') ? birthPlaceLine.slice(birthPlaceLine.indexOf(':') + 1) : ''),
      origin: cleanDisplay(originLine.includes(':') ? originLine.slice(originLine.indexOf(':') + 1) : ''),
      note: noteLine,
    };
  }

  function svgIcon(name) {
    switch (name) {
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
      case 'home':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 3 10.5V21h6v-7h6v7h6V10.5L12 3Z"/></svg>`;
      case 'course':
        return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 4v2h10V7H7Zm0 4v2h6v-2H7Z"/></svg>`;
      default:
        return '';
    }
  }

  function setAction(el, handler) {
    el.addEventListener('click', (event) => {
      event.preventDefault();
      handler();
    });
  }

  function submitFormByName(name) {
    const form = document.forms.namedItem(name);
    if (form && typeof form.submit === 'function') {
      form.submit();
      return true;
    }
    return false;
  }

  function callPageAction(fnName, fallbackFormName, args = []) {
    const fn = window[fnName];
    if (typeof fn === 'function') {
      return fn(...args);
    }
    if (fallbackFormName) {
      return submitFormByName(fallbackFormName);
    }
    return null;
  }

  function makeInfoRow(label, value, accent) {
    const row = document.createElement('div');
    row.className = 'htql-hindex-meta-row';
    const valueClass = accent ? 'htql-hindex-meta-value htql-hindex-meta-value-accent' : 'htql-hindex-meta-value';
    row.innerHTML = `
      <div class="htql-hindex-meta-label">${label}</div>
      <div class="${valueClass}">${value || '---'}</div>
    `;
    return row;
  }

  function cssBackgroundUrl(url) {
    return `url("${String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  }

  function isVideoUrl(url) {
    return url && (url.startsWith('data:video') || /\.(mp4|webm)(\?|$)/i.test(url));
  }

  function applyVideoBg(url) {
    let vid = document.getElementById('htql-hindex-video-bg');
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
      vid.id = 'htql-hindex-video-bg';
      vid.style.cssText = [
        'position:fixed', 'inset:0', 'width:100%', 'height:100%',
        'object-fit:cover', 'z-index:0', 'pointer-events:none',
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
        if (!document.getElementById('htql-hindex-video-bg')) return;
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

  function resolveBgUrl(settings) {
    const bg = settings && settings.bgUrl;
    return bg && bg !== '' ? bg : DEFAULT_BG_URL;
  }

  function hexToRgb(hex) {
    const normalized = String(hex || '').replace('#', '');
    if (normalized.length !== 6) return null;
    const value = parseInt(normalized, 16);
    if (Number.isNaN(value)) return null;
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function themeTint(hex, alpha) {
    const rgb = hexToRgb(hex);
    if (!rgb) return `rgba(56, 89, 199, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  function makeTile(config) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'htql-hindex-tile';
    button.style.setProperty('--tile-accent-soft', config.accentSoft);
    button.innerHTML = `
      <div class="htql-hindex-tile-icon">
        <img alt="" src="${config.icon}">
      </div>
      <div class="htql-hindex-tile-text">${config.label}</div>
    `;
    setAction(button, config.action);
    return button;
  }

  function buildFeatureActions() {
    return [
      {
        label: 'Kế hoạch học tập',
        icon: 'images/phanhe/khht.gif',
        accentSoft: 'rgba(109, 127, 242, 0.18)',
        action: () => callPageAction('gotoCindex', 'frmDuLieuHindex'),
      },
      {
        label: 'Đăng ký học phần',
        icon: 'images/phanhe/hetinchi.gif',
        accentSoft: 'rgba(179, 140, 247, 0.18)',
        action: () => callPageAction('gotoDKindex', 'frmDuLieuDKindex'),
      },
      {
        label: 'Kết quả học tập',
        icon: 'images/phanhe/ql_diem.gif',
        accentSoft: 'rgba(240, 177, 127, 0.18)',
        action: () => callPageAction('gotoDindex', 'frmDuLieuDindex'),
      },
      {
        label: 'Kết quả tốt nghiệp',
        icon: 'images/phanhe/ctdt.gif',
        accentSoft: 'rgba(126, 144, 216, 0.18)',
        action: () => callPageAction('gotoKQTNindex', 'frmDuLieuKQTNindex', ['CQ']),
      },
      {
        label: 'Nghiên cứu khoa học',
        icon: 'images/phanhe/icon-nckh.jpg',
        accentSoft: 'rgba(240, 201, 138, 0.18)',
        action: () => callPageAction('gotoKindex', 'frmDuLieuKindex'),
      },
      {
        label: 'Ký túc xá',
        icon: 'images/phanhe/ktx.png',
        accentSoft: 'rgba(113, 133, 208, 0.18)',
        action: () => callPageAction('gotoKTX', 'frmKTX'),
      },
      {
        label: 'Hệ thống lấy ý kiến trực tuyến',
        icon: 'images/phanhe/icon-oss.jpg',
        accentSoft: 'rgba(242, 197, 110, 0.18)',
        action: () => {
          location.href = 'https://oss.ctu.edu.vn';
        },
      },
      {
        label: 'Hoạt động ngoại khóa',
        icon: 'images/phanhe/hdnk_icon.png',
        accentSoft: 'rgba(122, 148, 222, 0.18)',
        action: () => callPageAction('gotoHDNK', 'frmHDNK'),
      },
      {
        label: 'Đoàn viên',
        icon: 'images/phanhe/HuyHieuDoan.jpg',
        accentSoft: 'rgba(110, 134, 212, 0.18)',
        action: () => callPageAction('gotoDoanVien', 'frmDoanVien'),
      },
      {
        label: 'Đăng ký học chương trình thứ 2',
        icon: 'images/phanhe/korganizer.png',
        accentSoft: 'rgba(224, 176, 79, 0.18)',
        action: () => {
          location.href = 'hindex.php?mID=dangkyhocsongsong';
        },
      },
      {
        label: 'Đánh giá rèn luyện',
        icon: 'images/phanhe/hetinchi.gif',
        accentSoft: 'rgba(140, 155, 229, 0.18)',
        action: () => callPageAction('gotoRenLuyen', 'frmRenLuyen'),
      },
      {
        label: 'Phòng học',
        icon: 'images/phanhe/qlph.gif',
        accentSoft: 'rgba(182, 139, 219, 0.18)',
        action: () => callPageAction('gotoQLPH', 'frmQLPH'),
      },
      {
        label: 'Lịch thi',
        icon: 'images/phanhe/lichthi_icon.png',
        accentSoft: 'rgba(139, 160, 236, 0.18)',
        action: () => callPageAction('gotoSVLichThi', 'frmSVLichThi'),
      },
    ];
  }

  function buildShell(data) {
    const root = document.createElement('div');
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="htql-hindex-shell">
        <header class="htql-hindex-topbar htql-hindex-card">
          <div class="htql-hindex-brand">
            <div class="htql-hindex-brand-mark">
              <img src="${chrome.runtime.getURL('logo.png')}" alt="CTU Logo" style="width:36px;height:36px;object-fit:contain;display:block;">
            </div>
            <div class="htql-hindex-brand-copy">
              <div class="htql-hindex-brand-title">HỆ THỐNG QUẢN LÝ ĐẠI HỌC CẦN THƠ</div>
              <div class="htql-hindex-brand-subtitle">Portal Sinh viên &amp; Đào tạo</div>
            </div>
          </div>
          <div class="htql-hindex-top-actions">
            <button class="htql-hindex-home-btn" type="button" aria-label="Trang chủ">
              ${svgIcon('home')}
              <span>Trang chủ</span>
            </button>
            <button class="htql-hindex-logout-btn" type="button">Thoát</button>
          </div>
        </header>

        <main class="htql-hindex-main">
          <section class="htql-hindex-card htql-hindex-hero">
            <div class="htql-hindex-hero-inner">
              <div class="htql-hindex-hero-info">
                <div class="htql-hindex-name-group">
                  <h1 class="htql-hindex-name" id="htql-hindex-student-name"></h1>
                  <span class="htql-hindex-badge" id="htql-hindex-student-id"></span>
                </div>
                <div class="htql-hindex-faculty" id="htql-hindex-faculty"></div>
                <div class="htql-hindex-major" id="htql-hindex-major"></div>
              </div>
              <div class="htql-hindex-chip-grid">
                <div class="htql-hindex-chip">
                  <div class="htql-hindex-chip-icon">${svgIcon('calendar')}</div>
                  <div>
                    <div class="htql-hindex-chip-label">Ngày sinh</div>
                    <div class="htql-hindex-chip-value" id="htql-hindex-birth-date"></div>
                  </div>
                </div>
                <div class="htql-hindex-chip">
                  <div class="htql-hindex-chip-icon">${svgIcon('class')}</div>
                  <div>
                    <div class="htql-hindex-chip-label">Lớp</div>
                    <div class="htql-hindex-chip-value" id="htql-hindex-class"></div>
                  </div>
                </div>
                <div class="htql-hindex-chip">
                  <div class="htql-hindex-chip-icon">${svgIcon('gender')}</div>
                  <div>
                    <div class="htql-hindex-chip-label">Giới tính</div>
                    <div class="htql-hindex-chip-value" id="htql-hindex-gender"></div>
                  </div>
                </div>
                <div class="htql-hindex-chip">
                  <div class="htql-hindex-chip-icon">${svgIcon('course')}</div>
                  <div>
                    <div class="htql-hindex-chip-label">Khóa học</div>
                    <div class="htql-hindex-chip-value" id="htql-hindex-course-year"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="htql-hindex-card htql-hindex-panel htql-hindex-advisor-panel" id="htql-hindex-advisor-card"></section>

          <section class="htql-hindex-functions">
            <div class="htql-hindex-feature-grid" id="htql-hindex-feature-grid"></div>
          </section>

          <div class="htql-hindex-side-bottom">
            <section class="htql-hindex-card htql-hindex-panel htql-hindex-family-panel" id="htql-hindex-family-card"></section>
            <div class="htql-hindex-side-actions">
              <a class="htql-hindex-side-btn" id="htql-hindex-profile-link" href="hindex.php?mID=thongtinsinhvien">
                <span class="htql-hindex-side-btn-icon">${svgIcon('document')}</span>
                <span>Xem chi tiết hồ sơ</span>
              </a>
              <a class="htql-hindex-side-btn htql-hindex-side-btn-secondary" id="htql-hindex-edit-link" href="hindex.php?mID=yeucauhieuchinhthongtinsinhvien">
                <span class="htql-hindex-side-btn-icon">${svgIcon('edit')}</span>
                <span>Cập nhật thông tin</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    `;

    const rootQuery = (selector) => root.querySelector(selector);
    const setText = (selector, value) => {
      const el = rootQuery(selector);
      if (el) el.textContent = value || '---';
    };

    setText('#htql-hindex-student-name', data.student.name || '---');
    setText('#htql-hindex-student-id', data.student.studentId || '---');
    setText('#htql-hindex-major', (data.student.major ? 'Ngành ' + data.student.major : 'Ngành học chưa xác định'));
    const facultyEl = rootQuery('#htql-hindex-faculty');
    if (facultyEl) facultyEl.textContent = data.student.faculty || '';
    setText('#htql-hindex-birth-date', data.student.birthDate);
    setText('#htql-hindex-class', data.student.className);
    setText('#htql-hindex-gender', data.student.gender);
    setText('#htql-hindex-course-year', data.student.courseYear);

    const advisorCard = rootQuery('#htql-hindex-advisor-card');
    if (advisorCard) {
      advisorCard.innerHTML = `
        <div class="htql-hindex-panel-head">
          <span class="htql-hindex-panel-head-icon">${svgIcon('advisor')}</span>
          <span>CỐ VẤN HỌC TẬP</span>
        </div>
        <div class="htql-hindex-advisor-grid">
          <div class="htql-hindex-meta-row">
            <div class="htql-hindex-meta-label">Mã cán bộ</div>
            <div class="htql-hindex-meta-value">${data.advisor.id || '---'}</div>
          </div>
          <div class="htql-hindex-meta-row">
            <div class="htql-hindex-meta-label">Họ và tên</div>
            <div class="htql-hindex-meta-value">${data.advisor.name || '---'}</div>
          </div>
          <div class="htql-hindex-meta-row">
            <div class="htql-hindex-meta-label">Email</div>
            <div class="htql-hindex-meta-value">${data.advisor.email || '---'}</div>
          </div>
          <div class="htql-hindex-meta-row">
            <div class="htql-hindex-meta-label">Điện thoại</div>
            <div class="htql-hindex-meta-value">${data.advisor.phone || '---'}</div>
          </div>
        </div>
      `;
    }

    const familyCard = rootQuery('#htql-hindex-family-card');
    if (familyCard) {
      familyCard.innerHTML = `
        <div class="htql-hindex-panel-head">
          <span class="htql-hindex-panel-head-icon">${svgIcon('family')}</span>
          <span>THÔNG TIN GIA ĐÌNH</span>
        </div>
      `;
      familyCard.appendChild(makeInfoRow('Người thân', data.family.members));
      familyCard.appendChild(makeInfoRow('Nơi sinh', data.family.origin));
      familyCard.appendChild(makeInfoRow('Địa chỉ liên lạc', data.family.contactAddress));
      familyCard.appendChild(makeInfoRow('Số điện thoại', data.family.phone));
      const note = document.createElement('div');
      note.className = 'htql-hindex-note';
      note.textContent = data.family.note;
      familyCard.appendChild(note);
    }

    const featureGrid = rootQuery('#htql-hindex-feature-grid');
    if (featureGrid) {
      featureGrid.innerHTML = '';
      buildFeatureActions().forEach((item) => featureGrid.appendChild(makeTile(item)));
    }

    const logoutButton = rootQuery('.htql-hindex-logout-btn');
    if (logoutButton) {
      setAction(logoutButton, () => {
        if (typeof window.thoat === 'function') {
          window.thoat('../logout.php');
        } else {
          location.href = '../logout.php';
        }
      });
    }

    const homeButton = rootQuery('.htql-hindex-home-btn');
    if (homeButton) {
      setAction(homeButton, () => {
        location.href = 'hindex.php';
      });
    }

    const profileLink = rootQuery('#htql-hindex-profile-link');
    const editLink = rootQuery('#htql-hindex-edit-link');
    if (profileLink) {
      setAction(profileLink, () => {
        location.href = 'hindex.php?mID=thongtinsinhvien';
      });
    }
    if (editLink) {
      setAction(editLink, () => {
        location.href = 'hindex.php?mID=yeucauhieuchinhthongtinsinhvien';
      });
    }

    return root;
  }

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
    const sideBtnBg = `rgba(255, 255, 255, ${Math.max(opacity - 0.04, 0.16)})`;

    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');

      :root {
        --htql-hindex-blue: ${theme};
        --htql-hindex-label: ${heading};
        --htql-hindex-ink: ${text};
        --htql-hindex-card: ${cardBg};
        --htql-hindex-border: rgba(255, 255, 255, 0.22);
        --htql-hindex-shadow: 0 14px 38px rgba(27, 43, 92, 0.10);
        --htql-hindex-blur: ${blur}px;
        --htql-hindex-chip-bg: ${chipBg};
        --htql-hindex-tile-bg: ${tileBg};
        --htql-hindex-side-btn-bg: ${sideBtnBg};
        --htql-hindex-pill-bg: ${themeTint(theme, 0.14)};
        --htql-hindex-badge-bg: ${themeTint(theme, 0.12)};
        --htql-hindex-muted: ${themeTint(text, 0.72)};
      }

      html, body {
        margin: 0 !important;
        width: 100% !important;
        min-height: 100% !important;
        overflow: auto !important;
        font-family: '${font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        background: ${isVideoUrl(bgUrl) ? 'transparent' : `${cssBackgroundUrl(bgUrl)} center center / cover fixed no-repeat`} !important;
      }

      body::before,
      body::after {
        content: none !important;
        display: none !important;
      }

      ::-webkit-scrollbar {
        display: none;
      }

      * {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      body.htql-hindex-active > *:not(#${ROOT_ID}):not(#htql-hindex-video-bg) {
        display: none !important;
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      button {
        font: inherit;
      }

      * {
        box-sizing: border-box !important;
      }

      #${ROOT_ID} {
        position: relative;
        z-index: 1;
        width: 100%;
        min-height: 100vh;
        padding: 16px;
      }

      .htql-hindex-shell {
        width: min(1450px, 100%);
        margin: 0 auto;
        display: grid;
        gap: 14px;
      }

      .htql-hindex-card {
        background: var(--htql-hindex-card);
        border: 1px solid var(--htql-hindex-border);
        box-shadow: var(--htql-hindex-shadow);
        backdrop-filter: blur(var(--htql-hindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-hindex-blur));
      }

      .htql-hindex-topbar {
        border-radius: 20px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .htql-hindex-brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .htql-hindex-brand-mark {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: transparent;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
      }

      .htql-hindex-brand-copy {
        min-width: 0;
      }

      .htql-hindex-brand-title {
        color: var(--htql-hindex-blue);
        font-size: 1.05rem;
        line-height: 1.4;
        font-weight: 800;
        letter-spacing: 0em;
        text-transform: uppercase;
        white-space: normal;
        overflow: visible;
        word-break: break-word;
      }

      .htql-hindex-brand-subtitle {
        margin-top: 4px;
        font-size: 0.84rem;
        color: var(--htql-hindex-muted);
        font-weight: 600;
      }

      .htql-hindex-top-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
      }

      .htql-hindex-home-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: var(--htql-hindex-chip-bg);
        color: var(--htql-hindex-blue);
        font-size: 0.84rem;
        font-weight: 800;
        box-shadow: 0 6px 14px rgba(46, 70, 160, 0.08);
        backdrop-filter: blur(var(--htql-hindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-hindex-blur));
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease;
      }

      .htql-hindex-home-btn:hover {
        background: ${themeTint(theme, 0.18)};
      }

      .htql-hindex-home-btn svg,
      .htql-hindex-side-btn-icon svg,
      .htql-hindex-chip-icon svg,
      .htql-hindex-panel-head-icon svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
        flex: 0 0 auto;
      }

      .htql-hindex-logout-btn {
        height: 40px;
        padding: 0 18px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 13px;
        background: rgba(195, 77, 63, 0.55);
        backdrop-filter: blur(var(--htql-hindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-hindex-blur));
        color: #fff;
        font-weight: 800;
        font-size: 0.88rem;
        box-shadow: 0 8px 16px rgba(169, 52, 44, 0.14);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
      }

      .htql-hindex-logout-btn:hover {
        background: rgba(195, 77, 63, 0.72);
        border-color: rgba(255, 255, 255, 0.45);
      }

      .htql-hindex-main {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
        grid-template-rows: auto auto;
        column-gap: 14px;
        row-gap: 40px;
        align-items: stretch;
      }

      .htql-hindex-hero {
        grid-column: 1;
        grid-row: 1;
        padding: 14px 20px 12px;
        border-radius: 24px;
        min-height: 160px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .htql-hindex-hero-inner {
        display: flex;
        align-items: stretch;
        gap: 20px;
        flex: 1;
      }

      .htql-hindex-hero-info {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        min-width: 0;
        justify-content: center;
      }

      .htql-hindex-advisor-panel {
        grid-column: 2;
        grid-row: 1;
        min-height: 160px;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .htql-hindex-advisor-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 16px;
        margin-top: 8px;
        flex: 1;
        align-content: start;
      }

      .htql-hindex-functions {
        grid-column: 1;
        grid-row: 2;
        padding: 0;
        border: 0;
        box-shadow: none;
        background: transparent;
      }

      .htql-hindex-side-bottom {
        grid-column: 2;
        grid-row: 2;
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 0;
      }

      .htql-hindex-name-group {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        min-width: 0;
      }

      .htql-hindex-name {
        margin: 0;
        color: var(--htql-hindex-blue);
        font-size: clamp(2rem, 2.8vw, 3rem);
        line-height: 1.1;
        letter-spacing: 0.01em;
        font-weight: 800;
        text-transform: uppercase;
      }

      .htql-hindex-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 0 18px;
        border-radius: 12px;
        background: var(--htql-hindex-badge-bg);
        border: 1px solid ${themeTint(theme, 0.16)};
        color: var(--htql-hindex-blue);
        font-weight: 800;
        letter-spacing: 0.02em;
        font-size: 1.3rem;
      }

      .htql-hindex-faculty {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--htql-hindex-muted);
        line-height: 1.35;
      }

      .htql-hindex-major {
        font-size: clamp(1.1rem, 1.4vw, 1.35rem);
        font-weight: 600;
        color: var(--htql-hindex-ink);
      }

      .htql-hindex-chip-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        align-content: center;
        flex: 0 0 auto;
      }

      .htql-hindex-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 138px;
        padding: 10px 14px;
        border-radius: 16px;
        background: var(--htql-hindex-chip-bg);
        border: 1px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 8px 18px rgba(31, 54, 126, 0.05);
        backdrop-filter: blur(calc(var(--htql-hindex-blur) * 0.75));
        -webkit-backdrop-filter: blur(calc(var(--htql-hindex-blur) * 0.75));
      }

      .htql-hindex-chip-icon {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        display: grid;
        place-items: center;
        color: var(--htql-hindex-blue);
      }

      .htql-hindex-chip-label {
        font-size: 0.66rem;
        color: var(--htql-hindex-muted);
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.03em;
      }

      .htql-hindex-chip-value {
        margin-top: 2px;
        font-size: 0.9rem;
        color: var(--htql-hindex-ink);
        font-weight: 800;
      }

      .htql-hindex-panel {
        padding: 16px 16px 14px;
        border-radius: 24px;
        overflow: auto;
      }

      .htql-hindex-family-panel {
        flex: 1;
        min-height: 0;
      }

      .htql-hindex-panel-head {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--htql-hindex-blue);
        font-size: 0.94rem;
        font-weight: 800;
        padding-bottom: 10px;
        margin-bottom: 8px;
        border-bottom: 1px solid rgba(160, 176, 228, 0.22);
      }

      .htql-hindex-meta-row {
        margin-bottom: 6px;
      }

      .htql-hindex-meta-label {
        font-size: 0.62rem;
        color: var(--htql-hindex-label);
        text-transform: uppercase;
        font-weight: 800;
        letter-spacing: 0.03em;
        margin-bottom: 2px;
      }

      .htql-hindex-meta-value {
        font-size: 0.8rem;
        line-height: 1.3;
        color: var(--htql-hindex-ink);
        font-weight: 700;
        word-break: break-word;
      }

      .htql-hindex-meta-value-accent {
        color: var(--htql-hindex-blue);
        font-weight: 800;
      }

      .htql-hindex-note {
        margin-top: 4px;
        font-size: 0.72rem;
        line-height: 1.45;
        color: rgba(92, 100, 117, 0.72);
        font-style: italic;
        max-height: 48px;
        overflow: hidden;
      }

      .htql-hindex-side-actions {
        display: grid;
        gap: 10px;
      }

      .htql-hindex-side-btn {
        height: 48px;
        padding: 0 16px;
        border-radius: 999px;
        background: var(--htql-hindex-side-btn-bg);
        border: 1px solid rgba(255, 255, 255, 0.35);
        box-shadow: 0 7px 14px rgba(24, 36, 88, 0.08);
        backdrop-filter: blur(var(--htql-hindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-hindex-blur));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: var(--htql-hindex-blue);
        font-weight: 800;
        font-size: 0.84rem;
      }

      .htql-hindex-side-btn-secondary {
        background: var(--htql-hindex-card);
      }

      .htql-hindex-feature-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }

      .htql-hindex-tile {
        min-height: 132px;
        border: none;
        border-radius: 18px;
        padding: 16px 12px 14px;
        background: var(--htql-hindex-tile-bg);
        border: 1px solid rgba(255, 255, 255, 0.28);
        box-shadow: 0 10px 18px rgba(34, 52, 111, 0.06);
        backdrop-filter: blur(var(--htql-hindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-hindex-blur));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        text-align: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: background 0.22s ease, border-color 0.22s ease;
      }

      .htql-hindex-tile:hover {
        background: rgba(255, 255, 255, ${Math.min(opacity + 0.14, 0.92)});
        border-color: ${themeTint(theme, 0.28)};
      }

      .htql-hindex-tile:hover .htql-hindex-tile-text {
        color: var(--htql-hindex-blue);
      }

      .htql-hindex-tile::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, var(--tile-accent-soft) 0%, rgba(255, 255, 255, 0) 100%);
        pointer-events: none;
      }

      .htql-hindex-tile-icon,
      .htql-hindex-tile-text {
        position: relative;
        z-index: 1;
      }

      .htql-hindex-tile-icon {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.5);
        display: grid;
        place-items: center;
      }

      .htql-hindex-tile-icon img {
        width: 22px;
        height: 22px;
        object-fit: contain;
      }

      .htql-hindex-tile-text {
        font-size: 0.74rem;
        line-height: 1.25;
        font-weight: 800;
        color: var(--htql-hindex-ink);
        text-transform: uppercase;
        text-wrap: balance;
      }

      @media (max-width: 1280px) {
        .htql-hindex-main {
          grid-template-columns: minmax(0, 1fr) 320px;
        }

        .htql-hindex-feature-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }

      @media (max-width: 1024px) {
        body {
          overflow: auto !important;
        }

        #${ROOT_ID} {
          padding: 12px;
        }

        .htql-hindex-main {
          grid-template-columns: 1fr;
          grid-template-rows: auto;
        }

        .htql-hindex-hero,
        .htql-hindex-advisor-panel,
        .htql-hindex-functions,
        .htql-hindex-side-bottom {
          grid-column: 1;
          grid-row: auto;
        }

        .htql-hindex-feature-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }

      @media (max-width: 720px) {
        .htql-hindex-topbar {
          flex-direction: column;
          align-items: stretch;
        }

        .htql-hindex-top-actions {
          justify-content: flex-start;
          flex-wrap: wrap;
        }

        .htql-hindex-brand-title {
          font-size: 1rem;
        }

        .htql-hindex-hero-inner {
          flex-direction: column;
        }

        .htql-hindex-chip-grid {
          grid-template-columns: 1fr 1fr;
        }

        .htql-hindex-feature-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 480px) {
        .htql-hindex-feature-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  function removeLoadingState() {
    document.documentElement.classList.remove('htql-hindex-loading');
    document.documentElement.style.background = '';
    if (loadingStyle.parentNode) loadingStyle.remove();
  }

  function applyTheme(settings) {
    currentSettings = { ...DEFAULTS, ...(settings || {}) };
    injectStyle(getCSS(currentSettings));
    applyVideoBg(isVideoUrl(currentSettings.bgUrl) ? currentSettings.bgUrl : null);
  }

  function loadAndApplyTheme(done) {
    if (chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(DEFAULTS, (saved) => {
        applyTheme(saved);
        if (typeof done === 'function') done(saved);
      });
      return;
    }
    applyTheme(DEFAULTS);
    if (typeof done === 'function') done(DEFAULTS);
  }

  function boot() {
    if (booted) return;
    if (!document.body || !document.head) return;

    const data = {
      student: extractStudentData(),
      advisor: extractAdvisorData(),
      family: extractFamilyData(),
    };

    const hasStudentTable = Boolean(getTableByText('THONG TIN SINH VIEN'));
    if (!hasStudentTable) {
      setTimeout(boot, 250);
      return;
    }

    booted = true;

    disableOriginalCSS();
    loadAndApplyTheme(() => {
      document.body.classList.add('htql-hindex-active');

      const existingRoot = document.getElementById(ROOT_ID);
      if (existingRoot) {
        existingRoot.remove();
      }
      document.body.appendChild(buildShell(data));
      document.body.style.margin = '0';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      // Đảm bảo video nền luôn là con đầu tiên của body
      const vid = document.getElementById('htql-hindex-video-bg');
      if (vid && vid !== document.body.firstChild) {
        document.body.insertBefore(vid, document.body.firstChild);
      }

      removeLoadingState();
    });
  }

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !booted) return;
      loadAndApplyTheme();
    });
  }

  document.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('load', boot);
  boot();
})();
