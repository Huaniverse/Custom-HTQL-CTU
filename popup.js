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
    themeColor: "#152550",
    textColor: "#1e293b",
    headingColor: "#152550",
    fontFamily: "Plus Jakarta Sans",
    bgUrl: ""
  };

  let state = { ...DEFAULTS };
  let toastTimer = null;

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

  const currentBgThumb  = $("current-bg-thumb");
  const currentBgName   = $("current-bg-name");
  const currentBgType   = $("current-bg-type");

  const btnReset        = $("btn-reset");
  const btnClose        = $("btn-close");
  const toast           = $("toast");
  const toastText       = $("toast-text");

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

    // Background
    const bgSrc = (bg && bg !== "") ? bg : "background.png";
    if (isVideoUrl(bgSrc)) {
      previewBox.style.backgroundImage = "none";
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
    } else {
      const existing = previewBox.querySelector("video.preview-bg-video");
      if (existing) existing.remove();
      previewBox.style.backgroundImage = cssBackgroundUrl(bgSrc);
    }

    // Glass card
    previewCard.style.background = `rgba(255,255,255,${opacity})`;
    previewCard.style.backdropFilter = `blur(${blur}px)`;
    previewCard.style.webkitBackdropFilter = `blur(${blur}px)`;

    // Colors
    previewTitle.style.color = theme;
    previewBtn.style.background = theme;

    // Current bg info
    currentBgThumb.style.backgroundImage = "";
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

    // Active font options
    document.querySelectorAll("#font-select-grid .font-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.font === state.fontFamily);
    });
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
      state = { ...DEFAULTS, ...saved };
      applyStateToUI();
      updatePreview();
    });
  }

  function applyStateToUI() {
    opacitySlider.value = state.glassOpacity;
    opacityVal.textContent = parseFloat(state.glassOpacity).toFixed(2);

    blurSlider.value = state.glassBlur;
    blurVal.textContent = state.glassBlur + "px";

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
    } else {
      bgUrlInput.value = state.bgUrl || "";
    }

    // Font active state
    document.querySelectorAll("#font-select-grid .font-option").forEach(opt => {
      opt.classList.toggle("active", opt.dataset.font === state.fontFamily);
    });
  }

  // ============================================================
  // TABS (Glass / Colors / Background)
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
  // CLEAR BACKGROUND
  // ============================================================
  btnClearBg.addEventListener("click", () => {
    state.bgUrl = "";
    bgUrlInput.value = "";
    fileInput.value = "";
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
  // INIT
  // ============================================================
  loadSettings();

})();
