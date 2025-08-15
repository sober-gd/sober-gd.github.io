/**
 * 音阶跟唱练习 - 逻辑
 * 进度条：使用 duration 缓存 + 拖动时不覆盖 + 可视化进度条
 */
(function () {
  const BASE = "../../src/sound/音阶/";
  const scales = [
    { name: "C", up: "C调上行.MP3", down: "C调下行.MP3" },
    { name: "C#", up: "C#调上行.MP3", down: "C#调下行.MP3" },
    { name: "D", up: "D调上行.MP3", down: "D调下行.MP3" },
    { name: "D#", up: "D#调上行.MP3", down: "D#调下行.MP3" },
    { name: "E", up: "E调上行.MP3", down: "E调下行.MP3" },
    { name: "F", up: "F调.MP3", down: "F下行.MP3" },
    { name: "F#", up: "F#调上行.MP3", down: "F#调下行.MP3" },
    { name: "G", up: "G调上行.MP3", down: "G调下行.MP3" },
    { name: "G#", up: "G#调上行.MP3", down: "G#调下行.MP3" },
    { name: "A", up: "A调上行.MP3", down: "A调下行.MP3" },
    { name: "A#", up: "A#调上行.MP3", down: "A#调下行.MP3" },
    { name: "B", up: "B调上行.MP3", down: "B调下行.MP3" }
  ];

  let currentAudio = null;
  let currentBtn = null;
  let currentRow = null;
  let currentRange = null;
  let currentProgressWrap = null;
  /** 用户正在拖动进度条时不再用 timeupdate 覆盖 */
  let rangeDragging = false;

  function stopCurrent() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    if (currentRange) {
      currentRange.value = 0;
      currentRange = null;
    }
    if (currentProgressWrap) {
      currentProgressWrap.style.setProperty("--progress", "0%");
      currentProgressWrap = null;
    }
    if (currentBtn) {
      currentBtn.classList.remove("playing");
      var label = currentBtn.dataset.dir === "down" ? "下行" : "上行";
      currentBtn.innerHTML = '<span class="icon">▶</span>' + label;
      currentBtn = null;
    }
    if (currentRow) {
      currentRow.classList.remove("playing");
      currentRow = null;
    }
    rangeDragging = false;
  }

  function setProgress(percent, rangeEl, progressWrap) {
    var p = Math.max(0, Math.min(100, percent));
    if (rangeEl) rangeEl.value = p;
    if (progressWrap) progressWrap.style.setProperty("--progress", p + "%");
  }

  function render() {
    var list = document.getElementById("list");
    if (!list) return;
    list.innerHTML = "";

    scales.forEach(function (s, rowIndex) {
      var row = document.createElement("div");
      row.className = "scale-row";
      row.setAttribute("data-row", rowIndex);

      var nameSpan = document.createElement("span");
      nameSpan.className = "scale-name";
      nameSpan.textContent = s.name + "调";
      row.appendChild(nameSpan);

      ["up", "down"].forEach(function (dir) {
        var label = dir === "up" ? "上行" : "下行";
        var src = BASE + (dir === "up" ? s.up : s.down);
        var cell = document.createElement("div");
        cell.className = "cell";

        var btn = document.createElement("button");
        btn.className = "btn";
        btn.setAttribute("type", "button");
        btn.setAttribute("data-dir", dir);
        btn.setAttribute("data-src", src);
        btn.setAttribute("data-row", rowIndex);
        btn.innerHTML = '<span class="icon">▶</span>' + label;

        var progressWrap = document.createElement("div");
        progressWrap.className = "progress-wrap";
        progressWrap.style.setProperty("--progress", "0%");

        var progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        progressWrap.appendChild(progressBar);

        var range = document.createElement("input");
        range.type = "range";
        range.className = "progress-range";
        range.min = 0;
        range.max = 100;
        range.value = 0;
        progressWrap.appendChild(range);

        cell.appendChild(btn);
        cell.appendChild(progressWrap);
        row.appendChild(cell);

        var audio = new Audio();
        audio.src = src;
        /** 缓存时长，避免 duration 未就绪时进度错误 */
        var duration = NaN;

        function updateProgressFromTime() {
          if (rangeDragging) return;
          var d = duration;
          if (isFinite(d) && d > 0) {
            var p = (audio.currentTime / d) * 100;
            setProgress(p, range, progressWrap);
          }
        }

        audio.addEventListener("loadedmetadata", function () {
          duration = audio.duration;
          if (isFinite(duration) && !rangeDragging) updateProgressFromTime();
        });
        audio.addEventListener("durationchange", function () {
          if (isFinite(audio.duration)) duration = audio.duration;
        });
        audio.addEventListener("timeupdate", updateProgressFromTime);
        audio.addEventListener("ended", function () {
          duration = NaN;
          setProgress(0, range, progressWrap);
          btn.classList.remove("playing");
          btn.innerHTML = '<span class="icon">▶</span>' + label;
          row.classList.remove("playing");
          if (currentAudio === audio) {
            currentAudio = null;
            currentBtn = null;
            currentRow = null;
            currentRange = null;
            currentProgressWrap = null;
          }
        });

        range.addEventListener("mousedown", function () {
          rangeDragging = true;
        });
        range.addEventListener("mouseup", function () {
          rangeDragging = false;
        });
        range.addEventListener("pointerdown", function () {
          rangeDragging = true;
        });
        range.addEventListener("pointerup", function () {
          rangeDragging = false;
        });
        range.addEventListener("input", function () {
          if (audio !== currentAudio) return;
          var p = (range.value - range.min) / (range.max - range.min);
          var d = isFinite(duration) ? duration : audio.duration;
          if (isFinite(d) && d > 0) {
            audio.currentTime = p * d;
            progressWrap.style.setProperty("--progress", p * 100 + "%");
          }
        });

        btn.addEventListener("click", function () {
          if (currentAudio === audio) {
            if (audio.paused) {
              audio.play();
              btn.classList.add("playing");
              btn.innerHTML = '<span class="icon">⏸</span>' + label;
              row.classList.add("playing");
              currentBtn = btn;
              currentRow = row;
              currentRange = range;
              currentProgressWrap = progressWrap;
            } else {
              audio.pause();
              btn.classList.remove("playing");
              btn.innerHTML = '<span class="icon">▶</span>' + label;
              row.classList.remove("playing");
              currentBtn = null;
              currentRow = null;
              currentRange = null;
              currentProgressWrap = null;
            }
            return;
          }
          stopCurrent();
          currentAudio = audio;
          currentBtn = btn;
          currentRow = row;
          currentRange = range;
          currentProgressWrap = progressWrap;
          row.classList.add("playing");
          btn.classList.add("playing");
          btn.innerHTML = '<span class="icon">⏸</span>' + label;
          audio.play();
        });
      });

      list.appendChild(row);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
