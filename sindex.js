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
  const IS_S301 = CURRENT_MID === 'S301';
  const IS_S3011 = CURRENT_MID === 'S3011';

  const DEFAULTS = {
    glassOpacity: 0.3,
    glassBlur: 20,
    glassColor: '#ffffff',
    themeColor: '#152550',
    textColor: '#1e293b',
    headingColor: '#152550',
    fontFamily: 'Plus Jakarta Sans',
    bgUrl: '',
    effects: {
      leafFloat: true,
      leafHover: true,
    },
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

  function isSolidUrl(url) {
    return url && url.startsWith('solid:');
  }

  function solidUrlToColor(url) {
    return url && url.startsWith('solid:') ? url.slice(6) : '#0a0f1e';
  }

  function glassRgb(hex) {
    const clean = (hex || '#ffffff').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c+c).join('') : clean;
    const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
    return (isNaN(r)||isNaN(g)||isNaN(b)) ? '255,255,255' : `${r},${g},${b}`;
  }

  function gc(hex, alpha) {
    return `rgba(${glassRgb(hex)},${alpha})`;
  }

  function applyVideoBg(url) {
    let vid = document.getElementById('htql-sindex-video-bg');
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
      vid.id = 'htql-sindex-video-bg';
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
      document.addEventListener('visibilitychange', () => {
        if (!document.getElementById('htql-sindex-video-bg')) return;
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

  function applyBackground(bgUrl) {
    const isSolid = isSolidUrl(bgUrl);
    const isVideo = isVideoUrl(bgUrl);
    if (isSolid) {
      const color = solidUrlToColor(bgUrl);
      document.documentElement.style.setProperty('background', color, 'important');
      document.body.style.setProperty('background-color', color, 'important');
      document.body.style.setProperty('background-image', 'none', 'important');
      applyVideoBg(null);
    } else if (isVideo) {
      document.documentElement.style.removeProperty('background');
      document.body.style.setProperty('background', 'transparent', 'important');
      applyVideoBg(bgUrl);
    } else {
      document.documentElement.style.removeProperty('background');
      document.body.style.setProperty('background-image', cssBackgroundUrl(bgUrl || DEFAULT_BG_URL), 'important');
      document.body.style.setProperty('background-size', 'cover', 'important');
      document.body.style.setProperty('background-position', 'center', 'important');
      document.body.style.setProperty('background-attachment', 'fixed', 'important');
      document.body.style.setProperty('background-repeat', 'no-repeat', 'important');
      document.body.style.removeProperty('background-color');
      applyVideoBg(null);
    }
  }

  function resolveBgUrl(settings) {
    const bg = settings && settings.bgUrl;
    return bg && bg !== '' ? bg : DEFAULT_BG_URL;
  }

  function resolveEffectSettings(settings) {
    return {
      ...DEFAULTS.effects,
      ...((settings && settings.effects) || {}),
    };
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

  // Trang S301 — danh sách học phần sinh viên đã nhập (8 cột)
  function extractS301Data() {
    const data = {
      title: 'Danh sách học phần sinh viên đã nhập',
      rows: [],
      summary: { count: '', credits: '' },
      filters: {
        namHocOptions: [],
        hocKyOptions: [],
        selectedNamHoc: '',
        selectedHocKy: '',
      },
      actions: { themCTDT: '', themNgoai: '', themCaiThien: '' },
      advisor: extractAdvisorData(),
      notices: extractNotices(),
      menuItems: extractMenuItems(),
    };

    const form = document.forms.frmCacMonPhaiHocTC;
    if (form) {
      const namSel = form.cboNamHoc;
      const hkSel = form.cboHocKy;
      if (namSel) {
        Array.from(namSel.options).forEach((opt) => {
          data.filters.namHocOptions.push({
            value: opt.value,
            label: normalize(opt.textContent),
            selected: opt.selected,
          });
        });
        data.filters.selectedNamHoc = namSel.value;
      }
      if (hkSel) {
        Array.from(hkSel.options).forEach((opt) => {
          data.filters.hocKyOptions.push({
            value: opt.value,
            label: normalize(opt.textContent),
            selected: opt.selected,
          });
        });
        data.filters.selectedHocKy = hkSel.value;
      }
    }

    [['btnThem', 'themCTDT'], ['btnThemNgoai', 'themNgoai'], ['btnThemCaiThien', 'themCaiThien']].forEach(([id, key]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const onclick = btn.getAttribute('onclick') || '';
      const match = onclick.match(/capnhat\('([^']+)'\)/);
      if (match) data.actions[key] = match[1];
    });

    document.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (cells.length !== 8) return;
      const stt = normalize(cells[0].textContent);
      if (!/\d+/.test(stt)) return;
      const maHP = normalize(cells[1].textContent);
      const tenHP = normalize(cells[2].textContent);
      if (!maHP || !tenHP) return;

      let deleteMa = maHP;
      let deleteDVHT = normalize(cells[3].textContent);
      const delLink = cells[7].querySelector('a[onclick]');
      if (delLink) {
        const onclick = delLink.getAttribute('onclick') || '';
        const m = onclick.match(/xoa(?:CaiThien)?\('([^']+)',\s*(\d+)\)/);
        if (m) {
          deleteMa = m[1];
          deleteDVHT = m[2];
        }
      }

      data.rows.push({
        stt,
        maHP,
        tenHP,
        soTC: normalize(cells[3].textContent),
        namHoc: normalize(cells[4].textContent),
        hocKy: normalize(cells[5].textContent),
        caiThien: normalize(cells[6].textContent),
        deleteMa,
        deleteDVHT,
      });
    });

    document.querySelectorAll('span[style*="color:#008000"], span[style*="color: #008000"]').forEach((el) => {
      const text = el.textContent;
      const countM = text.match(/Tổng số học phần:\s*(\d+)/);
      const creditM = text.match(/Tổng số tín chỉ:\s*(\d+)/);
      if (countM) data.summary.count = countM[1];
      if (creditM) data.summary.credits = creditM[1];
    });

    if (!data.summary.count && !data.summary.credits) {
      Array.from(document.querySelectorAll('td')).forEach((td) => {
        const text = td.textContent;
        const countM = text.match(/Tổng số học phần:\s*(\d+)/);
        const creditM = text.match(/Tổng số tín chỉ:\s*(\d+)/);
        if (countM) data.summary.count = countM[1];
        if (creditM) data.summary.credits = creditM[1];
      });
    }

    return data;
  }

  function preserveS301Forms() {
    const forms = {};
    ['frmCacMonPhaiHocTC', 'frmXoa', 'frmXoaCaiThien', 'frmDuLieuLoc'].forEach((name) => {
      if (document.forms[name]) forms[name] = document.forms[name];
    });
    return forms;
  }

  function extractSelectOptions(select) {
    if (!select) return [];
    return Array.from(select.options).map((opt) => ({
      value: opt.value,
      label: normalize(opt.textContent),
      selected: opt.selected,
    }));
  }

  function parseKiemTraNamHoc(onchange) {
    const match = String(onchange || '').match(/kiemTraNamHoc\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return { namHocHT: match[1], hocKyHT: match[2], index: match[3] };
  }

  function submitFormSafe(form) {
    if (!form) return false;
    const submitFn = HTMLFormElement.prototype.submit;
    if (typeof submitFn === 'function') {
      submitFn.call(form);
      return true;
    }
    if (typeof form.submit === 'function') {
      form.submit();
      return true;
    }
    return false;
  }

  function getNamedControls(form, name) {
    if (!form) return [];
    return Array.from(form.querySelectorAll(`[name="${name}"]`));
  }

  function installS3011Globals(forms) {
    const mainForm = forms.frmKhungCTDTTinChi || null;
    const saveForm = forms.frmDuLieuLuu || null;
    const pageForm = forms.frmChuyenTrang || null;

    if (typeof window.ql_thoigian_hoc === 'undefined') window.ql_thoigian_hoc = 0;
    if (typeof window.showNgoaiGio === 'undefined') window.showNgoaiGio = false;
    if (!window.arrSTC) window.arrSTC = [];
    if (typeof window.TCMAXDefault === 'undefined') window.TCMAXDefault = 20;
    if (typeof window.TCMAXHe === 'undefined') window.TCMAXHe = 20;

    window.test = function () {
      const btnThem = mainForm && mainForm.querySelector('#btnThem');
      if (btnThem) btnThem.disabled = true;
    };

    window.batTat = function (val, stt) {
      const namHocs = getNamedControls(mainForm, 'cboNamHoc');
      const hocKys = getNamedControls(mainForm, 'cboHocKy');
      const ngayBDs = getNamedControls(mainForm, 'txtNgayBD');
      const ngayKTs = getNamedControls(mainForm, 'txtNgayKT');
      const ngoaiGios = getNamedControls(mainForm, 'MonHocNgoaiGio');

      if (val === true) {
        if (namHocs[stt]) namHocs[stt].disabled = false;
        if (hocKys[stt]) hocKys[stt].disabled = false;
        if (window.ql_thoigian_hoc === 1) {
          if (ngayBDs[stt]) ngayBDs[stt].disabled = false;
          if (ngayKTs[stt]) ngayKTs[stt].disabled = false;
        }
        if (window.showNgoaiGio) {
          const extra = ngoaiGios[stt] || ngoaiGios[0];
          if (extra) extra.disabled = false;
        }
        return;
      }

      if (namHocs[stt]) {
        namHocs[stt].disabled = true;
        namHocs[stt].selectedIndex = 0;
      }
      if (hocKys[stt]) {
        hocKys[stt].disabled = true;
        hocKys[stt].selectedIndex = 0;
      }
      if (window.ql_thoigian_hoc === 1) {
        if (ngayBDs[stt]) {
          ngayBDs[stt].disabled = true;
          ngayBDs[stt].value = '';
        }
        if (ngayKTs[stt]) {
          ngayKTs[stt].disabled = true;
          ngayKTs[stt].value = '';
        }
      }
      if (window.showNgoaiGio) {
        const extra = ngoaiGios[stt] || ngoaiGios[0];
        if (extra) {
          extra.checked = false;
          extra.disabled = true;
        }
      }
    };

    window.selectId = function (check) {
      const btnThem = mainForm && mainForm.querySelector('#btnThem');
      if (!mainForm || !btnThem) return;
      const checks = getNamedControls(mainForm, 'chkChon');
      if (checks.length > 1) {
        if (check !== true) {
          btnThem.disabled = true;
          for (let i = 0; i < checks.length; i += 1) {
            if (checks[i].checked === true) {
              btnThem.disabled = false;
              return false;
            }
          }
        } else {
          btnThem.disabled = false;
          return false;
        }
      } else if (checks[0]) {
        btnThem.disabled = !checks[0].checked;
      }
      return true;
    };

    window.ketthuc = function () {
      if (!mainForm) return;
      mainForm.action = 'sindex.php?mID=S301';
      submitFormSafe(mainForm);
    };

    window.kiemTraHopLe = function () {
      if (!mainForm) return false;
      const maMH = mainForm.querySelector('#txtMaMonHoc');
      const tenMH = mainForm.querySelector('#txtTenMonHoc');
      const hopLeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      const invalidChars = "<>'/[];";

      if (maMH) {
        const chuoi = maMH.value || '';
        for (let i = 0; i < chuoi.length; i += 1) {
          if (!hopLeChars.includes(chuoi.charAt(i))) {
            alert('Ma hoc phan chi chua ky tu va so !');
            maMH.focus();
            return false;
          }
        }
      }

      if (tenMH) {
        const chuoi = tenMH.value || '';
        for (let i = 0; i < chuoi.length; i += 1) {
          if (invalidChars.includes(chuoi.charAt(i))) {
            alert('Ten hoc phan khong the chua cac ky tu dac biet. Vi du: <>\'/[];');
            tenMH.focus();
            return false;
          }
        }
      }

      return true;
    };

    window.lietke = function () {
      if (!window.kiemTraHopLe || !window.kiemTraHopLe()) return;
      const maMH = mainForm && mainForm.querySelector('#txtMaMonHoc');
      if (maMH) maMH.value = (maMH.value || '').toUpperCase();
      if (!mainForm) return;
      mainForm.action = 'sindex.php?mID=S3011';
      submitFormSafe(mainForm);
    };

    window.ddmmyyyy2yyyymmdd = function (str) {
      const arr = String(str || '').split('-');
      if (arr.length === 1) {
        return String(str || '').split('/').reverse().join('');
      }
      return `${arr[2]}${arr[1]}${arr[0]}`;
    };

    window.kiemTra = function () {
      if (!mainForm || !saveForm) return false;
      const checks = getNamedControls(mainForm, 'chkChon');
      const namHocs = getNamedControls(mainForm, 'cboNamHoc');
      const hocKys = getNamedControls(mainForm, 'cboHocKy');
      const batBuocs = getNamedControls(mainForm, 'chkBatBuoc');
      const dvhts = getNamedControls(mainForm, 'hdDVHT');
      const ngayBDs = getNamedControls(mainForm, 'txtNgayBD');
      const ngayKTs = getNamedControls(mainForm, 'txtNgayKT');
      const ngoaiGios = getNamedControls(mainForm, 'MonHocNgoaiGio');

      let strMaMH = '';
      const arrTemp = [];
      const hasMany = namHocs.length > 1;

      if (hasMany) {
        for (let i = 0; i < namHocs.length; i += 1) {
          const chk = checks[i];
          if (!chk || !chk.checked) continue;
          const namHoc = namHocs[i];
          const hocKy = hocKys[i];
          if (!namHoc || !hocKy || namHoc.value === '' || hocKy.value === '') {
            alert(`Chua chon Nam hoc hoac Hoc ky cho hoc phan ${chk.value}`);
            return false;
          }
          if (window.ql_thoigian_hoc === 1) {
            if (!ngayBDs[i] || !ngayKTs[i] || ngayBDs[i].value === '' || ngayKTs[i].value === '') {
              alert(`Vui long chon ngay bat dau va ngay ket thuc cho hoc phan ${chk.value}`);
              return false;
            }
            if (window.ddmmyyyy2yyyymmdd(ngayKTs[i].value) <= window.ddmmyyyy2yyyymmdd(ngayBDs[i].value)) {
              alert(`Ngay bat dau cua mon ${chk.value} khong duoc lon ngay ket thuc`);
              return false;
            }
          }

          const batBuoc = batBuocs[i] ? batBuocs[i].value : '';
          const dvht = dvhts[i] ? dvhts[i].value : '0';
          const parts = [chk.value, namHoc.value, hocKy.value, batBuoc, dvht];
          if (window.ql_thoigian_hoc === 1) {
            parts.push(ngayBDs[i].value, ngayKTs[i].value);
          }
          if (window.showNgoaiGio) {
            const extra = ngoaiGios[i];
            parts.push(extra && extra.checked ? '1' : '0');
          }
          const rowValue = parts.join('|');
          strMaMH = strMaMH ? `${strMaMH},${rowValue}` : rowValue;

          const nhhk = `${namHoc.value}${hocKy.value}`;
          const dvhtVal = dvht || '0';
          arrTemp[nhhk] = arrTemp[nhhk] !== undefined ? Number(arrTemp[nhhk]) + Number(dvhtVal) : Number(dvhtVal);
        }
      } else if (checks[0] && checks[0].checked) {
        const namHoc = namHocs[0];
        const hocKy = hocKys[0];
        if (!namHoc || !hocKy || namHoc.value === '' || hocKy.value === '') {
          alert(`Chua chon Nam hoc hoac Hoc ky cho hoc phan 1${checks[0].value}`);
          return false;
        }
        if (window.ql_thoigian_hoc === 1) {
          if (!ngayBDs[0] || !ngayKTs[0] || ngayBDs[0].value === '' || ngayKTs[0].value === '') {
            alert(`Vui long chon ngay bat dau va nga ket thuc cho hoc phan ${checks[0].value}`);
            return false;
          }
          if (window.ddmmyyyy2yyyymmdd(ngayKTs[0].value) <= window.ddmmyyyy2yyyymmdd(ngayBDs[0].value)) {
            alert(`Ngay bat dau cua mon ${checks[0].value} khong duoc lon ngay ket thuc`);
            return false;
          }
        }

        const batBuoc = batBuocs[0] ? batBuocs[0].value : '';
        const dvht = dvhts[0] ? dvhts[0].value : '0';
        const parts = [checks[0].value, namHoc.value, hocKy.value, batBuoc, dvht];
        if (window.ql_thoigian_hoc === 1) {
          parts.push(ngayBDs[0].value, ngayKTs[0].value);
        }
        if (window.showNgoaiGio) {
          const extra = ngoaiGios[0];
          parts.push(extra && extra.checked ? '1' : '0');
        }
        strMaMH = parts.join('|');

        const nhhk = `${namHoc.value}${hocKy.value}`;
        arrTemp[nhhk] = Number(dvht || 0);
      }

      let msg = '';
      for (const x in arrTemp) {
        const nam = Math.round(x / 10, 0);
        const hk = x % 10;
        if (window.arrSTC && window.arrSTC[x] === undefined) {
          window.arrSTC[x] = [];
          window.arrSTC[x].STC = 0;
          window.arrSTC[x].TCMAX = hk === 3 ? window.TCMAXHe : window.TCMAXDefault;
          if (String(nam) === '2021' && hk === 1) window.arrSTC[x].TCMAX = '25';
          if (String(nam) === '2022' && hk === 1) window.arrSTC[x].TCMAX = '25';
        }
        if (window.arrSTC && Number(window.arrSTC[x].STC) + Number(arrTemp[x]) > Number(window.arrSTC[x].TCMAX)) {
          const stcHt = Number(window.arrSTC[x].STC) + Number(arrTemp[x]);
          msg += ` + So tin chi nam hoc ${nam - 1}-${nam} hoc ky ${hk} la ${stcHt} TC (da luu ${window.arrSTC[x].STC} TC) vuot qua so tin chi cho phep (${Number(window.arrSTC[x].TCMAX)} TC)\n`;
        }
      }

      if (msg !== '') {
        msg += 'Vui long kiem tra lai!';
        alert(msg);
        return false;
      }

      const hiddenMang = saveForm.querySelector('#txtMangMaMH');
      if (hiddenMang) hiddenMang.value = strMaMH;
      submitFormSafe(saveForm);
      return true;
    };

    window.kiemTraNamHoc = function (namHocHT, hocKyHT, thisIndex, thisValue) {
      const hocKyKT = Number(hocKyHT) !== 1 ? Number(hocKyHT) - 1 : Number(hocKyHT);
      const namHocs = getNamedControls(mainForm, 'cboNamHoc');
      const hocKys = getNamedControls(mainForm, 'cboHocKy');
      if (namHocs.length > 1) {
        if (namHocs[thisIndex] && namHocs[thisIndex].value === '') {
          alert('Xin vui long chon nam hoc!');
          if (hocKys[thisIndex]) hocKys[thisIndex].selectedIndex = 0;
          if (namHocs[thisIndex]) namHocs[thisIndex].focus();
          return;
        }
        if (((namHocs[thisIndex].value === String(namHocHT)) && Number(thisValue) < hocKyKT) || ((Number(namHocs[thisIndex].value) < Number(namHocHT)) && Number(thisValue) < 2)) {
          alert('Hoc ky khong hop le');
          if (hocKys[thisIndex]) hocKys[thisIndex].selectedIndex = 0;
        }
      } else if (namHocs[0]) {
        if (namHocs[0].value === '') {
          alert('Xin vui long chon nam hoc!');
          if (hocKys[0]) hocKys[0].selectedIndex = 0;
          namHocs[0].focus();
          return;
        }
        if (((namHocs[0].value === String(namHocHT)) && Number(thisValue) < hocKyKT) || ((Number(namHocs[0].value) < Number(namHocHT)) && Number(thisValue) < 2)) {
          alert('Hoc ky khong hop le');
          if (hocKys[0]) hocKys[0].selectedIndex = 0;
        }
      }
    };

    window.ktNamHoc = function (stt) {
      const hocKys = getNamedControls(mainForm, 'cboHocKy');
      if (hocKys[stt]) hocKys[stt].selectedIndex = 0;
      return false;
    };

    window.chuyenTrang = function (id) {
      if (!pageForm) return false;
      const pID = pageForm.querySelector('#pID');
      if (pID) pID.value = id;
      const srcMa = mainForm && mainForm.querySelector('#txtMaMonHoc');
      const srcTen = mainForm && mainForm.querySelector('#txtTenMonHoc');
      const dstMa = pageForm.querySelector('#txtMaMonHoc');
      const dstTen = pageForm.querySelector('#txtTenMonHoc');
      if (dstMa && srcMa) dstMa.value = srcMa.value;
      if (dstTen && srcTen) dstTen.value = srcTen.value;
      submitFormSafe(pageForm);
      return true;
    };
  }

  // Trang S3011 — thêm học phần từ CTDT
  function extractS3011Data() {
    const form = document.forms.frmKhungCTDTTinChi;
    const data = {
      title: '',
      searchCode: '',
      rows: [],
      totalLabel: '',
      pagination: { current: 1, total: 1, pages: [] },
      saveDisabled: true,
      advisor: extractAdvisorData(),
      notices: extractNotices(),
      menuItems: extractMenuItems(),
    };

    const titleEl = document.querySelector('td.main_1');
    if (titleEl) data.title = normalize(titleEl.textContent);

    if (form && form.txtMaMonHoc) {
      data.searchCode = form.txtMaMonHoc.value || '';
    }

    const btnThem = document.getElementById('btnThem');
    if (btnThem) data.saveDisabled = btnThem.disabled;

    let formIndex = -1;
    if (form) {
      form.querySelectorAll('table.border_1 tr').forEach((tr) => {
        if (tr.querySelector('td[colspan]')) return;
        const cells = Array.from(tr.querySelectorAll('td'));
        if (cells.length !== 8) return;
        const stt = normalize(cells[0].textContent);
        if (!/\d+/.test(stt)) return;

        const maHP = normalize(cells[1].textContent);
        const tenHP = normalize(cells[2].textContent);
        if (!maHP || !tenHP) return;

        const soTC = normalize(cells[3].textContent.replace(/\s+/g, ' ')).split(/\s/)[0];
        const batBuoc = normalize(cells[4].textContent);
        const addedMark = cells[7].querySelector('font[color="#0000FF"]');
        if (addedMark && normalize(addedMark.textContent).toLowerCase().includes('đã thêm')) {
          data.rows.push({
            type: 'added',
            stt,
            maHP,
            tenHP,
            soTC,
            batBuoc,
            namHoc: normalize(cells[5].textContent),
            hocKy: normalize(cells[6].textContent),
          });
          return;
        }

        const chk = cells[7].querySelector('input[name="chkChon"][type="checkbox"]');
        if (!chk || chk.style.display === 'none') return;

        formIndex += 1;
        const namSel = cells[5].querySelector('select[name="cboNamHoc"]');
        const hkSel = cells[6].querySelector('select[name="cboHocKy"]');
        data.rows.push({
          type: 'selectable',
          formIndex,
          stt,
          maHP,
          tenHP,
          soTC,
          batBuoc,
          value: chk.value,
          checked: chk.checked,
          namOptions: extractSelectOptions(namSel),
          hocKyOptions: extractSelectOptions(hkSel),
          kiemTraParams: parseKiemTraNamHoc(hkSel && hkSel.getAttribute('onchange')),
          chkEl: chk,
          namSel,
          hkSel,
        });
      });
    }

    document.querySelectorAll('span[style*="color:#008000"], span[style*="color: #008000"], font[color="green"]').forEach((el) => {
      const text = normalize(el.textContent);
      if (text.includes('Tổng số') && text.includes('học phần')) data.totalLabel = text;
      const pageMatch = text.match(/Trang\s+(\d+)\s*\/\s*(\d+)/i);
      if (pageMatch) {
        data.pagination.current = parseInt(pageMatch[1], 10);
        data.pagination.total = parseInt(pageMatch[2], 10);
      }
    });

    document.querySelectorAll('a[onclick*="chuyenTrang"]').forEach((a) => {
      const match = (a.getAttribute('onclick') || '').match(/chuyenTrang\((\d+)\)/);
      if (!match) return;
      const page = parseInt(match[1], 10);
      if (!data.pagination.pages.includes(page)) data.pagination.pages.push(page);
    });
    data.pagination.pages.sort((a, b) => a - b);

    return data;
  }

  function preserveS3011Forms() {
    const forms = {};
    ['frmKhungCTDTTinChi', 'frmDuLieuLuu', 'frmChuyenTrang'].forEach((name) => {
      if (document.forms[name]) forms[name] = document.forms[name];
    });
    return forms;
  }

  function appendHiddenForms(root, forms) {
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none;';
    Object.values(forms).forEach((form) => {
      if (form) wrap.appendChild(form);
    });
    root.appendChild(wrap);
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
    const glassHex = s.glassColor || '#ffffff';
    const cardBg = gc(glassHex, opacity);
    const chipBg = gc(glassHex, Math.min(opacity + 0.18, 0.92));
    const tileBg = gc(glassHex, Math.max(opacity - 0.02, 0.12));

    return `
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Nunito:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700&display=swap');

      :root {
        --htql-sindex-blue: ${theme};
        --htql-sindex-label: ${heading};
        --htql-sindex-ink: ${text};
        --htql-sindex-card: ${cardBg};
        --htql-sindex-border: ${gc(glassHex, 0.22)};
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
      }

      html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }

      body.htql-sindex-active > *:not(#${ROOT_ID}):not(#htql-sindex-video-bg) {
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
      ${window.HTQL_Shared.getHeaderCSS(theme, text, chipBg, blur, glassHex)}

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
      .htql-sindex-nav-link:hover { background: ${gc(glassHex, 0.75)}; }
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
      .htql-sindex-table tbody tr:hover { background: ${gc(glassHex, 0.4)}; }
      .htql-sindex-badge-year {
        background: var(--htql-sindex-pill-bg);
        color: var(--htql-sindex-blue);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 700;
      }
      .htql-sindex-tc-value { font-weight: 700; color: var(--htql-sindex-blue); }

      /* ── TIMELINE MIND MAP ───────────────────────── */

      /* wrapper: 2 cột song song, trục ở giữa */
      .htql-sindex-timeline {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        padding: 0;
      }

      /* trục dọc ở giữa (border giữa 2 cột) */
      .htql-sindex-timeline::before {
        content: '';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        top: 0;
        bottom: 0;
        width: 3px;
        background: linear-gradient(to bottom, var(--htql-sindex-blue), ${themeTint(theme, 0.25)});
        border-radius: 4px;
        z-index: 0;
        pointer-events: none;
      }

      /* Mỗi cluster chiếm 1 ô trong grid.
         Cluster bên trái (col 1): node nằm sát phải ô → gần trục
         Cluster bên phải (col 2): node nằm sát trái ô → gần trục
         Chúng lệch nhau theo chiều dọc bằng margin-top */
      .htql-sindex-cluster {
        position: relative;
        z-index: 1;
        /* height set bởi JS */
      }
      /* cột trái: margin-top = 0, cột phải: lệch xuống nửa chiều cao */
      .htql-sindex-cluster[data-side="right"] {
        margin-top: 0; /* JS sẽ set offset */
      }

      /* SVG phủ toàn cluster */
      .htql-sindex-cluster-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        z-index: 1;
      }
      .htql-sindex-cluster-svg line {
        stroke: ${themeTint(theme, 0.75)};
        stroke-width: 2;
        stroke-linecap: round;
      }

      /* node mốc — absolute, JS đặt vị trí */
      .htql-sindex-cluster-node {
        position: absolute;
        z-index: 3;
        background: var(--htql-sindex-blue);
        color: #fff;
        border-radius: 12px;
        padding: 10px 14px;
        text-align: center;
        box-shadow: 0 4px 16px ${themeTint(theme, 0.35)};
        width: 130px;
        transform: translate(-50%, -50%);
      }
      .htql-sindex-cluster-node-year {
        font-size: 0.68rem;
        font-weight: 700;
        opacity: 0.82;
        letter-spacing: 0.04em;
      }
      .htql-sindex-cluster-node-hk {
        font-size: 0.9rem;
        font-weight: 800;
        line-height: 1.3;
        margin-top: 2px;
      }
      .htql-sindex-cluster-node-count {
        font-size: 0.64rem;
        font-weight: 600;
        opacity: 0.72;
        margin-top: 3px;
      }

      /* connector ngang node → trục */
      .htql-sindex-cluster-connector {
        position: absolute;
        height: 2px;
        background: ${themeTint(theme, 0.4)};
        z-index: 2;
        pointer-events: none;
      }

      /* lá học phần — absolute, JS đặt vị trí */
      .htql-sindex-leaf-card {
        position: absolute;
        z-index: 2;
        background: var(--htql-sindex-card);
        border: 1px solid var(--htql-sindex-border);
        backdrop-filter: blur(var(--htql-sindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-sindex-blur));
        border-radius: 10px;
        padding: 7px 11px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.06);
        width: 150px;
        transform: translate(-50%, -50%);
        cursor: default;
        transition: box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease;
        transform-origin: center center;
      }
      .htql-sindex-leaf-card:hover {
        box-shadow: 0 8px 20px ${themeTint(theme, 0.18)};
        border-color: ${themeTint(theme, 0.34)};
        filter: brightness(1.01);
      }
      .htql-sindex-leaf-card.htql-leaf-hover-enabled {
        cursor: pointer;
      }
      .htql-sindex-leaf-inner {
        display: block;
        width: 100%;
        height: 100%;
        transform: translate3d(var(--hover-x, 0px), var(--hover-y, 0px), 0) scale(1) rotate(var(--hover-rot, 0deg));
        transition: transform 0.18s ease, filter 0.18s ease;
        will-change: transform;
      }

      @keyframes htql-float {
        0%   { transform: translate(-50%, -50%) translate3d(0px, 0px, 0); }
        20%  { transform: translate(-50%, -50%) translate3d(calc(var(--float-x) * 0.35), calc(var(--float-y) * -0.22), 0) rotate(calc(var(--float-rot) * 0.45)); }
        40%  { transform: translate(-50%, -50%) translate3d(calc(var(--float-x) * 0.8), calc(var(--float-y) * -0.04), 0) rotate(var(--float-rot)); }
        60%  { transform: translate(-50%, -50%) translate3d(calc(var(--float-x) * 0.18), calc(var(--float-y) * 0.22), 0) rotate(calc(var(--float-rot) * 0.18)); }
        80%  { transform: translate(-50%, -50%) translate3d(calc(var(--float-x) * -0.45), calc(var(--float-y) * -0.18), 0) rotate(calc(var(--float-rot) * -0.35)); }
        100% { transform: translate(-50%, -50%) translate3d(0px, 0px, 0); }
      }
      .htql-sindex-leaf-card.htql-float {
        --float-x: 3px;
        --float-y: 4px;
        --float-rot: 1deg;
        animation: htql-float var(--float-duration, 6.4s) cubic-bezier(0.45, 0, 0.55, 1) infinite;
        will-change: transform;
      }
      .htql-sindex-leaf-code {
        font-size: 0.67rem;
        font-weight: 700;
        color: var(--htql-sindex-blue);
        background: var(--htql-sindex-pill-bg);
        padding: 1px 6px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 4px;
      }
      .htql-sindex-leaf-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--htql-sindex-ink);
        line-height: 1.35;
        word-break: break-word;
      }
      .htql-sindex-leaf-tc {
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--htql-sindex-blue);
        margin-top: 4px;
      }

      /* sindex leaf stat */
      .htql-sindex-tl-stat-label {
        font-size: 0.65rem;
        font-weight: 700;
        color: var(--htql-sindex-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 2px;
      }
      .htql-sindex-tl-stat-value {
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--htql-sindex-ink);
      }
      .htql-sindex-tl-stat-value.accent { color: var(--htql-sindex-blue); }

      .htql-sindex-note-card {
        padding: 14px 20px;
        border-radius: 16px;
        margin-top: 14px;
        grid-column: 1 / -1;
      }
      .htql-sindex-table-note {
        font-size: 0.82rem;
        font-weight: 600;
        color: #1a5c30;
      }

      /* ── S101 KHHT TOÀN KHÓA TABLE ───────────────── */
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

      /* ── S301 HỌC PHẦN PHẢI HỌC ─────────────────── */
      .htql-s301-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 18px 20px;
        border-bottom: 1px solid var(--htql-sindex-border);
        background: rgba(0,0,0,0.02);
      }
      .htql-s301-toolbar-label {
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--htql-sindex-ink);
      }
      .htql-s301-select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border: 1px solid var(--htql-sindex-border);
        border-radius: 10px;
        padding: 8px 32px 8px 12px;
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--htql-sindex-ink);
        background-color: var(--htql-sindex-chip-bg);
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='${theme.replace('#', '%23')}'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 10px center;
        cursor: pointer;
        min-width: 120px;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease, background-color 0.18s ease;
      }
      .htql-s301-select:focus {
        outline: none;
        border-color: var(--htql-sindex-blue);
        box-shadow: 0 0 0 3px var(--htql-sindex-pill-bg);
      }
      .htql-s301-select:hover:not(:disabled) {
        border-color: ${themeTint(theme, 0.45)};
        background-color: ${gc(glassHex, Math.min(opacity + 0.1, 0.85))};
      }
      .htql-s301-select:disabled {
        opacity: 0.42;
        cursor: not-allowed;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
      }
      .htql-s301-select option {
        background: #ffffff;
        color: #1e293b;
        font-weight: 600;
      }
      .htql-s301-select option:disabled,
      .htql-s301-select option[value=""] {
        color: #888888;
        font-style: italic;
      }
      .htql-s301-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 9px 18px;
        border-radius: 999px;
        border: 1px solid var(--htql-sindex-border);
        font-family: inherit;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.18s ease, transform 0.18s ease;
      }
      .htql-s301-btn svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
        flex: 0 0 auto;
      }
      .htql-s301-btn:active { transform: translateY(1px); }
      .htql-s301-btn-primary {
        background: var(--htql-sindex-blue);
        color: #fff;
        border-color: transparent;
      }
      .htql-s301-btn-primary:hover { filter: brightness(1.08); }
      .htql-s301-btn-outline {
        background: var(--htql-sindex-chip-bg);
        color: var(--htql-sindex-blue);
      }
      .htql-s301-btn-outline:hover { background: ${gc(glassHex, 0.75)}; }
      .htql-s301-table-title {
        padding: 18px 24px 0;
        font-size: 0.95rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--htql-sindex-blue);
        text-align: center;
      }
      .htql-s301-ma-hp {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--htql-sindex-blue);
        background: var(--htql-sindex-pill-bg);
        padding: 3px 8px;
        border-radius: 5px;
        white-space: nowrap;
      }
      .htql-s301-ten-hp {
        text-align: left;
        font-weight: 500;
        line-height: 1.45;
      }
      .htql-s301-tc {
        font-weight: 800;
        color: var(--htql-sindex-blue);
      }
      .htql-s301-delete-btn {
        display: inline-grid;
        place-items: center;
        width: 34px;
        height: 34px;
        border: 1px solid rgba(224, 82, 82, 0.25);
        border-radius: 10px;
        background: rgba(224, 82, 82, 0.08);
        color: #c0392b;
        cursor: pointer;
        transition: background 0.18s ease;
      }
      .htql-s301-delete-btn:hover { background: rgba(224, 82, 82, 0.16); }
      .htql-s301-delete-btn svg { width: 16px; height: 16px; fill: currentColor; }
      .htql-s301-footer,
      .htql-s301-summary { display: none !important; }
      .htql-s301-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        padding: 16px 20px;
        border-bottom: 1px solid var(--htql-sindex-border);
      }
      .htql-s101-actions-card {
        display: none;
      }
      .htql-s101-actions {
        display: flex;
        justify-content: center;
        padding: 18px 0 0;
      }
      .htql-s101-print-btn {
        min-width: 220px;
        background: var(--htql-sindex-card);
        color: var(--htql-sindex-blue);
        border: 1px solid var(--htql-sindex-border);
        box-shadow: 0 12px 30px rgba(27, 43, 92, 0.12);
        backdrop-filter: blur(var(--htql-sindex-blur));
        -webkit-backdrop-filter: blur(var(--htql-sindex-blur));
        padding: 11px 20px;
      }
      .htql-s101-print-btn:hover {
        background: ${gc(glassHex, 0.8)};
        transform: translateY(-1px);
      }
      .htql-s301-table td:first-child { color: var(--htql-sindex-muted); font-size: 0.82rem; }

      /* ── S3011 THÊM HP TỪ CTDT ───────────────────── */
      .htql-s3011-search-input {
        border: 1px solid var(--htql-sindex-border);
        border-radius: 10px;
        padding: 8px 12px;
        font-family: inherit;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--htql-sindex-ink);
        background: var(--htql-sindex-chip-bg);
        width: 120px;
        text-transform: uppercase;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
      }
      .htql-s3011-search-input:hover {
        border-color: ${themeTint(theme, 0.45)};
        background-color: ${gc(glassHex, Math.min(opacity + 0.1, 0.85))};
      }
      .htql-s3011-search-input:focus {
        outline: none;
        border-color: var(--htql-sindex-blue);
        box-shadow: 0 0 0 3px var(--htql-sindex-pill-bg);
      }
      .htql-s3011-badge-added {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(56, 89, 199, 0.12);
        color: var(--htql-sindex-blue);
        font-size: 0.78rem;
        font-weight: 700;
      }
      .htql-s3011-check {
        width: 18px;
        height: 18px;
        accent-color: var(--htql-sindex-blue);
        cursor: pointer;
      }
      .htql-s3011-footer-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 14px 20px;
        border-top: 1px solid var(--htql-sindex-border);
      }
      .htql-s3011-total {
        font-size: 0.88rem;
        font-weight: 700;
        color: var(--htql-sindex-green);
      }
      .htql-s3011-pagination {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        font-size: 0.82rem;
        font-weight: 600;
      }
      .htql-s3011-page-info {
        color: var(--htql-sindex-green);
        margin-right: 6px;
      }
      .htql-s3011-page-btn {
        min-width: 32px;
        height: 32px;
        padding: 0 8px;
        border-radius: 8px;
        border: 1px solid var(--htql-sindex-border);
        background: var(--htql-sindex-chip-bg);
        color: var(--htql-sindex-blue);
        font-family: inherit;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
      }
      .htql-s3011-page-btn:hover { background: ${gc(glassHex, 0.75)}; }
      .htql-s3011-page-btn.active {
        background: var(--htql-sindex-blue);
        color: #fff;
        border-color: transparent;
      }
      .htql-s3011-page-input {
        width: 48px;
        border: 1px solid var(--htql-sindex-border);
        border-radius: 8px;
        padding: 6px 8px;
        font-family: inherit;
        font-size: 0.82rem;
        font-weight: 600;
        text-align: center;
        color: var(--htql-sindex-ink);
        background: var(--htql-sindex-chip-bg);
        transition: border-color 0.18s ease, box-shadow 0.18s ease;
      }
      .htql-s3011-page-input:focus {
        outline: none;
        border-color: var(--htql-sindex-blue);
        box-shadow: 0 0 0 3px var(--htql-sindex-pill-bg);
      }
      .htql-s3011-bat-buoc {
        font-weight: 800;
        color: #c0392b;
      }
      .htql-s3011-btn-save:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
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

  // ─── MIND MAP LAYOUT ENGINE ──────────────────────────────────────────────

  const LEAF_W = 150;
  const LEAF_H = 72;
  const NODE_W = 130;
  const NODE_H = 68;

  function layoutCluster(cluster) {
    const svg    = cluster.querySelector('.htql-sindex-cluster-svg');
    const node   = cluster.querySelector('.htql-sindex-cluster-node');
    const conn   = cluster.querySelector('.htql-sindex-cluster-connector');
    const leaves = Array.from(cluster.querySelectorAll('.htql-sindex-leaf-card'));
    if (!svg || !node) return;

    const side = cluster.dataset.side || 'left';
    const W    = cluster.offsetWidth  || 500;
    const H    = cluster.offsetHeight || 400;

    const nx = W * 0.50;
    const ny = H * 0.5;

    node.style.left = nx + 'px';
    node.style.top  = ny + 'px';

    if (conn) {
      if (side === 'left') {
        conn.style.left  = nx + 'px';
        conn.style.width = (W - nx) + 'px';
      } else {
        conn.style.left  = '0px';
        conn.style.width = nx + 'px';
      }
      conn.style.top       = ny + 'px';
      conn.style.height    = '2px';
      conn.style.transform = 'translateY(-50%)';
    }

    if (!leaves.length) return;

    const n = leaves.length;
    const spreadRad  = Math.PI * 1.5; // 270°
    const baseAngle  = side === 'left' ? Math.PI : 0;
    const halfSpread = spreadRad / 2;

    // Bán kính đủ để 2 lá liền kề không chồng nhau theo cung
    // khoảng cách cung giữa 2 lá = R × (spreadRad / (n-1)) ≥ sqrt(LEAF_W² + LEAF_H²) + gap
    const leafDiag = Math.sqrt(LEAF_W * LEAF_W + LEAF_H * LEAF_H);
    const minRByArc = n <= 1 ? 0 : ((leafDiag + 20) * (n - 1)) / spreadRad;
    const maxR = W * 0.65 - LEAF_W / 2;
    const R    = Math.min(Math.max(minRByArc, 200), maxR);

    // Đặt lá đều theo góc — không cần né nhau vì R đã đủ lớn
    const pos = leaves.map((leaf, i) => {
      const t     = n === 1 ? 0.5 : i / (n - 1);
      const angle = baseAngle - halfSpread + spreadRad * t;
      return {
        leaf,
        lx: nx + Math.cos(angle) * R,
        ly: ny + Math.sin(angle) * R,
      };
    });

    // ShiftY để không tràn lên trên
    const minY   = Math.min(...pos.map((p) => p.ly)) - LEAF_H / 2;
    const shiftY = minY < 8 ? 8 - minY : 0;
    const finalNy = ny + shiftY;

    node.style.top = finalNy + 'px';
    if (conn) conn.style.top = finalNy + 'px';

    // Xóa SVG lines cũ
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    pos.forEach(({ leaf, lx, ly }) => {
      const finalLy = ly + shiftY;
      leaf.style.left = lx + 'px';
      leaf.style.top  = finalLy + 'px';

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', nx);    line.setAttribute('y1', finalNy);
      line.setAttribute('x2', lx);    line.setAttribute('y2', finalLy);
      svg.appendChild(line);
    });

    // Đảm bảo cluster đủ cao
    const maxY = Math.max(...pos.map((p) => p.ly + shiftY)) + LEAF_H / 2 + 16;
    if (maxY > H) cluster.style.height = maxY + 'px';
  }

  function layoutAllClusters(root) {
    const clusters = Array.from(root.querySelectorAll('.htql-sindex-cluster'));

    // Tính chiều cao cần thiết cho mỗi cluster trước
    clusters.forEach((cluster) => {
      const n  = cluster.querySelectorAll('.htql-sindex-leaf-card').length;
      const W  = cluster.offsetWidth || 500;
      const spreadRad = Math.PI * 1.5;
      const leafDiag  = Math.sqrt(LEAF_W * LEAF_W + LEAF_H * LEAF_H);
      const rByLeaves = n <= 1 ? 0 : ((leafDiag + 20) * (n - 1)) / spreadRad;
      const maxR = W * 0.65 - LEAF_W / 2;
      const R    = Math.min(Math.max(rByLeaves, 200), maxR);
      // 270° spread: chiều cao thực = R * sin(135°) * 2 + LEAF_H + padding nhỏ
      const verticalSpan = R * Math.sin(Math.PI * 0.75) * 2;
      cluster.style.height = (verticalSpan + LEAF_H + 16) + 'px';
    });

    // Offset dọc: cluster trái bắt đầu từ 0, cluster phải lệch xuống nửa chiều cao cluster trái đầu tiên
    // Nhưng vì grid 2 cột tự căn, ta dùng padding-top trên cluster phải
    // Lấy cặp (left, right) và set margin-top cho right = half height của left
    for (let i = 0; i < clusters.length; i += 2) {
      const left  = clusters[i];
      const right = clusters[i + 1];
      if (left && right) {
        const offset = parseFloat(left.style.height) / 2;
        right.style.marginTop = offset + 'px';
      }
    }

    requestAnimationFrame(() => {
      clusters.forEach(layoutCluster);
      applyLeafEffects(root);
      return;

      // Hiệu ứng lơ lửng cho từng lá — pha và tốc độ ngẫu nhiên
      root.querySelectorAll('.htql-sindex-leaf-card').forEach((leaf) => {
        const duration = (2.8 + Math.random() * 2.4).toFixed(2); // 2.8s – 5.2s
        const delay    = (Math.random() * -5).toFixed(2);          // pha ngẫu nhiên
        const swayX    = (3 + Math.random() * 5).toFixed(1);       // biên độ X: 3–8px
        const swayY    = (6 + Math.random() * 5).toFixed(1);       // biên độ Y: 6–11px
        leaf.style.setProperty('--float-x', swayX + 'px');
        leaf.style.setProperty('--float-y', swayY + 'px');
        leaf.style.animationDuration = duration + 's';
        leaf.style.animationDelay    = delay + 's';
        leaf.classList.add('htql-float');
      });
    });
  }

  // ─── CLUSTER HTML BUILDER ────────────────────────────────────────────────

  function bindLeafHover(leaf, enabled) {
    leaf.classList.toggle('htql-leaf-hover-enabled', enabled);
    if (!enabled) {
      leaf.style.removeProperty('--hover-x');
      leaf.style.removeProperty('--hover-y');
      leaf.style.removeProperty('--hover-rot');
      return;
    }

    if (leaf.dataset.hoverBound === '1') return;
    leaf.dataset.hoverBound = '1';

    const updateHoverVars = (event) => {
      const rect = leaf.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
      const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
      const hoverX = Math.max(-4.5, Math.min(4.5, dx * 5));
      const hoverY = Math.max(-3.5, Math.min(3.5, dy * 4));
      const hoverRot = Math.max(-4, Math.min(4, dx * 4));
      leaf.style.setProperty('--hover-x', `${hoverX.toFixed(2)}px`);
      leaf.style.setProperty('--hover-y', `${hoverY.toFixed(2)}px`);
      leaf.style.setProperty('--hover-rot', `${hoverRot.toFixed(2)}deg`);
    };

    leaf.addEventListener('pointerenter', updateHoverVars);
    leaf.addEventListener('pointermove', updateHoverVars);
    leaf.addEventListener('pointerleave', () => {
      leaf.style.removeProperty('--hover-x');
      leaf.style.removeProperty('--hover-y');
      leaf.style.removeProperty('--hover-rot');
    });
  }

  function applyLeafEffects(root) {
    const effects = resolveEffectSettings(currentSettings);
    const floatEnabled = effects.leafFloat !== false;
    const hoverEnabled = effects.leafHover !== false;

    root.querySelectorAll('.htql-sindex-leaf-card').forEach((leaf) => {
      if (floatEnabled) {
        const duration = (5.4 + Math.random() * 2.1).toFixed(2);
        const delay    = (Math.random() * -6).toFixed(2);
        const swayX    = (1.8 + Math.random() * 1.8).toFixed(2);
        const swayY    = (3.0 + Math.random() * 1.8).toFixed(2);
        const swayRot  = (0.55 + Math.random() * 0.75).toFixed(2);
        leaf.style.setProperty('--float-x', swayX + 'px');
        leaf.style.setProperty('--float-y', swayY + 'px');
        leaf.style.setProperty('--float-rot', swayRot + 'deg');
        leaf.style.setProperty('--float-duration', duration + 's');
        leaf.style.animationDelay = delay + 's';
        leaf.classList.add('htql-float');
      } else {
        leaf.classList.remove('htql-float');
        leaf.style.animation = 'none';
        leaf.style.removeProperty('--float-x');
        leaf.style.removeProperty('--float-y');
        leaf.style.removeProperty('--float-rot');
        leaf.style.removeProperty('--float-duration');
        leaf.style.removeProperty('animation-delay');
      }

      bindLeafHover(leaf, hoverEnabled);
    });
  }

  function buildClusterHTML(nodeHTML, leafHTMLs, side, idx) {
    const leaves = leafHTMLs.map((h) => `<div class="htql-sindex-leaf-card"><div class="htql-sindex-leaf-inner">${h}</div></div>`).join('');
    return `
      <div class="htql-sindex-cluster" data-side="${side}" data-idx="${idx}">
        <svg class="htql-sindex-cluster-svg" aria-hidden="true"></svg>
        <div class="htql-sindex-cluster-connector"></div>
        <div class="htql-sindex-cluster-node">${nodeHTML}</div>
        ${leaves}
      </div>
    `;
  }

  function openS101PrintExport() {
    const url = 'InKeHoachHocTap.php';
    const features = [
      'width=780',
      'height=580',
      'left=' + Math.max(0, Math.round((window.screen?.width || 780) / 2 - 390)),
      'top=' + Math.max(0, Math.round((window.screen?.height || 580) / 2 - 290)),
      'location=no',
      'menubar=no',
      'status=no',
      'toolbar=no',
      'scrollbars=yes',
      'resizable=no',
    ].join(', ');
    const win = window.open(url, '', features);
    if (win) {
      try { win.resizeTo(780, 580); } catch (_) {}
      try { win.moveTo(Math.max(0, Math.round((window.screen?.width || 780) / 2 - 390)), Math.max(0, Math.round((window.screen?.height || 580) / 2 - 290))); } catch (_) {}
      win.focus();
      return;
    }
    location.href = url;
  }

  function setupS101Actions(root) {
    root.querySelector('#htql-s101-print')?.addEventListener('click', (event) => {
      event.preventDefault();
      if (typeof window.printTL === 'function') {
        window.printTL();
        return;
      }
      openS101PrintExport();
    });
  }

  // ─── SEMESTER PLAN SHELL (sindex base) — bảng ───────────────────────────

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

    const clusterHTML = groups.map((group, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      const totalTC = group.rows.reduce((sum, r) => sum + (parseFloat(r.soTC) || 0), 0);
      const nodeHTML = `
        <div class="htql-sindex-cluster-node-year">${group.namHoc}</div>
        <div class="htql-sindex-cluster-node-hk">Học kỳ ${group.hocKy}</div>
        <div class="htql-sindex-cluster-node-count">${group.rows.length} HP · ${totalTC} TC</div>
      `;
      const leafHTMLs = group.rows.map((row) => `
        <div class="htql-sindex-leaf-code">${row.maHP}</div>
        <div class="htql-sindex-leaf-name">${row.tenHP}</div>
        <div class="htql-sindex-leaf-tc">${row.soTC} TC</div>
      `);
      return buildClusterHTML(nodeHTML, leafHTMLs, side, i);
    }).join('');

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
          <div class="htql-sindex-timeline">
            ${data.rows.length > 0
              ? clusterHTML
              : '<p style="text-align:center;opacity:0.6;padding:20px;">Không có dữ liệu</p>'}
          </div>
          <div class="htql-s101-actions">
            <button type="button" id="htql-s101-print" class="htql-s301-btn htql-s101-print-btn">
              ${svgIcon('print')}
              <span>In/ Xuất ra file</span>
            </button>
          </div>
        </main>
      </div>
    `;

    window.HTQL_Shared.setupHeaderActions(root, '../../hindex.php', '../../../../logout.php');
    requestAnimationFrame(() => requestAnimationFrame(() => layoutAllClusters(root)));
    setupS101Actions(root);
    return root;
  }

  // ─── S301 HỌC PHẦN PHẢI HỌC SHELL ───────────────────────────────────────

  function buildS301SummaryText(summary) {
    const parts = [];
    if (summary.count) parts.push(`Tổng số học phần: ${summary.count}`);
    if (summary.credits) parts.push(`Tổng số tín chỉ: ${summary.credits}`);
    return parts.join(' · ');
  }

  function setupS301Actions(root, forms, data) {
    const mainForm = forms.frmCacMonPhaiHocTC;
    const locForm = forms.frmDuLieuLoc;
    const xoaForm = forms.frmXoa;
    const xoaCaiThienForm = forms.frmXoaCaiThien;

    const namSel = root.querySelector('#htql-s301-namhoc');
    const hkSel = root.querySelector('#htql-s301-hocky');

    root.querySelector('#htql-s301-filter')?.addEventListener('click', () => {
      if (!locForm) return;
      if (mainForm) {
        if (mainForm.cboNamHoc) mainForm.cboNamHoc.value = namSel.value;
        if (mainForm.cboHocKy) mainForm.cboHocKy.value = hkSel.value;
      }
      if (locForm.hdNamHocLoc) locForm.hdNamHocLoc.value = namSel.value;
      if (locForm.hdHocKyLoc) locForm.hdHocKyLoc.value = hkSel.value;
      locForm.submit();
    });

    root.querySelectorAll('[data-delete-ma]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const ma = btn.dataset.deleteMa;
        const dvht = btn.dataset.deleteDvht;
        const isCaiThien = btn.dataset.caiThien === '1';
        if (!confirm('Bạn có chắc chắn xóa học phần này không?')) return;
        if (isCaiThien && xoaCaiThienForm) {
          if (xoaCaiThienForm.hdMaMHCaiThien) xoaCaiThienForm.hdMaMHCaiThien.value = ma;
          if (xoaCaiThienForm.hdDVHT) xoaCaiThienForm.hdDVHT.value = dvht;
          xoaCaiThienForm.submit();
          return;
        }
        if (xoaForm) {
          if (xoaForm.hdMaMHXoa) xoaForm.hdMaMHXoa.value = ma;
          if (xoaForm.hdDVHT) xoaForm.hdDVHT.value = dvht;
          xoaForm.submit();
        }
      });
    });

    const submitMainForm = (url) => {
      if (!mainForm || !url) return;
      mainForm.action = url;
      mainForm.submit();
    };

    root.querySelector('#htql-s301-add-ctdt')?.addEventListener('click', () => {
      submitMainForm(data.actions.themCTDT);
    });
    root.querySelector('#htql-s301-add-ngoai')?.addEventListener('click', () => {
      submitMainForm(data.actions.themNgoai);
    });
    root.querySelector('#htql-s301-add-caithien')?.addEventListener('click', () => {
      submitMainForm(data.actions.themCaiThien);
    });
  }

  function appendHiddenS301Forms(root, forms) {
    appendHiddenForms(root, forms);
  }

  function buildS3011RowHTML(row) {
    if (row.type === 'added') {
      return `
        <tr>
          <td>${row.stt}</td>
          <td><span class="htql-s301-ma-hp">${row.maHP}</span></td>
          <td class="htql-s301-ten-hp">${row.tenHP}</td>
          <td class="htql-s301-tc">${row.soTC}</td>
          <td>${row.batBuoc === 'x' ? '<span class="htql-s3011-bat-buoc">✓</span>' : '—'}</td>
          <td><span class="htql-sindex-badge-year">${row.namHoc}</span></td>
          <td>HK ${row.hocKy}</td>
          <td><span class="htql-s3011-badge-added">Đã thêm</span></td>
        </tr>
      `;
    }

    const namOpts = row.namOptions.map((opt) =>
      `<option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
    ).join('');
    const hkOpts = row.hocKyOptions.map((opt) =>
      `<option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
    ).join('');

    return `
      <tr data-s3011-idx="${row.formIndex}">
        <td>${row.stt}</td>
        <td><span class="htql-s301-ma-hp">${row.maHP}</span></td>
        <td class="htql-s301-ten-hp">${row.tenHP}</td>
        <td class="htql-s301-tc">${row.soTC}</td>
        <td>${row.batBuoc === 'x' ? '<span class="htql-s3011-bat-buoc">✓</span>' : '—'}</td>
        <td>
          <select class="htql-s301-select htql-s3011-nam" data-idx="${row.formIndex}" disabled aria-label="Năm học ${row.maHP}">${namOpts}</select>
        </td>
        <td>
          <select class="htql-s301-select htql-s3011-hk" data-idx="${row.formIndex}" disabled aria-label="Học kỳ ${row.maHP}">${hkOpts}</select>
        </td>
        <td>
          <input type="checkbox" class="htql-s3011-check" data-idx="${row.formIndex}" value="${row.value}"${row.checked ? ' checked' : ''} aria-label="Chọn ${row.maHP}">
        </td>
      </tr>
    `;
  }

  function setupS3011Actions(root, forms, data) {
    const mainForm = forms.frmKhungCTDTTinChi;
    const pageForm = forms.frmChuyenTrang;
    const searchInput = root.querySelector('#htql-s3011-search');
    const saveBtn = root.querySelector('#htql-s3011-save');

    const syncSaveDisabled = () => {
      const origBtn = mainForm && mainForm.btnThem;
      if (saveBtn && origBtn) saveBtn.disabled = origBtn.disabled;
    };

    root.querySelector('#htql-s3011-search-btn')?.addEventListener('click', () => {
      if (!mainForm) return;
      if (searchInput) mainForm.txtMaMonHoc.value = searchInput.value.toUpperCase();
      if (typeof window.lietke === 'function') window.lietke();
    });

    searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') root.querySelector('#htql-s3011-search-btn')?.click();
    });

    root.querySelectorAll('.htql-s3011-check').forEach((chk) => {
      chk.addEventListener('change', () => {
        const idx = parseInt(chk.dataset.idx, 10);
        const row = data.rows.find((r) => r.type === 'selectable' && r.formIndex === idx);
        if (!row || !row.chkEl) return;
        row.chkEl.checked = chk.checked;
        if (typeof window.batTat === 'function') window.batTat(chk.checked, idx);
        if (typeof window.selectId === 'function') window.selectId(chk.checked);
        syncSaveDisabled();

        const tr = chk.closest('tr');
        tr?.querySelectorAll('.htql-s3011-nam, .htql-s3011-hk').forEach((sel) => {
          sel.disabled = !chk.checked;
        });
      });
    });

    root.querySelectorAll('.htql-s3011-nam').forEach((sel) => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx, 10);
        const row = data.rows.find((r) => r.type === 'selectable' && r.formIndex === idx);
        if (!row || !row.namSel) return;
        row.namSel.value = sel.value;
        if (typeof window.ktNamHoc === 'function') window.ktNamHoc(idx, sel.value);
      });
    });

    root.querySelectorAll('.htql-s3011-hk').forEach((sel) => {
      sel.addEventListener('change', () => {
        const idx = parseInt(sel.dataset.idx, 10);
        const row = data.rows.find((r) => r.type === 'selectable' && r.formIndex === idx);
        if (!row || !row.hkSel) return;
        row.hkSel.value = sel.value;
        const p = row.kiemTraParams;
        if (p && typeof window.kiemTraNamHoc === 'function') {
          window.kiemTraNamHoc(p.namHocHT, p.hocKyHT, p.index, sel.value);
        }
      });
    });

    saveBtn?.addEventListener('click', () => {
      if (typeof window.kiemTra === 'function') window.kiemTra();
    });

    root.querySelector('#htql-s3011-finish')?.addEventListener('click', () => {
      if (typeof window.ketthuc === 'function') window.ketthuc();
    });

    root.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (typeof window.chuyenTrang === 'function') {
          window.chuyenTrang(page);
        } else if (pageForm) {
          if (pageForm.pID) pageForm.pID.value = page;
          if (pageForm.txtMaMonHoc && searchInput) {
            pageForm.txtMaMonHoc.value = searchInput.value.toUpperCase();
          } else if (pageForm.txtMaMonHoc && mainForm && mainForm.txtMaMonHoc) {
            pageForm.txtMaMonHoc.value = mainForm.txtMaMonHoc.value;
          }
          submitFormSafe(pageForm);
        }
      });
    });

    root.querySelector('#htql-s3011-gopage')?.addEventListener('click', () => {
      const input = root.querySelector('#htql-s3011-page-input');
      const total = data.pagination.total || 1;
      const val = parseInt(input?.value, 10);
      if (!val || val <= 0 || val > total || Number.isNaN(val)) {
        alert('Số trang không hợp lệ !');
        return;
      }
      if (typeof window.chuyenTrang === 'function') {
        window.chuyenTrang(val);
      } else if (pageForm) {
        if (pageForm.pID) pageForm.pID.value = val;
        if (pageForm.txtMaMonHoc && mainForm && mainForm.txtMaMonHoc) {
          pageForm.txtMaMonHoc.value = mainForm.txtMaMonHoc.value;
        }
        submitFormSafe(pageForm);
      }
    });

    data.rows.filter((r) => r.type === 'selectable' && r.checked).forEach((row) => {
      const tr = root.querySelector(`tr[data-s3011-idx="${row.formIndex}"]`);
      tr?.querySelectorAll('.htql-s3011-nam, .htql-s3011-hk').forEach((sel) => {
        sel.disabled = false;
      });
    });

    syncSaveDisabled();
  }

  function buildS3011Shell(data, forms) {
    const root = document.createElement('div');
    root.id = ROOT_ID;

    const tableRows = data.rows.map(buildS3011RowHTML).join('');
    const { pagination } = data;
    const pageButtons = pagination.pages.slice(0, 8).map((page) =>
      `<button type="button" class="htql-s3011-page-btn${page === pagination.current ? ' active' : ''}" data-page="${page}">${page}</button>`
    ).join('');

    root.innerHTML = `
      <div class="htql-sindex-shell">
        ${window.HTQL_Shared.buildHeaderHTML('htql-sindex-card', 'Kế hoạch học tập')}

        ${buildNavHTML(data.menuItems, 'S301')}

        <div class="htql-sindex-top-row">
          ${buildAdvisorHTML(data.advisor)}
          ${buildNoticesHTML(data.notices)}
          ${data.totalLabel ? `
          <div class="htql-sindex-card htql-sindex-summary-card">
            <div class="htql-sindex-panel-head">
              <span class="htql-sindex-panel-head-icon">${svgIcon('course')}</span>
              <span>CHƯƠNG TRÌNH ĐÀO TẠO</span>
            </div>
            <div class="htql-sindex-summary">${data.totalLabel}</div>
          </div>` : '<div></div>'}
        </div>

        <main class="htql-sindex-main" id="htql-sindex-main-content">
          <div class="htql-sindex-card htql-sindex-table-card">
            <div class="htql-s301-actions">
              <button type="button" id="htql-s3011-save" class="htql-s301-btn htql-s301-btn-primary htql-s3011-btn-save"${data.saveDisabled ? ' disabled' : ''}>Lưu</button>
              <button type="button" id="htql-s3011-finish" class="htql-s301-btn htql-s301-btn-outline">Kết thúc</button>
            </div>
            <div class="htql-s301-table-title">${data.title || 'Học phần trong chương trình đào tạo'}</div>
            <div class="htql-s301-toolbar">
              <span class="htql-s301-toolbar-label">Mã học phần</span>
              <input type="text" id="htql-s3011-search" class="htql-s3011-search-input" value="${data.searchCode}" maxlength="20" aria-label="Mã học phần">
              <button type="button" id="htql-s3011-search-btn" class="htql-s301-btn htql-s301-btn-primary">Liệt kê</button>
            </div>
            <div class="htql-sindex-table-wrapper" style="border:none;border-radius:0;border-top:1px solid var(--htql-sindex-border);">
              <table class="htql-sindex-table htql-s301-table htql-s3011-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã HP</th>
                    <th>Tên học phần</th>
                    <th>Số TC</th>
                    <th>Bắt buộc</th>
                    <th>Năm học</th>
                    <th>Học kỳ</th>
                    <th>Chọn</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows || '<tr><td colspan="8" style="text-align:center;padding:24px;opacity:0.6;">Không có học phần</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="htql-s3011-footer-bar">
              <div class="htql-s3011-total">${data.totalLabel || ''}</div>
              <div class="htql-s3011-pagination">
                ${pagination.total > 1 ? `<span class="htql-s3011-page-info">Trang ${pagination.current} / ${pagination.total}</span>` : ''}
                ${pageButtons}
                ${pagination.total > 1 ? `
                  <input type="text" id="htql-s3011-page-input" class="htql-s3011-page-input" value="${pagination.current}" aria-label="Số trang">
                  <button type="button" id="htql-s3011-gopage" class="htql-s301-btn htql-s301-btn-outline">Chuyển</button>
                ` : ''}
              </div>
            </div>
          </div>
        </main>
      </div>
    `;

    window.HTQL_Shared.setupHeaderActions(root, '../../hindex.php', '../../../../logout.php');
    appendHiddenForms(root, forms);
    installS3011Globals(forms);
    setupS3011Actions(root, forms, data);
    return root;
  }

  function buildS301Shell(data, forms) {
    const root = document.createElement('div');
    root.id = ROOT_ID;

    const namOptions = data.filters.namHocOptions.map((opt) =>
      `<option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
    ).join('');
    const hkOptions = data.filters.hocKyOptions.map((opt) =>
      `<option value="${opt.value}"${opt.selected ? ' selected' : ''}>${opt.label}</option>`
    ).join('');

    const tableRows = data.rows.map((row) => `
      <tr>
        <td>${row.stt}</td>
        <td><span class="htql-s301-ma-hp">${row.maHP}</span></td>
        <td class="htql-s301-ten-hp">${row.tenHP}</td>
        <td class="htql-s301-tc">${row.soTC}</td>
        <td><span class="htql-sindex-badge-year">${row.namHoc}</span></td>
        <td>HK ${row.hocKy}</td>
        <td>${row.caiThien || '—'}</td>
        <td>
          <button type="button" class="htql-s301-delete-btn" title="Xóa học phần"
            data-delete-ma="${row.deleteMa}" data-delete-dvht="${row.deleteDVHT}"
            data-cai-thien="${row.caiThien ? '1' : '0'}" aria-label="Xóa ${row.maHP}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7Zm3-3h6l1 1h4v2H4V5h4l1-1Z"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    const summaryText = buildS301SummaryText(data.summary);

    root.innerHTML = `
      <div class="htql-sindex-shell">
        ${window.HTQL_Shared.buildHeaderHTML('htql-sindex-card', 'Kế hoạch học tập')}

        ${buildNavHTML(data.menuItems, 'S301')}

        <div class="htql-sindex-top-row">
          ${buildAdvisorHTML(data.advisor)}
          ${buildNoticesHTML(data.notices)}
          ${summaryText ? `
          <div class="htql-sindex-card htql-sindex-summary-card">
            <div class="htql-sindex-panel-head">
              <span class="htql-sindex-panel-head-icon">${svgIcon('course')}</span>
              <span>TỔNG KẾT</span>
            </div>
            <div class="htql-sindex-summary">${summaryText}</div>
          </div>` : '<div></div>'}
        </div>

        <main class="htql-sindex-main" id="htql-sindex-main-content">
          <div class="htql-sindex-card htql-sindex-table-card">
            <div class="htql-s301-actions">
              <button type="button" id="htql-s301-add-ctdt" class="htql-s301-btn htql-s301-btn-outline">Thêm học phần từ CTDT</button>
              <button type="button" id="htql-s301-add-ngoai" class="htql-s301-btn htql-s301-btn-outline">Thêm học phần ngoài CTDT</button>
              <button type="button" id="htql-s301-add-caithien" class="htql-s301-btn htql-s301-btn-outline">Thêm học phần cải thiện điểm</button>
            </div>
            <div class="htql-s301-table-title">${data.title}</div>
            <div class="htql-s301-toolbar">
              <span class="htql-s301-toolbar-label">Năm học</span>
              <select id="htql-s301-namhoc" class="htql-s301-select" aria-label="Năm học">${namOptions}</select>
              <span class="htql-s301-toolbar-label">Học kỳ</span>
              <select id="htql-s301-hocky" class="htql-s301-select" style="min-width:72px" aria-label="Học kỳ">${hkOptions}</select>
              <button type="button" id="htql-s301-filter" class="htql-s301-btn htql-s301-btn-primary">Liệt kê</button>
            </div>
            <div class="htql-sindex-table-wrapper" style="border:none;border-radius:0;border-top:1px solid var(--htql-sindex-border);">
              <table class="htql-sindex-table htql-s301-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã HP</th>
                    <th>Tên học phần</th>
                    <th>Số TC</th>
                    <th>Năm học</th>
                    <th>Học kỳ</th>
                    <th>Cải thiện</th>
                    <th>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows || '<tr><td colspan="8" style="text-align:center;padding:24px;opacity:0.6;">Không có học phần nào</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    `;

    window.HTQL_Shared.setupHeaderActions(root, '../../hindex.php', '../../../../logout.php');
    appendHiddenS301Forms(root, forms);
    setupS301Actions(root, forms, data);
    return root;
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────

  function render(settings) {
    disableOriginalCSS();
    injectStyle(getCSS(settings));
    applyBackground(settings && settings.bgUrl ? settings.bgUrl : '');

    let root = document.getElementById(ROOT_ID);
    if (root) {
      root.remove();
    }
    if (IS_S101) {
      const data = extractS101Data();
      root = buildS101Shell(data);
    } else if (IS_S301) {
      const forms = preserveS301Forms();
      const data = extractS301Data();
      root = buildS301Shell(data, forms);
    } else if (IS_S3011) {
      const forms = preserveS3011Forms();
      const data = extractS3011Data();
      root = buildS3011Shell(data, forms);
    } else {
      const data = extractStudyPlanData();
      root = buildSindexShell(data);
    }
    document.body.appendChild(root);
    document.body.classList.add('htql-sindex-active');
  }

  function applySettings(settings) {
    currentSettings = {
      ...currentSettings,
      ...settings,
      effects: {
        ...DEFAULTS.effects,
        ...(currentSettings.effects || {}),
        ...((settings && settings.effects) || {}),
      },
    };
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

  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      chrome.storage.local.get(DEFAULTS, (settings) => {
        applySettings(settings);
      });
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
