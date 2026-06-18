// HTQL Theme Studio - Popup Script
// Điều khiển toàn bộ giao diện tùy chỉnh và lưu settings vào chrome.storage.local

(function () {
  "use strict";

  // ============================================================
  // DEFAULTS & STATE
  // ============================================================
  const DEFAULTS = {
    glassOpacity: 0.3,
    glassBlur: 20,
    glassColor: "#ffffff",
    themeColor: "#152550",
    textColor: "#1e293b",
    headingColor: "#152550",
    fontFamily: "Plus Jakarta Sans",
    bgUrl: "",
    solidColor: "#1a1a2e",
    s101View: "graph",
    enabled: true,
    effects: {
      leafFloat: true,
      leafHover: false
    }
  };

  function isSolidUrl(url) {
    return url && url.startsWith("solid:");
  }

  function solidUrlToColor(url) {
    return url && url.startsWith("solid:") ? url.slice(6) : "#1a1a2e";
  }

  let state = { ...DEFAULTS };
  let toastTimer = null;
  const EFFECT_DEFS = [
    {
      key: "leafFloat",
      title: "Học phần lơ lửng",
      desc: "Dao động nhẹ cho các học phần trên trang KHHT toàn khóa. Có thể tắt nếu muốn giao diện tĩnh hơn."
    },
    {
      key: "leafHover",
      title: "Hover chuột",
      desc: "Tạo độ nổi, hướng theo chuột khi rê trên từng lá bị gravity."
    },
    {
      key: "future",
      title: "Hiệu ứng mở rộng",
      desc: "Khung sẵn để bổ sung thêm hiệu ứng khác mà không phải đổi lại bố cục tab.",
      comingSoon: true
    }
  ];

  // ============================================================
  // HELPERS
  // ============================================================
  function cssBackgroundUrl(url) {
    return `url("${String(url).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  }

  function isVideoUrl(url) {
    return url && (url.startsWith('data:video') || /\.(mp4|webm)(\?|$)/i.test(url));
  }

  // ============================================================
  // DOM REFS
  // ============================================================
  const $ = (id) => document.getElementById(id);

  const opacitySlider   = $("opacity-slider");
  const opacityVal      = $("opacity-val");
  const blurSlider      = $("blur-slider");
  const blurVal         = $("blur-val");
  const glassColorInput = $("glass-color-input");
  const glassColorSwatch= $("glass-color-swatch");
  const glassColorHex   = $("glass-color-hex");

  const themeColorInput = $("theme-color");
  const themeColorSwatch= $("theme-color-swatch");
  const themeColorHex   = $("theme-color-hex");
  const textColorInput  = $("text-color");
  const textColorSwatch = $("text-color-swatch");
  const textColorHex    = $("text-color-hex");
  const headingColorInput  = $("heading-color");
  const headingColorSwatch = $("heading-color-swatch");
  const headingColorHex    = $("heading-color-hex");
  const bgUrlInput      = $("bg-url-input");
  const urlApplyBtn     = $("url-apply-btn");
  const fileInput       = $("file-input");
  const uploadArea      = $("upload-area");
  const btnClearBg      = $("btn-clear-bg");

  const previewBox      = $("preview-box");
  const previewCard     = $("preview-card");
  const previewTitle    = $("preview-title");
  const previewBtn      = $("preview-btn");
  const effectsList     = $("effects-list");

  const currentBgThumb  = $("current-bg-thumb");
  const currentBgName   = $("current-bg-name");
  const currentBgType   = $("current-bg-type");

  const solidColorInput = $("solid-color-input");
  const solidColorSwatch= $("solid-color-swatch");
  const solidColorHex   = $("solid-color-hex");
  const solidApplyBtn   = $("solid-apply-btn");

  const btnReset        = $("btn-reset");
  const btnClose        = $("btn-close");
  const toast           = $("toast");
  const toastText       = $("toast-text");

  function mergeState(saved = {}) {
    return {
      ...DEFAULTS,
      ...saved,
      glassColor: saved.glassColor || DEFAULTS.glassColor,
      solidColor: saved.solidColor || DEFAULTS.solidColor,
      s101View: saved.s101View || DEFAULTS.s101View,
      enabled: saved.enabled !== false, // mặc định true
      effects: {
        ...DEFAULTS.effects,
        ...(saved.effects || {})
      }
    };
  }

  function renderEffectControls() {
    if (!effectsList) return;
    effectsList.innerHTML = EFFECT_DEFS.map((effect) => {
      const enabled = effect.comingSoon ? "disabled" : "";
      const checked = effect.comingSoon ? "" : (state.effects?.[effect.key] !== false ? "checked" : "");
      const inputDisabled = effect.comingSoon ? "disabled" : "";
      const toggleAttr = effect.comingSoon ? "" : `data-effect-toggle="${effect.key}"`;
      const pill = effect.comingSoon ? '<div class="effect-pill">Sắp bổ sung</div>' : "";
      return `
        <div class="effect-card ${enabled}" data-effect-key="${effect.key}">
          <div class="effect-card-body">
            <div class="effect-card-title">${effect.title}</div>
            <div class="effect-card-desc">${effect.desc}</div>
            ${pill}
          </div>
          <label class="switch" aria-label="${effect.title}">
            <input type="checkbox" ${toggleAttr} ${checked} ${inputDisabled}>
            <span class="switch-slider"></span>
          </label>
        </div>
      `;
    }).join("");
  }

  function syncEffectControls() {
    if (!effectsList) return;
    effectsList.querySelectorAll("[data-effect-toggle]").forEach((input) => {
      const key = input.dataset.effectToggle;
      input.checked = state.effects?.[key] !== false;
    });
  }

  // ============================================================
  // TOAST NOTIFICATION
  // ============================================================
  function showToast(msg, type = "success") {
    toastText.textContent = msg;
    toast.className = `toast ${type}`;
    // Trigger reflow
    void toast.offsetWidth;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  // ============================================================
  // LIVE PREVIEW UPDATE
  // ============================================================
  function updatePreview() {
    const opacity = state.glassOpacity;
    const blur    = state.glassBlur;
    const theme   = state.themeColor;
    const text    = state.textColor;
    const bg      = state.bgUrl;
    const gc      = state.glassColor || "#ffffff";

    // Parse glass color to rgba
    function hexToRgbArr(hex) {
      const clean = hex.replace('#', '');
      const full = clean.length === 3 ? clean.split('').map(c => c+c).join('') : clean;
      const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
      return isNaN(r) ? [255,255,255] : [r,g,b];
    }
    const [gr, gg, gb] = hexToRgbArr(gc);

    // Background
    const bgSrc = (bg && bg !== "") ? bg : "background.png";
    if (isVideoUrl(bgSrc)) {
      previewBox.style.backgroundImage = "none";
      previewBox.style.backgroundColor = "";
      let vid = previewBox.querySelector("video.preview-bg-video");
      if (!vid) {
        vid = document.createElement("video");
        vid.className = "preview-bg-video";
        vid.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;";
        vid.autoplay = true;
        vid.loop = true;
        vid.muted = true;
        vid.playsInline = true;
        previewBox.insertBefore(vid, previewBox.firstChild);
      }
      if (vid.dataset.src !== bgSrc) {
        vid.src = bgSrc;
        vid.dataset.src = bgSrc;
        vid.play().catch(() => {});
      }
    } else if (isSolidUrl(bgSrc)) {
      const existing = previewBox.querySelector("video.preview-bg-video");
      if (existing) existing.remove();
      previewBox.style.backgroundImage = "none";
      previewBox.style.backgroundColor = solidUrlToColor(bgSrc);
    } else {
      const existing = previewBox.querySelector("video.preview-bg-video");
      if (existing) existing.remove();
      previewBox.style.backgroundColor = "";
      previewBox.style.backgroundImage = cssBackgroundUrl(bgSrc);
    }

    // Glass card
    previewCard.style.background = `rgba(${gr},${gg},${gb},${opacity})`;
    previewCard.style.backdropFilter = `blur(${blur}px)`;
    previewCard.style.webkitBackdropFilter = `blur(${blur}px)`;

    // Colors
    previewTitle.style.color = theme;
    previewBtn.style.background = theme;

    // Current bg info
    currentBgThumb.style.backgroundImage = "";
    currentBgThumb.style.backgroundColor = "";
    let thumbVid = currentBgThumb.querySelector("video");

    if (bg && bg.startsWith("data:video")) {
      currentBgThumb.style.backgroundImage = "none";
      if (!thumbVid) {
        thumbVid = document.createElement("video");
        thumbVid.autoplay = true;
        thumbVid.loop = true;
        thumbVid.muted = true;
        thumbVid.playsInline = true;
        currentBgThumb.appendChild(thumbVid);
      }
      if (thumbVid.dataset.src !== bg) {
        thumbVid.src = bg;
        thumbVid.dataset.src = bg;
        thumbVid.play().catch(() => {});
      }
      currentBgName.textContent = "Video đã tải lên";
      currentBgType.textContent = "Local file";
    } else if (bg && bg.startsWith("solid:")) {
      if (thumbVid) thumbVid.remove();
      const color = solidUrlToColor(bg);
      currentBgThumb.style.backgroundColor = color;
      currentBgThumb.style.backgroundImage = "none";
      currentBgName.textContent = "Màu nền: " + color.toUpperCase();
      currentBgType.textContent = "Solid color";
    } else {
      if (thumbVid) thumbVid.remove();
      if (bg && bg.startsWith("data:image")) {
        currentBgThumb.style.backgroundImage = cssBackgroundUrl(bg);
        currentBgName.textContent = "Ảnh đã tải lên";
        currentBgType.textContent = "Local file";
      } else if (bg && bg.startsWith("http")) {
        currentBgThumb.style.backgroundImage = cssBackgroundUrl(bg);
        const short = bg.replace(/https?:\/\//, "").split("?")[0];
        currentBgName.textContent = short.length > 32 ? short.slice(0, 32) + "…" : short;
        currentBgType.textContent = "URL từ internet";
      } else {
        currentBgThumb.style.backgroundImage = cssBackgroundUrl("background.png");
        currentBgName.textContent = "CTU Campus (Mặc định)";
        currentBgType.textContent = "Preset tích hợp";
      }
    }

    // Color swatches
    themeColorSwatch.style.background = theme;
    textColorSwatch.style.background  = text;
    if (headingColorSwatch) headingColorSwatch.style.background = state.headingColor || theme;
    if (glassColorSwatch)   glassColorSwatch.style.background   = gc;

    // Active glass color preset dots
    document.querySelectorAll("[data-preset-glass-color]").forEach(dot => {
      dot.classList.toggle("active", dot.dataset.presetGlassColor === gc);
    });

    // Active preset dots
    document.querySelectorAll("#theme-presets .preset-color-dot").forEach(dot => {
      dot.classList.toggle("active", dot.dataset.color === theme);
    });
    document.querySelectorAll("#text-presets .preset-color-dot").forEach(dot => {
      dot.classList.toggle("active", dot.dataset.color === text);
    });
    document.querySelectorAll("#heading-presets .preset-color-dot").forEach(dot => {
      dot.classList.toggle("active", dot.dataset.color === (state.headingColor || theme));
    });

    // Active preset thumbs
    document.querySelectorAll(".preset-thumb").forEach(thumb => {
      const thumbBg = thumb.dataset.bg === "default" ? "" : thumb.dataset.bg;
      thumb.classList.toggle("active", thumbBg === bg);
    });

    // Active solid preset dots
    const activeSolid = isSolidUrl(bg) ? solidUrlToColor(bg) : "";
    document.querySelectorAll("#solid-preset-grid .solid-preset-dot").forEach(dot => {
      dot.classList.toggle("active", dot.dataset.solid === activeSolid);
    });
    if (solidColorInput && isSolidUrl(bg)) {
      solidColorInput.value = activeSolid;
      solidColorSwatch.style.background = activeSolid;
      solidColorHex.textContent = activeSolid.toUpperCase();
    }

    // Active font options
    document.querySelectorAll("#font-select-grid .font-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.font === state.fontFamily);
    });

    syncColorThemePresetUI();
  }

  // ============================================================
  // SAVE TO STORAGE (auto-save on any change)
  // ============================================================
  function saveSettings(showFeedback = false) {
    chrome.storage.local.set({ ...state }, () => {
      if (showFeedback) showToast("✓ Đã lưu thành công!");
    });
  }

  // ============================================================
  // LOAD SETTINGS
  // ============================================================
  function loadSettings() {
    chrome.storage.local.get(DEFAULTS, (saved) => {
      state = mergeState(saved);
      applyStateToUI();
      renderEffectControls();
      syncEffectControls();
      updatePreview();
      syncCustomFontInput();
    });
  }

  function applyStateToUI() {
    opacitySlider.value = state.glassOpacity;
    opacityVal.textContent = parseFloat(state.glassOpacity).toFixed(2);

    blurSlider.value = state.glassBlur;
    blurVal.textContent = state.glassBlur + "px";

    if (glassColorInput) {
      const gc = state.glassColor || "#ffffff";
      glassColorInput.value = gc;
      glassColorSwatch.style.background = gc;
      glassColorHex.textContent = gc.toUpperCase();
    }

    themeColorInput.value = state.themeColor;
    themeColorHex.textContent = state.themeColor.toUpperCase();

    textColorInput.value = state.textColor;
    textColorHex.textContent = state.textColor.toUpperCase();

    if (headingColorInput) {
      headingColorInput.value = state.headingColor || state.themeColor;
      headingColorHex.textContent = (state.headingColor || state.themeColor).toUpperCase();
    }

    if (state.bgUrl && state.bgUrl.startsWith("data:image")) {
      bgUrlInput.value = "[Ảnh đã tải lên từ máy tính]";
    } else if (state.bgUrl && state.bgUrl.startsWith("data:video")) {
      bgUrlInput.value = "[Video đã tải lên từ máy tính]";
    } else if (state.bgUrl && state.bgUrl.startsWith("solid:")) {
      bgUrlInput.value = "";
    } else {
      bgUrlInput.value = state.bgUrl || "";
    }

    // Sync solid color picker
    if (solidColorInput) {
      const sc = state.bgUrl && state.bgUrl.startsWith("solid:")
        ? solidUrlToColor(state.bgUrl)
        : (state.solidColor || "#1a1a2e");
      solidColorInput.value = sc;
      solidColorSwatch.style.background = sc;
      solidColorHex.textContent = sc.toUpperCase();
    }

    // Font active state
    document.querySelectorAll("#font-select-grid .font-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.font === state.fontFamily);
    });

    syncEffectControls();

    // S101 view mode
    const s101View = state.s101View || "graph";
    document.querySelectorAll(".s101-view-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.view === s101View);
    });

    // Power toggle
    syncPowerUI(state.enabled !== false);
  }

  // ============================================================
  // TABS (Glass / Colors / Font / Effects / Background)
  // ============================================================
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`panel-${tabId}`).classList.add("active");
    });
  });

  // ============================================================
  // BACKGROUND METHOD TABS (Upload / URL / Presets)
  // ============================================================
  document.querySelectorAll(".bg-method-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const method = btn.dataset.method;
      document.querySelectorAll(".bg-method-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".bg-method-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`method-panel-${method}`).classList.add("active");
    });
  });

  // ============================================================
  // GLASS CONTROLS
  // ============================================================
  opacitySlider.addEventListener("input", () => {
    const val = parseFloat(opacitySlider.value);
    state.glassOpacity = val;
    opacityVal.textContent = val.toFixed(2);
    updatePreview();
    saveSettings();
  });

  blurSlider.addEventListener("input", () => {
    const val = parseInt(blurSlider.value, 10);
    state.glassBlur = val;
    blurVal.textContent = val + "px";
    updatePreview();
    saveSettings();
  });

  // Glass color tint
  if (glassColorInput) {
    glassColorInput.addEventListener("input", () => {
      const val = glassColorInput.value;
      state.glassColor = val;
      glassColorSwatch.style.background = val;
      glassColorHex.textContent = val.toUpperCase();
      updatePreview();
      saveSettings();
    });
  }

  document.querySelectorAll("[data-preset-glass-color]").forEach(dot => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.presetGlassColor;
      state.glassColor = color;
      if (glassColorInput) {
        glassColorInput.value = color;
        glassColorSwatch.style.background = color;
        glassColorHex.textContent = color.toUpperCase();
      }
      document.querySelectorAll("[data-preset-glass-color]").forEach(d => {
        d.classList.toggle("active", d.dataset.presetGlassColor === color);
      });
      updatePreview();
      saveSettings();
    });
  });

  // Glass preset buttons
  document.querySelectorAll("[data-preset-glass]").forEach(btn => {
    btn.addEventListener("click", () => {
      const [opacity, blur] = btn.dataset.presetGlass.split(",");
      state.glassOpacity = parseFloat(opacity);
      state.glassBlur = parseInt(blur, 10);
      opacitySlider.value = state.glassOpacity;
      opacityVal.textContent = state.glassOpacity.toFixed(2);
      blurSlider.value = state.glassBlur;
      blurVal.textContent = state.glassBlur + "px";
      updatePreview();
      saveSettings();
      showToast("Đã áp dụng preset glass!");
    });
  });

  // ============================================================
  // COLOR CONTROLS
  // ============================================================
  themeColorInput.addEventListener("input", () => {
    const val = themeColorInput.value;
    state.themeColor = val;
    themeColorHex.textContent = val.toUpperCase();
    themeColorSwatch.style.background = val;
    updatePreview();
    saveSettings();
  });

  textColorInput.addEventListener("input", () => {
    const val = textColorInput.value;
    state.textColor = val;
    textColorHex.textContent = val.toUpperCase();
    textColorSwatch.style.background = val;
    updatePreview();
    saveSettings();
  });

  // Heading color
  if (headingColorInput) {
    headingColorInput.addEventListener("input", () => {
      const val = headingColorInput.value;
      state.headingColor = val;
      headingColorHex.textContent = val.toUpperCase();
      headingColorSwatch.style.background = val;
      saveSettings();
    });
  }

  // Theme color presets
  document.querySelectorAll("#theme-presets .preset-color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.color;
      state.themeColor = color;
      themeColorInput.value = color;
      themeColorHex.textContent = color.toUpperCase();
      themeColorSwatch.style.background = color;
      updatePreview();
      saveSettings();
    });
  });

  // Text color presets
  document.querySelectorAll("#text-presets .preset-color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.color;
      state.textColor = color;
      textColorInput.value = color;
      textColorHex.textContent = color.toUpperCase();
      textColorSwatch.style.background = color;
      updatePreview();
      saveSettings();
    });
  });

  // Heading color presets
  document.querySelectorAll("#heading-presets .preset-color-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.color;
      state.headingColor = color;
      if (headingColorInput) {
        headingColorInput.value = color;
        headingColorHex.textContent = color.toUpperCase();
        headingColorSwatch.style.background = color;
      }
      saveSettings();
      // Sync active state
      document.querySelectorAll("#heading-presets .preset-color-dot").forEach(d => {
        d.classList.toggle("active", d.dataset.color === color);
      });
    });
  });

  // ============================================================
  // COLOR THEME PRESETS (bộ theme tổng hợp)
  // ============================================================
  function syncColorThemePresetUI() {
    document.querySelectorAll("[data-theme-preset]").forEach(card => {
      const match =
        card.dataset.theme === state.themeColor &&
        card.dataset.text === state.textColor &&
        card.dataset.heading === state.headingColor;
      card.classList.toggle("active", match);
    });
  }

  document.querySelectorAll("[data-theme-preset]").forEach(card => {
    card.addEventListener("click", () => {
      const theme   = card.dataset.theme;
      const text    = card.dataset.text;
      const heading = card.dataset.heading;

      state.themeColor   = theme;
      state.textColor    = text;
      state.headingColor = heading;

      // Sync UI controls
      themeColorInput.value = theme;
      themeColorHex.textContent = theme.toUpperCase();
      themeColorSwatch.style.background = theme;

      textColorInput.value = text;
      textColorHex.textContent = text.toUpperCase();
      textColorSwatch.style.background = text;

      if (headingColorInput) {
        headingColorInput.value = heading;
        headingColorHex.textContent = heading.toUpperCase();
        headingColorSwatch.style.background = heading;
      }

      syncColorThemePresetUI();
      updatePreview();
      saveSettings();
      showToast("✓ Theme: " + (card.title || card.dataset.themePreset));
    });
  });

  // Font family
  document.querySelectorAll("#font-select-grid .font-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const font = opt.dataset.font;
      state.fontFamily = font;
      document.querySelectorAll("#font-select-grid .font-option").forEach(o => {
        o.classList.toggle("active", o.dataset.font === font);
      });
      saveSettings();
      showToast("Font: " + font);
    });
  });

  // ============================================================
  // CUSTOM FONT (nhập tên hoặc link Google Fonts)
  // ============================================================
  const customFontInput   = $("custom-font-input");
  const customFontApply   = $("custom-font-apply");
  const customFontPreview = $("custom-font-preview");
  const customFontPreviewText = $("custom-font-preview-text");

  /**
   * Từ link Google Fonts hoặc tên font thuần, trả về tên font
   * Ví dụ: "https://fonts.google.com/specimen/Playfair+Display" → "Playfair Display"
   * Ví dụ: "Playfair Display" → "Playfair Display"
   */
  function parseFontName(raw) {
    raw = raw.trim();
    // Link dạng fonts.google.com/specimen/Font+Name
    const specimenMatch = raw.match(/fonts\.google\.com\/specimen\/([^?&#/]+)/i);
    if (specimenMatch) {
      return decodeURIComponent(specimenMatch[1]).replace(/\+/g, ' ');
    }
    // Link dạng fonts.googleapis.com/css?family=Font+Name
    const apiMatch = raw.match(/family=([^:&|,]+)/i);
    if (apiMatch) {
      return decodeURIComponent(apiMatch[1]).replace(/\+/g, ' ').split(':')[0].trim();
    }
    // Tên font thuần
    if (raw && !raw.startsWith('http')) return raw;
    return null;
  }

  /**
   * Tải font từ Google Fonts bằng cách inject @import vào popup
   * rồi hiển thị preview
   */
  function applyCustomFont(fontName) {
    if (!fontName) return;

    // Inject @import để preview trong popup
    let previewStyle = document.getElementById('htql-custom-font-preview-style');
    if (!previewStyle) {
      previewStyle = document.createElement('style');
      previewStyle.id = 'htql-custom-font-preview-style';
      document.head.appendChild(previewStyle);
    }
    const encoded = fontName.replace(/ /g, '+');
    previewStyle.textContent = `@import url('https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap');`;

    // Hiển thị preview
    if (customFontPreview) {
      customFontPreview.style.display = 'block';
    }
    if (customFontPreviewText) {
      customFontPreviewText.style.fontFamily = `'${fontName}', sans-serif`;
      customFontPreviewText.textContent = fontName + ' — Aa Bb Cc 123';
    }

    // Áp dụng vào state
    state.fontFamily = fontName;
    // Bỏ active tất cả font preset
    document.querySelectorAll("#font-select-grid .font-option").forEach(o => {
      o.classList.remove("active");
    });
    saveSettings();
    showToast("✓ Font: " + fontName);
  }

  if (customFontApply) {
    customFontApply.addEventListener("click", () => {
      const raw = customFontInput ? customFontInput.value.trim() : '';
      if (!raw) { showToast("Vui lòng nhập tên hoặc link font!", "error"); return; }
      const fontName = parseFontName(raw);
      if (!fontName) { showToast("Không nhận ra tên font!", "error"); return; }
      applyCustomFont(fontName);
    });
  }

  if (customFontInput) {
    customFontInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") customFontApply && customFontApply.click();
    });
  }

  // Khi load: nếu font hiện tại không có trong danh sách preset thì hiện vào input
  function syncCustomFontInput() {
    if (!customFontInput) return;
    const presetFonts = Array.from(document.querySelectorAll("#font-select-grid .font-option"))
      .map(o => o.dataset.font);
    if (state.fontFamily && !presetFonts.includes(state.fontFamily)) {
      customFontInput.value = state.fontFamily;
      if (customFontPreview) customFontPreview.style.display = 'block';
      if (customFontPreviewText) {
        customFontPreviewText.style.fontFamily = `'${state.fontFamily}', sans-serif`;
        customFontPreviewText.textContent = state.fontFamily + ' — Aa Bb Cc 123';
      }
    }
  }

  if (effectsList) {
    effectsList.addEventListener("change", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      const key = target.dataset.effectToggle;
      if (!key) return;
      state.effects = {
        ...(state.effects || DEFAULTS.effects),
        [key]: target.checked
      };
      saveSettings();
    });
  }

  // S101 View Mode toggle
  document.querySelectorAll(".s101-view-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      state.s101View = view;
      document.querySelectorAll(".s101-view-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.view === view);
      });
      saveSettings();
      showToast("S101: " + (view === "graph" ? "Dạng đồ thị" : "Dạng bảng"));
    });
  });

  // ============================================================
  // BACKGROUND - FILE UPLOAD
  // ============================================================
  const MAX_IMAGE_SIZE = 4.5 * 1024 * 1024;   // 4.5 MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024;     // 50 MB

  function handleFile(file) {
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      showToast("Chỉ hỗ trợ ảnh hoặc video!", "error");
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    const label   = isVideo ? "Video" : "Ảnh";
    const maxLabel= isVideo ? "50MB" : "4.5MB";

    if (file.size > maxSize) {
      showToast(`${label} quá lớn! Cần nhỏ hơn ${maxLabel}`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      state.bgUrl = ev.target.result;
      bgUrlInput.value = isVideo ? "[Video đã tải lên từ máy tính]" : "[Ảnh đã tải lên từ máy tính]";
      updatePreview();
      saveSettings();
      showToast(`Đã tải ${label.toLowerCase()} lên thành công!`);
    };
    reader.onerror = () => showToast(`Không thể đọc file ${label.toLowerCase()}!`, "error");
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  // Drag & Drop
  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    handleFile(file);
  });

  // ============================================================
  // BACKGROUND - URL
  // ============================================================
  urlApplyBtn.addEventListener("click", () => {
    const url = bgUrlInput.value.trim();
    if (!url) {
      showToast("Vui lòng nhập URL ảnh!", "error");
      return;
    }
    if (!url.startsWith("http")) {
      showToast("URL không hợp lệ!", "error");
      return;
    }
    state.bgUrl = url;
    updatePreview();
    saveSettings();
    showToast("Đã áp dụng ảnh từ URL!");
  });

  bgUrlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") urlApplyBtn.click();
  });

  // ============================================================
  // BACKGROUND - PRESETS
  // ============================================================
  document.querySelectorAll(".preset-thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const bg = thumb.dataset.bg;
      state.bgUrl = bg === "default" ? "" : bg;
      bgUrlInput.value = state.bgUrl;
      updatePreview();
      saveSettings();
      showToast("Đã đổi ảnh nền: " + thumb.dataset.name + "!");
    });
  });

  // ============================================================
  // SOLID COLOR BACKGROUND
  // ============================================================
  if (solidColorInput) {
    solidColorInput.addEventListener("input", () => {
      const val = solidColorInput.value;
      state.solidColor = val;
      solidColorSwatch.style.background = val;
      solidColorHex.textContent = val.toUpperCase();
      // Sync active dots
      document.querySelectorAll("#solid-preset-grid .solid-preset-dot").forEach(d => {
        d.classList.toggle("active", d.dataset.solid === val);
      });
    });
  }

  if (solidApplyBtn) {
    solidApplyBtn.addEventListener("click", () => {
      const color = solidColorInput ? solidColorInput.value : "#1a1a2e";
      state.solidColor = color;
      state.bgUrl = "solid:" + color;
      bgUrlInput.value = "";
      updatePreview();
      saveSettings();
      showToast("Đã áp dụng màu nền: " + color.toUpperCase() + "!");
    });
  }

  document.querySelectorAll("#solid-preset-grid .solid-preset-dot").forEach(dot => {
    dot.addEventListener("click", () => {
      const color = dot.dataset.solid;
      state.solidColor = color;
      state.bgUrl = "solid:" + color;
      if (solidColorInput) {
        solidColorInput.value = color;
        solidColorSwatch.style.background = color;
        solidColorHex.textContent = color.toUpperCase();
      }
      bgUrlInput.value = "";
      document.querySelectorAll("#solid-preset-grid .solid-preset-dot").forEach(d => {
        d.classList.toggle("active", d.dataset.solid === color);
      });
      updatePreview();
      saveSettings();
      showToast("Màu nền: " + color.toUpperCase() + "!");
    });
  });

  // ============================================================
  // CLEAR BACKGROUND
  // ============================================================
  btnClearBg.addEventListener("click", () => {
    state.bgUrl = "";
    bgUrlInput.value = "";
    fileInput.value = "";
    if (solidColorInput) {
      solidColorInput.value = state.solidColor || "#1a1a2e";
      solidColorSwatch.style.background = state.solidColor || "#1a1a2e";
      solidColorHex.textContent = (state.solidColor || "#1a1a2e").toUpperCase();
    }
    updatePreview();
    saveSettings();
    showToast("Đã đặt lại ảnh nền mặc định!");
  });

  // ============================================================
  // RESET ALL
  // ============================================================
  btnReset.addEventListener("click", () => {
    if (!confirm("Khôi phục tất cả về mặc định?")) return;
    state = { ...DEFAULTS };
    chrome.storage.local.set(state, () => {
      applyStateToUI();
      updatePreview();
      showToast("Đã khôi phục mặc định!");
    });
  });

  // ============================================================
  // CLOSE
  // ============================================================
  btnClose.addEventListener("click", () => window.close());

  // ============================================================
  // POWER TOGGLE (bật/tắt toàn bộ extension)
  // ============================================================
  const powerSwitch   = $("power-switch");
  const powerWrap     = $("power-toggle-wrap");
  const powerStatus   = $("power-status");
  const powerIcon     = $("power-icon");

  function syncPowerUI(enabled) {
    if (enabled) {
      powerWrap.classList.add("on");
      powerStatus.textContent = "Đang bật";
      powerIcon.style.color = "var(--popup-accent)";
    } else {
      powerWrap.classList.remove("on");
      powerStatus.textContent = "Đã tắt";
      powerIcon.style.color = "rgba(239,68,68,0.7)";
    }
    if (powerSwitch) powerSwitch.checked = enabled;
  }

  if (powerSwitch) {
    powerSwitch.addEventListener("change", () => {
      state.enabled = powerSwitch.checked;
      syncPowerUI(state.enabled);
      chrome.storage.local.set({ enabled: state.enabled }, () => {
        showToast(state.enabled ? "✓ Giao diện đã bật" : "Giao diện đã tắt");
        // Reload tất cả tab đang mở khớp với các URL được inject
        if (chrome.tabs) {
          chrome.tabs.query({}, (tabs) => {
            const patterns = [
              /dkmh\.ctu\.edu\.vn\/htql\/sinhvien/,
              /htql\.ctu\.edu\.vn/,
              /accounts\.ctu\.edu\.vn/
            ];
            tabs.forEach((tab) => {
              if (tab.url && patterns.some((p) => p.test(tab.url))) {
                chrome.tabs.reload(tab.id);
              }
            });
          });
        }
      });
    });
  }

  // ============================================================
  // INIT
  // ============================================================
  loadSettings();

})();
