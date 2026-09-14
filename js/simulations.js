/**
 * MathClay Junior - 중학교 8대 수학 시뮬레이션 고품질 인터랙티브 엔진
 */

const SimulationEngine = {
  currentSim: null,
  animId: null,

  setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  },

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.currentSim = null;
    if (this.cleanupHandlers) {
      this.cleanupHandlers();
      this.cleanupHandlers = null;
    }
  },

  /* =========================================================================
   * 1. [중2 기하] 피타고라스 정리: 물 채우기 & 직각삼각형 넓이 보존
   * ========================================================================= */
  mountPythagoras(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "pythagoras";

    let a = 3;
    let b = 4;
    let liquidProgress = 0; // 0 ~ 1
    let isPouring = false;
    let particles = [];

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-18">밑변 a = <strong id="valA" class="text-indigo-600 font-mono">3</strong></span>
            <input type="range" id="sliderA" min="2" max="5" value="3" step="1" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-18">높이 b = <strong id="valB" class="text-emerald-600 font-mono">4</strong></span>
            <input type="range" id="sliderB" min="2" max="5" value="4" step="1" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <button id="btnPour" class="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
            <i data-lucide="droplets" class="w-4 h-4 text-cyan-200"></i> 물 채우기 액체 시뮬레이션
          </button>
          <button id="btnResetPyth" class="clay-btn clay-btn-secondary px-3.5 py-2 text-xs font-bold text-slate-600 flex items-center gap-1">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> 초기화
          </button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    // 액체 파티클 초기화
    function spawnParticles(originA, originB, targetC) {
      particles = [];
      for (let i = 0; i < 45; i++) {
        const isFromA = i % 2 === 0;
        const start = isFromA ? originA : originB;
        particles.push({
          x: start.x + (Math.random() - 0.5) * 30,
          y: start.y + (Math.random() - 0.5) * 30,
          targetX: targetC.x + (Math.random() - 0.5) * 40,
          targetY: targetC.y + (Math.random() - 0.5) * 40,
          color: isFromA ? "#60a5fa" : "#34d399",
          speed: 0.02 + Math.random() * 0.03,
          progress: Math.random() * 0.3,
          size: 3 + Math.random() * 3
        });
      }
    }

    const draw = () => {
      if (SimulationEngine.currentSim !== "pythagoras") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const c = Math.sqrt(a * a + b * b);
      const scale = Math.min(width, height) / 14;

      // 직각 꼭짓점 배치
      const originX = width * 0.42;
      const originY = height * 0.68;

      const pxA = a * scale;
      const pxB = b * scale;
      const pxC = c * scale;

      const p0 = { x: originX, y: originY }; // 직각 C
      const p1 = { x: originX + pxA, y: originY }; // A (밑변 끝)
      const p2 = { x: originX, y: originY - pxB }; // B (높이 끝)

      // 1. 밑변 정사각형 a^2 (아래쪽 바깥으로 전개)
      const aFill = Math.max(0, 1 - liquidProgress);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.2 + 0.65 * aFill})`;
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2.5;
      ctx.fillRect(p0.x, p0.y + pxA * (1 - aFill), pxA, pxA * aFill);
      ctx.strokeRect(p0.x, p0.y, pxA, pxA);

      ctx.fillStyle = "#3730a3";
      ctx.font = "bold 13px Pretendard";
      ctx.fillText(`a² = ${a * a}`, p0.x + pxA / 2 - 18, p0.y + pxA / 2 + 5);

      // 2. 높이 정사각형 b^2 (왼쪽 바깥으로 전개)
      const bFill = Math.max(0, 1 - liquidProgress);
      ctx.fillStyle = `rgba(16, 185, 129, ${0.2 + 0.65 * bFill})`;
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2.5;
      ctx.fillRect(p0.x - pxB, p2.y + pxB * (1 - bFill), pxB, pxB * bFill);
      ctx.strokeRect(p0.x - pxB, p2.y, pxB, pxB);

      ctx.fillStyle = "#065f46";
      ctx.fillText(`b² = ${b * b}`, p0.x - pxB / 2 - 18, p2.y + pxB / 2 + 5);

      // 3. 빗변 정사각형 c^2 (삼각형 밖인 우상단 방향으로 정확히 전개)
      // 벡터 p1 -> p2: (p2.x - p1.x, p2.y - p1.y) = (-pxA, -pxB)
      // 빗변 바깥 수직 벡터: (pxB, -pxA)
      const hypAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(hypAngle);

      // 빗변 바깥쪽(음의 local y축 방향)으로 정사각형 렌더링
      const cFill = liquidProgress;
      ctx.fillStyle = `rgba(244, 63, 94, ${0.15 + 0.7 * cFill})`;
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2.5;

      // 물 채우기 바닥부터 상승 애니메이션
      if (cFill > 0) {
        ctx.fillRect(0, -pxC, pxC, pxC * cFill);
      }
      ctx.strokeRect(0, -pxC, pxC, pxC);

      ctx.fillStyle = "#9f1239";
      ctx.font = "bold 14px Pretendard";
      ctx.fillText(`c² = ${(c * c).toFixed(0)}`, pxC / 2 - 18, -pxC / 2 + 5);
      ctx.restore();

      // 4. 중심 직각삼각형 본체
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 직각 기호
      const mark = 14;
      ctx.beginPath();
      ctx.moveTo(p0.x + mark, p0.y);
      ctx.lineTo(p0.x + mark, p0.y - mark);
      ctx.lineTo(p0.x, p0.y - mark);
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 변 길이 안내 텍스트
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px Pretendard";
      ctx.fillText(`a = ${a}`, (p0.x + p1.x) / 2 - 10, p0.y - 8);
      ctx.fillText(`b = ${b}`, p0.x + 8, (p0.y + p2.y) / 2 + 4);
      ctx.fillText(`c = ${c.toFixed(1)}`, (p1.x + p2.x) / 2 + 12, (p1.y + p2.y) / 2);

      // 물 쏟아지는 파티클 애니메이션
      if (isPouring && particles.length > 0) {
        particles.forEach((pt) => {
          pt.progress += pt.speed;
          if (pt.progress > 1) pt.progress = 0;

          // 베지에 곡선으로 액체 줄기 형성
          const curX = pt.x + (pt.targetX - pt.x) * pt.progress;
          const curY = pt.y + (pt.targetY - pt.y) * pt.progress - Math.sin(pt.progress * Math.PI) * 40;

          ctx.beginPath();
          ctx.arc(curX, curY, pt.size, 0, Math.PI * 2);
          ctx.fillStyle = pt.color;
          ctx.fill();
        });
      }

      // 정보 박스
      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>두 변의 정사각형 합: <strong class="text-indigo-600">${a * a}</strong> + <strong class="text-emerald-600">${b * b}</strong> = <strong class="text-rose-600 font-black">${a * a + b * b}</strong></span>
            <span>빗변 정사각형 c²: <strong class="text-rose-600 font-black">${(c * c).toFixed(0)}</strong> (c ≈ ${c.toFixed(2)})</span>
          </div>
        `;
      }

      if (isPouring) {
        liquidProgress += 0.012;
        if (liquidProgress >= 1) {
          liquidProgress = 1;
          isPouring = false;
        }
      }

      SimulationEngine.animId = requestAnimationFrame(draw);
    };

    draw();

    document.getElementById("sliderA").addEventListener("input", (e) => {
      a = parseInt(e.target.value);
      document.getElementById("valA").textContent = a;
      liquidProgress = 0;
    });

    document.getElementById("sliderB").addEventListener("input", (e) => {
      b = parseInt(e.target.value);
      document.getElementById("valB").textContent = b;
      liquidProgress = 0;
    });

    document.getElementById("btnPour").addEventListener("click", () => {
      liquidProgress = 0;
      isPouring = true;
      const originX = canvas.getBoundingClientRect().width * 0.42;
      const originY = canvas.getBoundingClientRect().height * 0.68;
      const scale = Math.min(canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height) / 14;
      spawnParticles(
        { x: originX + (a * scale) / 2, y: originY + (a * scale) / 2 },
        { x: originX - (b * scale) / 2, y: originY - (b * scale) / 2 },
        { x: originX + (a * scale) / 2, y: originY - (b * scale) / 2 - 30 }
      );
    });

    document.getElementById("btnResetPyth").addEventListener("click", () => {
      liquidProgress = 0;
      isPouring = false;
      particles = [];
    });
  },

  /* =========================================================================
   * 2. [중2 함수] 일차함수 y = ax + b 탐구기 (좌표 눈금 & 절편/기울기)
   * ========================================================================= */
  mountLinear(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "linear";

    let a = 1.0;
    let b = 1.0;
    let testX = 2.0;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>기울기 a: <strong id="linAVal" class="text-indigo-600 font-mono">1.0</strong></span>
            <input type="range" id="linASlider" min="-3" max="3" step="0.5" value="1.0" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>y절편 b: <strong id="linBVal" class="text-rose-600 font-mono">1.0</strong></span>
            <input type="range" id="linBSlider" min="-4" max="4" step="0.5" value="1.0" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>탐구 점 x: <strong id="linXVal" class="text-emerald-600 font-mono">2.0</strong></span>
            <input type="range" id="linXSlider" min="-4" max="4" step="1" value="2.0" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
          <span class="text-xs text-slate-500 font-semibold">대표 함수 프리셋:</span>
          <button class="btn-lin-pre clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold text-indigo-700" data-a="1" data-b="0">y = x</button>
          <button class="btn-lin-pre clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold text-indigo-700" data-a="2" data-b="-1">y = 2x - 1</button>
          <button class="btn-lin-pre clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold text-indigo-700" data-a="-1" data-b="2">y = -x + 2</button>
          <button class="btn-lin-pre clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold text-indigo-700" data-a="-0.5" data-b="0">y = -0.5x</button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "linear") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const unit = Math.min(width, height) / 12;

      // 모눈종이와 축 눈금 숫자
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px monospace";

      for (let x = -5; x <= 5; x++) {
        const px = centerX + x * unit;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.stroke();
        if (x !== 0) ctx.fillText(x, px - 3, centerY + 12);
      }
      for (let y = -5; y <= 5; y++) {
        const py = centerY - y * unit;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
        if (y !== 0) ctx.fillText(y, centerX - 14, py + 3);
      }

      // 메인 축
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // 직선
      const x1 = -6, y1 = a * x1 + b;
      const x2 = 6, y2 = a * x2 + b;
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(centerX + x1 * unit, centerY - y1 * unit);
      ctx.lineTo(centerX + x2 * unit, centerY - y2 * unit);
      ctx.stroke();

      // 기울기 계단 (Slope stairs: x=0 에서 x=1)
      if (Math.abs(a) >= 0.1) {
        const sX = centerX;
        const sY = centerY - b * unit;
        const cX = centerX + 1 * unit;
        const cY = sY;
        const eY = centerY - (a + b) * unit;

        ctx.beginPath();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 2;
        ctx.moveTo(sX, sY);
        ctx.lineTo(cX, cY);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = a > 0 ? "#e11d48" : "#2563eb";
        ctx.moveTo(cX, cY);
        ctx.lineTo(cX, eY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 탐구 점 (testX, testY)
      const testY = a * testX + b;
      const ptPxX = centerX + testX * unit;
      const ptPxY = centerY - testY * unit;

      ctx.beginPath();
      ctx.arc(ptPxX, ptPxY, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#065f46";
      ctx.font = "bold 12px Pretendard";
      ctx.fillText(`(${testX}, ${testY.toFixed(1)})`, ptPxX + 10, ptPxY - 6);

      // y절편 점
      const intY = centerY - b * unit;
      ctx.beginPath();
      ctx.arc(centerX, intY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#e11d48";
      ctx.fill();

      // 정보 박스
      if (infoEl) {
        const xInt = a !== 0 ? (-b / a).toFixed(1) : "없음";
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            직선식: <span class="text-indigo-600 font-black">y = ${a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)}</span>
            | y절편: <span class="text-rose-600 font-bold">(0, ${b})</span>
            | x절편: <span class="text-blue-600 font-bold">(${xInt}, 0)</span>
            | 대입: x=${testX} → y=<span class="text-emerald-600 font-black">${testY.toFixed(1)}</span>
          </div>
        `;
      }
    };

    draw();

    document.getElementById("linASlider").addEventListener("input", (e) => {
      a = parseFloat(e.target.value);
      document.getElementById("linAVal").textContent = a.toFixed(1);
      draw();
    });
    document.getElementById("linBSlider").addEventListener("input", (e) => {
      b = parseFloat(e.target.value);
      document.getElementById("linBVal").textContent = b.toFixed(1);
      draw();
    });
    document.getElementById("linXSlider").addEventListener("input", (e) => {
      testX = parseFloat(e.target.value);
      document.getElementById("linXVal").textContent = testX.toFixed(1);
      draw();
    });

    document.querySelectorAll(".btn-lin-pre").forEach((btn) => {
      btn.addEventListener("click", () => {
        a = parseFloat(btn.getAttribute("data-a"));
        b = parseFloat(btn.getAttribute("data-b"));
        document.getElementById("linASlider").value = a;
        document.getElementById("linBSlider").value = b;
        document.getElementById("linAVal").textContent = a.toFixed(1);
        document.getElementById("linBVal").textContent = b.toFixed(1);
        draw();
      });
    });
  },

  /* =========================================================================
   * 3. [중3 기하] 삼각비와 닮음 (특수각 & 불변성 증명)
   * ========================================================================= */
  mountTrig(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "trig";

    let deg = 30;
    let sizeScale = 1.0;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-18">각도 θ = <strong id="trigDegVal" class="text-purple-600 font-mono">30°</strong></span>
            <input type="range" id="trigDegSlider" min="15" max="75" value="30" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-24">삼각형 크기 = <strong id="trigSizeVal" class="text-indigo-600 font-mono">1.0x</strong></span>
            <input type="range" id="trigSizeSlider" min="0.6" max="1.4" step="0.1" value="1.0" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
          <span class="text-xs text-slate-500 font-semibold mr-1">중3 필수 특수각:</span>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="30">30° (1:√3:2)</button>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="45">45° (1:1:√2)</button>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="60">60° (√3:1:2)</button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "trig") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const rad = (deg * Math.PI) / 180;
      const baseLen = 170 * sizeScale;
      const heightLen = baseLen * Math.tan(rad);
      const hypLen = baseLen / Math.cos(rad);

      const pBase = { x: width * 0.16, y: height * 0.82 };
      const pRight = { x: pBase.x + baseLen, y: pBase.y };
      const pTop = { x: pBase.x + baseLen, y: pBase.y - heightLen };

      // 직각삼각형 채우기
      ctx.beginPath();
      ctx.moveTo(pBase.x, pBase.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
      ctx.fill();
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 직각 기호
      const mark = 12;
      ctx.beginPath();
      ctx.moveTo(pRight.x - mark, pRight.y);
      ctx.lineTo(pRight.x - mark, pRight.y - mark);
      ctx.lineTo(pRight.x, pRight.y - mark);
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 각도 호
      ctx.beginPath();
      ctx.arc(pBase.x, pBase.y, 35, 0, -rad, true);
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#ec4899";
      ctx.font = "bold 13px Pretendard";
      ctx.fillText(`${deg}°`, pBase.x + 42, pBase.y - 10);

      // 변 길이 라벨
      ctx.font = "bold 11px Pretendard";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(`밑변: ${(baseLen / 30).toFixed(1)}`, (pBase.x + pRight.x) / 2 - 15, pBase.y + 18);
      ctx.fillText(`높이: ${(heightLen / 30).toFixed(1)}`, pRight.x + 10, (pRight.y + pTop.y) / 2);
      ctx.fillText(`빗변: ${(hypLen / 30).toFixed(1)}`, (pBase.x + pTop.x) / 2 - 35, (pBase.y + pTop.y) / 2 - 10);

      const sinV = Math.sin(rad).toFixed(3);
      const cosV = Math.cos(rad).toFixed(3);
      const tanV = Math.tan(rad).toFixed(3);

      let exactRatio = "";
      if (deg === 30) exactRatio = " (특수비 1/2, √3/2, 1/√3)";
      else if (deg === 45) exactRatio = " (특수비 √2/2, √2/2, 1)";
      else if (deg === 60) exactRatio = " (특수비 √3/2, 1/2, √3)";

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="grid grid-cols-3 gap-2 font-mono text-xs sm:text-sm font-bold text-center">
            <div class="clay-inset p-2 rounded-xl bg-purple-50">sin ${deg}° = <span class="text-purple-700 font-black">${sinV}</span></div>
            <div class="clay-inset p-2 rounded-xl bg-indigo-50">cos ${deg}° = <span class="text-indigo-700 font-black">${cosV}</span></div>
            <div class="clay-inset p-2 rounded-xl bg-pink-50">tan ${deg}° = <span class="text-pink-700 font-black">${tanV}</span></div>
          </div>
          <div class="text-center text-[11px] text-slate-500 mt-1 font-semibold">
            크기(${sizeScale.toFixed(1)}x)를 바꾸어도 <span class="text-indigo-600 font-bold">삼각비는 항상 일정</span>합니다! ${exactRatio}
          </div>
        `;
      }
    };

    draw();

    document.getElementById("trigDegSlider").addEventListener("input", (e) => {
      deg = parseInt(e.target.value);
      document.getElementById("trigDegVal").textContent = `${deg}°`;
      draw();
    });

    document.getElementById("trigSizeSlider").addEventListener("input", (e) => {
      sizeScale = parseFloat(e.target.value);
      document.getElementById("trigSizeVal").textContent = `${sizeScale.toFixed(1)}x`;
      draw();
    });

    document.querySelectorAll(".btn-preset-deg").forEach((btn) => {
      btn.addEventListener("click", () => {
        deg = parseInt(btn.getAttribute("data-deg"));
        document.getElementById("trigDegSlider").value = deg;
        document.getElementById("trigDegVal").textContent = `${deg}°`;
        draw();
      });
    });
  },

  /* =========================================================================
   * 4. [중3 함수] 이차함수 y = a(x - p)^2 + q (농구 골대 슛 물리 시뮬레이션)
   * ========================================================================= */
  mountQuadratic(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "quadratic";

    let a = -0.3;
    let p = 1.0;
    let q = 3.5;
    let ballX = -5;
    let isShooting = false;
    let isGoal = false;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>폭 a: <strong id="quadAVal" class="text-rose-600 font-mono">-0.3</strong></span>
            <input type="range" id="quadASlider" min="-1.0" max="-0.1" step="0.05" value="-0.3" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>꼭짓점 p: <strong id="quadPVal" class="text-indigo-600 font-mono">1.0</strong></span>
            <input type="range" id="quadPSlider" min="-2" max="3" step="0.5" value="1.0" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>꼭짓점 q: <strong id="quadQVal" class="text-emerald-600 font-mono">3.5</strong></span>
            <input type="range" id="quadQSlider" min="2" max="5" step="0.5" value="3.5" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-slate-100">
          <button id="btnShootBall" class="clay-btn clay-btn-coral px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
            <i data-lucide="play" class="w-4 h-4"></i> 농구공 궤적 슛 발사!
          </button>
          <span class="text-xs text-slate-600 font-semibold">대칭축: <strong class="text-indigo-600 font-mono">x = ${p}</strong> | 골대 위치: x=4.5, y=1.5</span>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const draw = () => {
      if (SimulationEngine.currentSim !== "quadratic") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const centerX = width * 0.45;
      const centerY = height * 0.72;
      const unit = Math.min(width, height) / 13;

      // 농구 코트 바닥면
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(20, centerY);
      ctx.lineTo(width - 20, centerY);
      ctx.stroke();

      // 골대 (Hoop & Backboard at x = 4.5, y = 1.5)
      const hoopX = centerX + 4.5 * unit;
      const hoopY = centerY - 1.5 * unit;

      // 골대 기둥
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hoopX + 18, centerY);
      ctx.lineTo(hoopX + 18, hoopY - 30);
      ctx.stroke();

      // 백보드
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hoopX + 18, hoopY - 40);
      ctx.lineTo(hoopX + 18, hoopY + 15);
      ctx.stroke();

      // 림 (Orange Rim)
      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(hoopX, hoopY);
      ctx.lineTo(hoopX + 18, hoopY);
      ctx.stroke();

      // 그물
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(hoopX, hoopY);
      ctx.lineTo(hoopX + 5, hoopY + 15);
      ctx.lineTo(hoopX + 14, hoopY + 15);
      ctx.lineTo(hoopX + 18, hoopY);
      ctx.stroke();

      // 포물선 그리기
      ctx.beginPath();
      ctx.strokeStyle = "rgba(225, 29, 72, 0.85)";
      ctx.lineWidth = 3;

      for (let x = -6; x <= 6; x += 0.1) {
        const y = a * Math.pow(x - p, 2) + q;
        const px = centerX + x * unit;
        const py = centerY - y * unit;
        if (x === -6) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 대칭축 x = p
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.moveTo(centerX + p * unit, 20);
      ctx.lineTo(centerX + p * unit, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // 꼭짓점 (p, q)
      const vX = centerX + p * unit;
      const vY = centerY - q * unit;
      ctx.beginPath();
      ctx.arc(vX, vY, 7, 0, Math.PI * 2);
      ctx.fillStyle = "#4f46e5";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#4338ca";
      ctx.font = "bold 12px Pretendard";
      ctx.fillText(`꼭짓점 (${p}, ${q})`, vX - 25, vY - 10);

      // 날아가는 농구공 애니메이션
      if (isShooting) {
        const curY = a * Math.pow(ballX - p, 2) + q;
        const bPxX = centerX + ballX * unit;
        const bPxY = centerY - curY * unit;

        ctx.beginPath();
        ctx.arc(bPxX, bPxY, 11, 0, Math.PI * 2);
        ctx.fillStyle = "#ea580c";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 농구공 가로/세로 리브
        ctx.strokeStyle = "#7c2d12";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bPxX - 10, bPxY);
        ctx.lineTo(bPxX + 10, bPxY);
        ctx.stroke();

        ballX += 0.18;

        // 골인 판정 (x=4.5, y=1.5 부근 통과)
        if (Math.abs(ballX - 4.5) < 0.25 && Math.abs(curY - 1.5) < 0.6) {
          isGoal = true;
        }

        if (ballX > 5.8) {
          isShooting = false;
          ballX = -5;
        }
      }

      if (isGoal) {
        ctx.fillStyle = "#16a34a";
        ctx.font = "black 20px Pretendard";
        ctx.fillText("🏀 GOAL IN! 완벽한 슛!", hoopX - 50, hoopY - 30);
      }

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            포물선 공식: <span class="text-rose-600 font-black">y = ${a}(x - ${p})² + ${q}</span>
            | 최고점 높이: <span class="text-indigo-600 font-black">${q}</span>
            | 꼭짓점 조절로 농구 슛을 골인시켜보세요!
          </div>
        `;
      }

      if (isShooting) {
        SimulationEngine.animId = requestAnimationFrame(draw);
      }
    };

    draw();

    document.getElementById("quadASlider").addEventListener("input", (e) => {
      a = parseFloat(e.target.value);
      document.getElementById("quadAVal").textContent = a.toFixed(2);
      isGoal = false;
      draw();
    });

    document.getElementById("quadPSlider").addEventListener("input", (e) => {
      p = parseFloat(e.target.value);
      document.getElementById("quadPVal").textContent = p.toFixed(1);
      isGoal = false;
      draw();
    });

    document.getElementById("quadQSlider").addEventListener("input", (e) => {
      q = parseFloat(e.target.value);
      document.getElementById("quadQVal").textContent = q.toFixed(1);
      isGoal = false;
      draw();
    });

    document.getElementById("btnShootBall").addEventListener("click", () => {
      ballX = -5;
      isGoal = false;
      isShooting = true;
      draw();
    });
  },

  /* =========================================================================
   * 5. [중1 기하] 입체도형 회전체와 전개도 (3D 회전체 & 전개도 완벽 구현)
   * ========================================================================= */
  mountSolid(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "solid";

    let shape = "cylinder"; // cylinder, cone, sphere
    let rotAngle = 45; // 0 ~ 360
    let isSpinning = false;
    let showNet = false; // 전개도 모드

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <button class="btn-solid-tab clay-btn active px-3.5 py-1.5 text-xs font-bold" data-shape="cylinder">원기둥</button>
            <button class="btn-solid-tab clay-btn px-3.5 py-1.5 text-xs font-bold" data-shape="cone">원뿔</button>
            <button class="btn-solid-tab clay-btn px-3.5 py-1.5 text-xs font-bold" data-shape="sphere">구</button>
          </div>
          <button id="btnToggleNet" class="clay-btn clay-btn-secondary px-3.5 py-1.5 text-xs font-bold text-indigo-700">
            전개도 펼치기/접기
          </button>
        </div>
        <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 flex-1">
            <span>회전각: <strong id="rotAngleVal" class="text-emerald-600 font-mono">45°</strong></span>
            <input type="range" id="rotAngleSlider" min="0" max="360" value="45" class="clay-slider flex-1">
          </div>
          <button id="btnSpinSolid" class="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-bold text-white">
            360° 연속 회전
          </button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "solid") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const r = 85;
      const h = 130;

      if (showNet) {
        // --- 전개도 모드 ---
        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 13px Pretendard";

        if (shape === "cylinder") {
          ctx.fillText("원기둥 전개도 (직사각형 옆면 + 밑면 원 2개)", 30, 30);
          // 직사각형 옆면 (가로 = 2*pi*r, 세로 = h)
          const netW = 220;
          const netH = 100;
          const netX = centerX - netW / 2;
          const netY = centerY - netH / 2;

          ctx.fillStyle = "rgba(99, 102, 241, 0.2)";
          ctx.fillRect(netX, netY, netW, netH);
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 2.5;
          ctx.strokeRect(netX, netY, netW, netH);

          // 위/아래 원
          ctx.beginPath();
          ctx.arc(centerX, netY - 26, 26, 0, Math.PI * 2);
          ctx.arc(centerX, netY + netH + 26, 26, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
          ctx.fill();
          ctx.strokeStyle = "#059669";
          ctx.stroke();

          ctx.fillStyle = "#4338ca";
          ctx.font = "bold 11px Pretendard";
          ctx.fillText("가로 = 2πr (밑면 둘레)", netX + 40, netY + netH / 2);
          ctx.fillText("세로 = h", netX - 45, netY + netH / 2);
        } else if (shape === "cone") {
          ctx.fillText("원뿔 전개도 (부채꼴 옆면 + 밑면 원 1개)", 30, 30);
          // 부채꼴 (모선 R, 호의 길이 2*pi*r)
          const apexX = centerX;
          const apexY = centerY - 50;
          const sectorR = 120;
          const sectorAngle = Math.PI * 0.75; // 135도

          ctx.beginPath();
          ctx.moveTo(apexX, apexY);
          ctx.arc(apexX, apexY, sectorR, Math.PI / 2 - sectorAngle / 2, Math.PI / 2 + sectorAngle / 2);
          ctx.closePath();
          ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
          ctx.fill();
          ctx.strokeStyle = "#e11d48";
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // 밑면 원
          ctx.beginPath();
          ctx.arc(apexX, apexY + sectorR + 25, 25, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
          ctx.fill();
          ctx.strokeStyle = "#059669";
          ctx.stroke();

          ctx.fillStyle = "#9f1239";
          ctx.font = "bold 11px Pretendard";
          ctx.fillText("모선 (l)", apexX - 45, apexY + 50);
          ctx.fillText("호의 길이 = 2πr", apexX - 35, apexY + sectorR - 10);
        } else {
          ctx.fillText("구의 성질 (어느 방향으로 잘라도 단면은 항상 원)", 30, 30);
          ctx.beginPath();
          ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(139, 92, 246, 0.2)";
          ctx.fill();
          ctx.strokeStyle = "#7c3aed";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, 80, 25, 0, 0, Math.PI * 2);
          ctx.strokeStyle = "#6366f1";
          ctx.stroke();

          ctx.fillStyle = "#4c1d95";
          ctx.font = "bold 12px Pretendard";
          ctx.fillText("구는 평면으로 펼칠 수 없는 입체입니다", centerX - 95, centerY + 115);
        }
      } else {
        // --- 3D 회전체 모드 ---
        // 회전축 L
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 2;
        ctx.moveTo(centerX, 20);
        ctx.lineTo(centerX, height - 20);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#e11d48";
        ctx.font = "bold 11px Pretendard";
        ctx.fillText("회전축 L", centerX + 8, 30);

        const rad = (rotAngle * Math.PI) / 180;
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);

        // 3D 셰이딩 표면
        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 2.5;

        if (shape === "cylinder") {
          // 윗면/밑면 타원
          ctx.beginPath();
          ctx.ellipse(centerX, centerY - h / 2, r, Math.max(4, r * 0.25), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(centerX, centerY + h / 2, r, Math.max(4, r * 0.25), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 옆면 테두리
          ctx.beginPath();
          ctx.moveTo(centerX - r, centerY - h / 2);
          ctx.lineTo(centerX - r, centerY + h / 2);
          ctx.moveTo(centerX + r, centerY - h / 2);
          ctx.lineTo(centerX + r, centerY + h / 2);
          ctx.stroke();

          // 회전하는 2D 단면 (직사각형)
          ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - h / 2);
          ctx.lineTo(centerX + r * cosR, centerY - h / 2 + 15 * sinR);
          ctx.lineTo(centerX + r * cosR, centerY + h / 2 + 15 * sinR);
          ctx.lineTo(centerX, centerY + h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#4338ca";
          ctx.stroke();
        } else if (shape === "cone") {
          // 밑면 타원
          ctx.beginPath();
          ctx.ellipse(centerX, centerY + h / 2, r, Math.max(4, r * 0.25), 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 옆선
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - h / 2);
          ctx.lineTo(centerX - r, centerY + h / 2);
          ctx.moveTo(centerX, centerY - h / 2);
          ctx.lineTo(centerX + r, centerY + h / 2);
          ctx.stroke();

          // 회전하는 2D 단면 (직각삼각형)
          ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
          ctx.beginPath();
          ctx.moveTo(centerX, centerY - h / 2);
          ctx.lineTo(centerX + r * cosR, centerY + h / 2 + 15 * sinR);
          ctx.lineTo(centerX, centerY + h / 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "#4338ca";
          ctx.stroke();
        } else {
          // 구
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.ellipse(centerX, centerY, r, Math.max(4, r * 0.3), 0, 0, Math.PI * 2);
          ctx.stroke();

          // 회전하는 반원 단면
          ctx.fillStyle = "rgba(99, 102, 241, 0.5)";
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, r * Math.abs(cosR), r, 0, -Math.PI / 2, Math.PI / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            ${showNet ? "전개도 모드: 입체도형을 평면으로 펼쳤을 때의 모양과 공식" : "3D 회전 모드: 평면도형을 360° 회전시켜 입체도형 생성"}
            | 부피 관계: <span class="text-indigo-600 font-black">원뿔 : 구 : 원기둥 = 1 : 2 : 3</span>
          </div>
        `;
      }

      if (isSpinning && !showNet) {
        rotAngle = (rotAngle + 3) % 360;
        document.getElementById("rotAngleSlider").value = rotAngle;
        document.getElementById("rotAngleVal").textContent = `${rotAngle}°`;
        SimulationEngine.animId = requestAnimationFrame(draw);
      }
    };

    draw();

    document.getElementById("rotAngleSlider").addEventListener("input", (e) => {
      rotAngle = parseInt(e.target.value);
      document.getElementById("rotAngleVal").textContent = `${rotAngle}°`;
      isSpinning = false;
      draw();
    });

    document.getElementById("btnSpinSolid").addEventListener("click", () => {
      isSpinning = !isSpinning;
      showNet = false;
      if (isSpinning) draw();
    });

    document.getElementById("btnToggleNet").addEventListener("click", () => {
      showNet = !showNet;
      isSpinning = false;
      draw();
    });

    document.querySelectorAll(".btn-solid-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".btn-solid-tab").forEach((t) => t.classList.remove("active", "clay-btn-primary"));
        tab.classList.add("active", "clay-btn-primary");
        shape = tab.getAttribute("data-shape");
        draw();
      });
    });
  },

  /* =========================================================================
   * 6. [중2 기하] 삼각형의 외심과 내심 실시간 작도기 (데이터베이스 저장 & 불러오기 지원)
   * ========================================================================= */
  mountIncenter(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "incenter";

    let pts = [
      { x: 190, y: 65, name: "A" },
      { x: 70, y: 250, name: "B" },
      { x: 340, y: 250, name: "C" }
    ];
    let draggedPt = null;
    let showCircum = true;
    let showIn = true;

    // 현재 기하 계산 상태
    let currentCalc = {
      triType: "예각삼각형",
      circumDesc: "삼각형 내부",
      a: 0, b: 0, c: 0,
      circumX: 0, circumY: 0, circumR: 0,
      inX: 0, inY: 0, inR: 0
    };

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <!-- Supabase 클라우드 DB 상태 및 설정 안내 배너 -->
        <div id="bannerSupabaseNotice" class="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-300 flex items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow">
              ⚡
            </span>
            <div class="text-xs">
              <div class="flex items-center gap-2">
                <strong class="text-emerald-950 font-black text-sm">Supabase 클라우드 데이터베이스</strong>
                <span id="bannerDbStatusBadge" class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                  확인 중...
                </span>
              </div>
              <p id="bannerDbStatusDesc" class="text-[11px] text-slate-600 mt-0.5 font-medium">
                URL과 anon Key를 등록하면 학생들의 탐구 결과가 Supabase에 실시간 영구 저장됩니다.
              </p>
            </div>
          </div>
          <button id="btnBannerOpenConfig" class="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-black text-white shrink-0 shadow hover:scale-105 transition-all">
            ⚙️ Supabase 설정 열기
          </button>
        </div>

        <!-- Row 1: 작도 옵션 및 프리셋 -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-4 text-xs font-bold text-slate-700">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="chkCircum" checked class="rounded text-indigo-600">
              <span class="text-indigo-700">외심 (O) & 외접원 (수직이등분선)</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="chkIncenter" checked class="rounded text-rose-600">
              <span class="text-rose-700">내심 (I) & 내접원 (각의 이등분선)</span>
            </label>
          </div>
          <div class="flex items-center gap-1.5">
            <button id="btnAcute" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold">예각삼각형</button>
            <button id="btnRight" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-indigo-700 border-indigo-300">직각(빗변중점!)</button>
            <button id="btnObtuse" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-amber-700">둔각(외부)</button>
          </div>
        </div>

        <!-- Row 2: Supabase 클라우드 데이터베이스 툴바 -->
        <div class="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200">
          <div class="flex items-center gap-2 flex-wrap">
            <button id="btnOpenSaveDb" class="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-300"></i> Supabase DB 저장
            </button>
            <button id="btnToggleDbList" class="clay-btn clay-btn-secondary px-3.5 py-1.5 text-xs font-bold text-indigo-700 flex items-center gap-1.5">
              <i data-lucide="database" class="w-3.5 h-3.5"></i> Supabase 기록 보기 <span id="dbRecordBadge" class="ml-1 px-1.5 py-0.2 bg-indigo-100 rounded-full text-[10px] font-mono">0건</span>
            </button>
            <button id="btnOpenSupabaseConfig" class="clay-btn px-3.5 py-1.5 text-xs font-black text-emerald-800 bg-emerald-100 border-2 border-emerald-400 flex items-center gap-1.5 hover:bg-emerald-200 shadow-sm transition-transform active:scale-95">
              <i data-lucide="settings" class="w-4 h-4 text-emerald-700"></i> ⚙️ Supabase 설정 & SQL
            </button>
          </div>
          <div id="dbSaveToast" class="hidden text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-bounce">
            <i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Supabase DB 저장 완료!
          </div>
        </div>

        <!-- Row 3: Supabase 연결 설정 패널 (URL / Anon Key / SQL 복사) -->
        <div id="supabaseConfigPanel" class="hidden p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200 clay-card space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">S</span>
              <h4 class="text-xs sm:text-sm font-black text-slate-900">Supabase 클라우드 데이터베이스 연결 설정</h4>
            </div>
            <button id="btnCloseConfig" class="clay-btn clay-btn-secondary p-1 text-slate-400 hover:text-slate-700">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            선생님의 <strong>Supabase 프로젝트 URL</strong>과 <strong>anon public API Key</strong>를 입력하면 모든 학생과 태블릿의 외심/내심 탐구 데이터가 Supabase 클라우드 PostgreSQL 테이블(<code class="bg-white/80 px-1 rounded font-mono text-emerald-700">incenter_records</code>)에 실시간 보관됩니다.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">Project URL</label>
              <input type="text" id="supabaseUrlInput" placeholder="https://your-project.supabase.co" class="w-full clay-inset px-3 py-1.5 text-xs font-mono text-slate-800 outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-1">anon public Key</label>
              <input type="text" id="supabaseKeyInput" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." class="w-full clay-inset px-3 py-1.5 text-xs font-mono text-slate-800 outline-none">
            </div>
          </div>
          <div class="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button id="btnCopySql" class="clay-btn clay-btn-secondary px-3 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1 bg-white/90">
              <i data-lucide="copy" class="w-3.5 h-3.5"></i> Supabase 테이블 생성 SQL 복사
            </button>
            <button id="btnSaveSupabaseConfig" class="clay-btn clay-btn-primary px-4 py-1 text-xs font-bold text-white shadow-md">
              연결 정보 저장
            </button>
          </div>
        </div>

        <!-- Row 4: DB 저장 폼 -->
        <div id="dbSaveForm" class="hidden p-3.5 rounded-2xl bg-white border border-indigo-100 clay-card space-y-2.5">
          <div class="flex items-center justify-between text-xs font-bold text-slate-800">
            <span class="flex items-center gap-1.5 text-indigo-700 font-black">
              <i data-lucide="zap" class="w-3.5 h-3.5 text-emerald-500"></i> Supabase DB에 현재 탐구 결과 저장
            </span>
            <span id="dbCurrentTypeBadge" class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">삼각형 판별 중...</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">학생 / 모둠명</label>
              <input type="text" id="inputStudentName" placeholder="예: 2학년 3반 1모둠" class="w-full clay-inset px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-600 mb-1">탐구 관찰 메모</label>
              <input type="text" id="inputMemo" placeholder="예: 직각삼각형일 때 외심이 빗변의 정중앙에 위치함" class="w-full clay-inset px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none">
            </div>
          </div>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button id="btnCancelSave" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-semibold text-slate-600">취소</button>
            <button id="btnConfirmSave" class="clay-btn clay-btn-primary px-4 py-1 text-xs font-bold text-white flex items-center gap-1">
              <i data-lucide="upload-cloud" class="w-3.5 h-3.5"></i> Supabase에 영구 등록
            </button>
          </div>
        </div>

        <!-- Row 5: 저장된 Supabase 클라우드 기록 목록 뷰 -->
        <div id="dbRecordsView" class="hidden p-3.5 rounded-2xl bg-white border border-slate-200 clay-card space-y-2.5">
          <div class="flex items-center justify-between pb-1 border-b border-slate-100">
            <span class="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <i data-lucide="server" class="w-4 h-4 text-emerald-600"></i> Supabase 클라우드 저장 기록 (<span id="dbCountText">0</span>건)
            </span>
            <div class="flex items-center gap-2">
              <button id="btnRefreshDb" class="clay-btn clay-btn-secondary px-2.5 py-1 text-xs font-bold text-slate-700 flex items-center gap-1">
                <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-indigo-600"></i> 새로고침
              </button>
              <button id="btnCloseRecords" class="clay-btn clay-btn-secondary px-2 py-1 text-xs font-semibold text-slate-500">닫기</button>
            </div>
          </div>
          <div id="dbRecordsTable" class="max-h-56 overflow-y-auto space-y-2 text-xs pr-1">
            <!-- Supabase 기록 목록이 동적으로 주입됩니다 -->
          </div>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const draw = () => {
      if (SimulationEngine.currentSim !== "incenter") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const [A, B, C] = pts;

      // 삼각형 그리기
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(241, 245, 249, 0.7)";
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // 세 변의 길이 (a: BC대변, b: AC대변, c: AB대변)
      const a = Math.hypot(B.x - C.x, B.y - C.y);
      const b = Math.hypot(A.x - C.x, A.y - C.y);
      const c = Math.hypot(A.x - B.x, A.y - B.y);

      // 내심 계산: (aA + bB + cC)/(a+b+c)
      const p = a + b + c;
      const inX = (a * A.x + b * B.x + c * C.x) / p;
      const inY = (a * A.y + b * B.y + c * C.y) / p;
      const s = p / 2;
      const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
      const inR = area / s;

      // 외심 계산
      const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
      let circumX = 0, circumY = 0, circumR = 0;
      if (Math.abs(d) > 0.001) {
        circumX =
          ((A.x ** 2 + A.y ** 2) * (B.y - C.y) +
            (B.x ** 2 + B.y ** 2) * (C.y - A.y) +
            (C.x ** 2 + C.y ** 2) * (A.y - B.y)) /
          d;
        circumY =
          ((A.x ** 2 + A.y ** 2) * (C.x - B.x) +
            (B.x ** 2 + B.y ** 2) * (A.x - C.x) +
            (C.x ** 2 + C.y ** 2) * (B.x - A.x)) /
          d;
        circumR = Math.hypot(A.x - circumX, A.y - circumY);
      }

      // 1. 외심 작도선(세 변의 수직이등분선) & 외접원
      if (showCircum && circumR > 0 && circumR < 600) {
        const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
        const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
        const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 };

        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(79, 70, 229, 0.4)";
        ctx.lineWidth = 1.5;

        [midAB, midBC, midCA].forEach((m) => {
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(circumX, circumY);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // 외접원
        ctx.beginPath();
        ctx.arc(circumX, circumY, circumR, 0, Math.PI * 2);
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 외심 O 점
        ctx.beginPath();
        ctx.arc(circumX, circumY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#4f46e5";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#312e81";
        ctx.font = "bold 12px Pretendard";
        ctx.fillText("외심 O", circumX + 8, circumY - 4);
      }

      // 2. 내심 작도선(세 내각의 이등분선) & 내접원
      if (showIn && inR > 0) {
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = "rgba(225, 29, 72, 0.4)";
        ctx.lineWidth = 1.5;

        [A, B, C].forEach((vertex) => {
          ctx.beginPath();
          ctx.moveTo(vertex.x, vertex.y);
          ctx.lineTo(inX, inY);
          ctx.stroke();
        });
        ctx.setLineDash([]);

        // 내접원
        ctx.beginPath();
        ctx.arc(inX, inY, inR, 0, Math.PI * 2);
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 내심 I 점
        ctx.beginPath();
        ctx.arc(inX, inY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#e11d48";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#881337";
        ctx.font = "bold 12px Pretendard";
        ctx.fillText("내심 I", inX + 8, inY - 4);
      }

      // 꼭짓점 A, B, C (터치/드래그 핸들)
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = "#065f46";
        ctx.font = "bold 14px Pretendard";
        ctx.fillText(pt.name, pt.x - 5, pt.y - 14);
      });

      // 삼각형 종류 및 외심 위치 판별
      const sidesSq = [a * a, b * b, c * c].sort((x, y) => x - y);
      const isRight = Math.abs(sidesSq[0] + sidesSq[1] - sidesSq[2]) < 350;
      const isObtuse = !isRight && sidesSq[0] + sidesSq[1] < sidesSq[2];
      const triType = isRight ? "직각삼각형" : isObtuse ? "둔각삼각형" : "예각삼각형";
      const circumDesc = isRight ? "빗변의 중점" : isObtuse ? "삼각형 외부" : "삼각형 내부";

      currentCalc = {
        triType,
        circumDesc,
        a: Math.round(a),
        b: Math.round(b),
        c: Math.round(c),
        circumX: Math.round(circumX),
        circumY: Math.round(circumY),
        circumR: Math.round(circumR),
        inX: Math.round(inX),
        inY: Math.round(inY),
        inR: Math.round(inR)
      };

      const isDbConn = window.MathClayDB && MathClayDB.isConnected();
      const connStatus = isDbConn
        ? `<span class="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">⚡ Supabase 클라우드 연동됨</span>`
        : `<button id="btnInfoConfig" class="text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-0.5 rounded-full font-bold border border-rose-200 transition-colors cursor-pointer flex items-center gap-1">⚠️ Supabase 미연동 (여기를 눌러 설정)</button>`;

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span>판별: <strong class="${isRight ? 'text-indigo-600' : isObtuse ? 'text-amber-600' : 'text-emerald-600'} font-black">${triType}</strong></span>
              <span>외심: <strong class="text-indigo-700">${circumDesc}</strong> O(${currentCalc.circumX}, ${currentCalc.circumY})</span>
              <span>내심: I(${currentCalc.inX}, ${currentCalc.inY})</span>
            </div>
            <div class="text-[11px]">${connStatus}</div>
          </div>
        `;

        const btnInfoConfig = document.getElementById("btnInfoConfig");
        if (btnInfoConfig) {
          btnInfoConfig.addEventListener("click", () => {
            const cfg = document.getElementById("supabaseConfigPanel");
            if (cfg) {
              cfg.classList.remove("hidden");
              cfg.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          });
        }
      }
    };

    draw();

    // 포인터 이벤트 (마우스 + 모바일 터치)
    function getPointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function onPointerDown(e) {
      const pos = getPointerPos(e);
      pts.forEach((pt) => {
        if (Math.hypot(pt.x - pos.x, pt.y - pos.y) < 25) {
          draggedPt = pt;
        }
      });
      if (draggedPt && e.touches) e.preventDefault();
    }

    function onPointerMove(e) {
      if (!draggedPt) return;
      const rect = canvas.getBoundingClientRect();
      const pos = getPointerPos(e);
      draggedPt.x = Math.max(30, Math.min(rect.width - 30, pos.x));
      draggedPt.y = Math.max(30, Math.min(rect.height - 30, pos.y));
      draw();
      if (e.touches) e.preventDefault();
    }

    function onPointerUp() {
      draggedPt = null;
    }

    canvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    canvas.addEventListener("touchstart", onPointerDown, { passive: false });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);

    this.cleanupHandlers = () => {
      canvas.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      canvas.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };

    // 프리셋 버튼
    document.getElementById("btnAcute").addEventListener("click", () => {
      pts[0] = { x: 200, y: 60, name: "A" };
      pts[1] = { x: 80, y: 250, name: "B" };
      pts[2] = { x: 330, y: 250, name: "C" };
      draw();
    });

    document.getElementById("btnRight").addEventListener("click", () => {
      pts[0] = { x: 80, y: 70, name: "A" };
      pts[1] = { x: 80, y: 250, name: "B" };
      pts[2] = { x: 330, y: 250, name: "C" };
      draw();
    });

    document.getElementById("btnObtuse").addEventListener("click", () => {
      pts[0] = { x: 300, y: 190, name: "A" };
      pts[1] = { x: 60, y: 250, name: "B" };
      pts[2] = { x: 340, y: 250, name: "C" };
      draw();
    });

    document.getElementById("chkCircum").addEventListener("change", (e) => {
      showCircum = e.target.checked;
      draw();
    });

    document.getElementById("chkIncenter").addEventListener("change", (e) => {
      showIn = e.target.checked;
      draw();
    });

    // --- Supabase 연동 제어 로직 ---
    const dbSaveForm = document.getElementById("dbSaveForm");
    const dbRecordsView = document.getElementById("dbRecordsView");
    const supabaseConfigPanel = document.getElementById("supabaseConfigPanel");
    const dbRecordBadge = document.getElementById("dbRecordBadge");
    const dbCountText = document.getElementById("dbCountText");
    const dbRecordsTable = document.getElementById("dbRecordsTable");
    const dbSaveToast = document.getElementById("dbSaveToast");
    const dbCurrentTypeBadge = document.getElementById("dbCurrentTypeBadge");
    const supabaseUrlInput = document.getElementById("supabaseUrlInput");
    const supabaseKeyInput = document.getElementById("supabaseKeyInput");

    const bannerDbStatusBadge = document.getElementById("bannerDbStatusBadge");
    const bannerDbStatusDesc = document.getElementById("bannerDbStatusDesc");
    const btnBannerOpenConfig = document.getElementById("btnBannerOpenConfig");

    // 저장 건수 및 연결 상태 배지 갱신
    async function updateDbBadge() {
      if (!window.MathClayDB) return;
      const records = await MathClayDB.getAllRecords();
      if (dbRecordBadge) dbRecordBadge.textContent = `${records.length}건`;
      if (dbCountText) dbCountText.textContent = records.length;

      const isConn = MathClayDB.isConnected();
      if (bannerDbStatusBadge) {
        bannerDbStatusBadge.className = `px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isConn ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'}`;
        bannerDbStatusBadge.textContent = isConn ? '⚡ 연동 완료' : '⚠️ 미연결 (설정 필요)';
      }
      if (bannerDbStatusDesc) {
        bannerDbStatusDesc.textContent = isConn
          ? 'Supabase 클라우드와 정상 연결되어 모든 탐구 결과가 실시간 동기화됩니다.'
          : 'URL과 anon Key를 등록하면 학생들의 외심/내심 탐구 결과가 Supabase에 영구 저장됩니다.';
      }
      if (btnBannerOpenConfig) {
        btnBannerOpenConfig.textContent = isConn ? '⚙️ 설정 변경' : '⚙️ Supabase 설정 열기';
      }
    }
    updateDbBadge();

    function openConfigDrawer() {
      supabaseConfigPanel.classList.toggle("hidden");
      dbSaveForm.classList.add("hidden");
      dbRecordsView.classList.add("hidden");

      if (window.MathClayDB) {
        const conf = MathClayDB.getConfig();
        if (supabaseUrlInput) supabaseUrlInput.value = conf.url || "";
        if (supabaseKeyInput) supabaseKeyInput.value = conf.anonKey || "";
      }
      if (!supabaseConfigPanel.classList.contains("hidden")) {
        supabaseConfigPanel.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Supabase 설정 열기 버튼들
    document.getElementById("btnOpenSupabaseConfig").addEventListener("click", openConfigDrawer);
    if (btnBannerOpenConfig) {
      btnBannerOpenConfig.addEventListener("click", openConfigDrawer);
    }

    document.getElementById("btnCloseConfig").addEventListener("click", () => {
      supabaseConfigPanel.classList.add("hidden");
    });

    // Supabase 설정 저장
    document.getElementById("btnSaveSupabaseConfig").addEventListener("click", () => {
      const url = supabaseUrlInput.value.trim();
      const key = supabaseKeyInput.value.trim();
      if (window.MathClayDB) {
        MathClayDB.saveConfig(url, key);
        supabaseConfigPanel.classList.add("hidden");
        alert("Supabase 연결 정보가 브라우저에 안전하게 저장되었습니다!");
        draw();
        updateDbBadge();
      }
    });

    // Supabase SQL 복사
    document.getElementById("btnCopySql").addEventListener("click", () => {
      if (window.MathClayDB) {
        const sql = MathClayDB.getSQLSchema();
        navigator.clipboard.writeText(sql).then(() => {
          alert("📋 Supabase SQL 쿼리가 클립보드에 복사되었습니다!\nSupabase Dashboard -> SQL Editor에 붙여넣고 Run을 실행해주세요.");
        });
      }
    });

    // 저장 폼 열기
    document.getElementById("btnOpenSaveDb").addEventListener("click", () => {
      dbSaveForm.classList.toggle("hidden");
      dbRecordsView.classList.add("hidden");
      supabaseConfigPanel.classList.add("hidden");

      if (!dbSaveForm.classList.contains("hidden")) {
        dbCurrentTypeBadge.textContent = `${currentCalc.triType} (외심: ${currentCalc.circumDesc})`;
        document.getElementById("inputMemo").value = 
          `${currentCalc.triType} 탐구 - 외심: ${currentCalc.circumDesc}, 외심 O(${currentCalc.circumX}, ${currentCalc.circumY}), 내심 I(${currentCalc.inX}, ${currentCalc.inY})`;
      }
    });

    document.getElementById("btnCancelSave").addEventListener("click", () => {
      dbSaveForm.classList.add("hidden");
    });

    // Supabase DB 저장 실행
    document.getElementById("btnConfirmSave").addEventListener("click", async () => {
      const studentName = document.getElementById("inputStudentName").value.trim() || "학생 탐구자";
      const memo = document.getElementById("inputMemo").value.trim() || "외심/내심 탐구 결과 저장";

      const newRecord = {
        studentName,
        triangleType: currentCalc.triType,
        circumLocation: currentCalc.circumDesc,
        vertices: {
          A: { x: pts[0].x, y: pts[0].y },
          B: { x: pts[1].x, y: pts[1].y },
          C: { x: pts[2].x, y: pts[2].y }
        },
        sideLengths: { a: currentCalc.a, b: currentCalc.b, c: currentCalc.c },
        circumcenter: { x: currentCalc.circumX, y: currentCalc.circumY, r: currentCalc.circumR },
        incenter: { x: currentCalc.inX, y: currentCalc.inY, r: currentCalc.inR },
        memo
      };

      if (window.MathClayDB) {
        const res = await MathClayDB.saveRecord(newRecord);
        dbSaveForm.classList.add("hidden");

        // 토스트 알림 표시
        if (dbSaveToast) {
          if (res.isLocal) {
            dbSaveToast.innerHTML = '<i data-lucide="info" class="w-3.5 h-3.5 text-amber-500"></i> 임시 저장됨 (Supabase 설정 시 클라우드 동기화)';
          } else {
            dbSaveToast.innerHTML = '<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500"></i> Supabase DB 클라우드 영구 저장 완료!';
          }
          dbSaveToast.classList.remove("hidden");
          setTimeout(() => dbSaveToast.classList.add("hidden"), 3500);
          if (window.lucide) lucide.createIcons();
        }

        await updateDbBadge();
        if (!dbRecordsView.classList.contains("hidden")) {
          await renderDbRecordsList();
        }
      }
    });

    // 저장된 기록 목록 토글
    document.getElementById("btnToggleDbList").addEventListener("click", async () => {
      dbRecordsView.classList.toggle("hidden");
      dbSaveForm.classList.add("hidden");
      supabaseConfigPanel.classList.add("hidden");
      if (!dbRecordsView.classList.contains("hidden")) {
        await renderDbRecordsList();
      }
    });

    document.getElementById("btnRefreshDb").addEventListener("click", async () => {
      await updateDbBadge();
      await renderDbRecordsList();
    });

    document.getElementById("btnCloseRecords").addEventListener("click", () => {
      dbRecordsView.classList.add("hidden");
    });

    // Supabase 기록 목록 렌더링
    async function renderDbRecordsList() {
      if (!window.MathClayDB || !dbRecordsTable) return;
      const records = await MathClayDB.getAllRecords();

      if (records.length === 0) {
        dbRecordsTable.innerHTML = `
          <div class="text-center py-6 text-slate-400">
            <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-1 opacity-50"></i>
            <p>아직 Supabase 데이터베이스에 저장된 탐구 기록이 없습니다.</p>
            <p class="text-[11px] mt-0.5">'Supabase DB 저장' 버튼을 눌러 첫 번째 결과를 등록해보세요!</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      dbRecordsTable.innerHTML = records
        .map((r) => {
          const typeBadgeColor = 
            r.triangleType === "직각삼각형" ? "bg-indigo-100 text-indigo-700" :
            r.triangleType === "둔각삼각형" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";

          return `
            <div class="clay-inset p-3 rounded-xl bg-slate-50/90 flex items-start justify-between gap-2 border border-slate-100">
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full ${typeBadgeColor} text-[10px] font-black">${r.triangleType}</span>
                  <strong class="text-slate-800 font-bold">${r.studentName || "학생"}</strong>
                  <span class="text-[10px] text-slate-400 font-mono">${r.createdDateStr || ""}</span>
                </div>
                <div class="text-[11px] text-slate-600 font-medium">
                  외심: <strong class="text-indigo-600">${r.circumLocation || "내부"}</strong> O(${r.circumcenter?.x || 0}, ${r.circumcenter?.y || 0}) 
                  | 내심: I(${r.incenter?.x || 0}, ${r.incenter?.y || 0})
                </div>
                <p class="text-[11px] text-slate-600 italic bg-white px-2 py-1 rounded shadow-sm">"${r.memo || "메모 없음"}"</p>
              </div>
              <div class="flex items-center gap-1 shrink-0 pt-1">
                <button class="btn-load-rec clay-btn clay-btn-primary px-2.5 py-1 text-[11px] font-bold text-white shadow-sm" data-id="${r.id}">
                  불러오기
                </button>
                <button class="btn-del-rec clay-btn clay-btn-secondary px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-50" data-id="${r.id}">
                  삭제
                </button>
              </div>
            </div>
          `;
        })
        .join("");

      if (window.lucide) lucide.createIcons();

      // 캔버스 복원 이벤트
      dbRecordsTable.querySelectorAll(".btn-load-rec").forEach((btn) => {
        btn.addEventListener("click", () => {
          const recId = btn.getAttribute("data-id");
          const target = records.find((r) => r.id === recId);
          if (target && target.vertices) {
            pts[0] = { ...target.vertices.A, name: "A" };
            pts[1] = { ...target.vertices.B, name: "B" };
            pts[2] = { ...target.vertices.C, name: "C" };
            draw();
            canvas.scrollIntoView({ behavior: "smooth", block: "center" });

            if (dbSaveToast) {
              dbSaveToast.innerHTML = '<i data-lucide="check-circle" class="w-3.5 h-3.5"></i> Supabase 기록을 캔버스에 복원했습니다!';
              dbSaveToast.classList.remove("hidden");
              setTimeout(() => dbSaveToast.classList.add("hidden"), 3000);
              if (window.lucide) lucide.createIcons();
            }
          }
        });
      });

      // 삭제 이벤트
      dbRecordsTable.querySelectorAll(".btn-del-rec").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const recId = btn.getAttribute("data-id");
          if (confirm("이 기록을 Supabase 데이터베이스에서 영구 삭제하시겠습니까?")) {
            await MathClayDB.deleteRecord(recId);
            await updateDbBadge();
            await renderDbRecordsList();
          }
        });
      });
    }
  },

  /* =========================================================================
   * 7. [중1 수와 연산] 에라토스테네스의 체 & 소인수분해 가지치기 트리
   * ========================================================================= */
  mountPrime(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "prime";

    let subMode = "sieve"; // "sieve" or "tree"
    let eliminated = new Set([1]);
    let targetNum = 60;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <button id="tabSieve" class="clay-btn active px-3.5 py-1.5 text-xs font-bold">1~100 에라토스테네스의 체</button>
            <button id="tabTree" class="clay-btn px-3.5 py-1.5 text-xs font-bold text-slate-600">소인수분해 가지치기 트리</button>
          </div>
          <div id="treeInputWrap" class="hidden flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700">자연수:</span>
            <input type="number" id="numInput" value="60" min="4" max="120" class="clay-inset px-2.5 py-1 w-20 text-xs font-mono font-bold text-center">
            <button id="btnFactorize" class="clay-btn clay-btn-primary px-3 py-1 text-xs font-bold text-white">분해하기</button>
          </div>
        </div>
        <div id="sieveButtons" class="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100">
          <button id="btnElim2" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-blue-700">2의 배수 지우기</button>
          <button id="btnElim3" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700">3의 배수 지우기</button>
          <button id="btnElim5" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-amber-700">5의 배수 지우기</button>
          <button id="btnElim7" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-rose-700">7의 배수 지우기</button>
          <button id="btnResetPrimes" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-slate-600">초기화</button>
        </div>
      </div>
    `;

    // 소인수분해 트리 생성 헬퍼
    function getFactorTree(n) {
      if (n <= 1) return { val: n, isPrime: false };
      for (let d = 2; d * d <= n; d++) {
        if (n % d === 0) {
          return {
            val: n,
            left: { val: d, isPrime: true },
            right: getFactorTree(n / d)
          };
        }
      }
      return { val: n, isPrime: true };
    }

    function getPrimeFactorsMap(n) {
      const map = {};
      let temp = n;
      for (let d = 2; d * d <= temp; d++) {
        while (temp % d === 0) {
          map[d] = (map[d] || 0) + 1;
          temp /= d;
        }
      }
      if (temp > 1) map[temp] = (map[temp] || 0) + 1;
      return map;
    }

    const draw = () => {
      if (SimulationEngine.currentSim !== "prime") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      if (subMode === "sieve") {
        // --- 1~100 격자 뷰 ---
        const cols = 10;
        const rows = 10;
        const cellW = width / cols;
        const cellH = height / rows;

        for (let i = 1; i <= 100; i++) {
          const col = (i - 1) % cols;
          const row = Math.floor((i - 1) / cols);
          const x = col * cellW;
          const y = row * cellH;

          const isOut = eliminated.has(i);
          const isPrimeCandidate = !isOut && i > 1;

          ctx.fillStyle = isPrimeCandidate ? "rgba(16, 185, 129, 0.25)" : isOut ? "#f8fafc" : "#ffffff";
          ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
          ctx.strokeStyle = isPrimeCandidate ? "#10b981" : "#e2e8f0";
          ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

          ctx.fillStyle = isPrimeCandidate ? "#047857" : isOut ? "#cbd5e1" : "#1e293b";
          ctx.font = isPrimeCandidate ? "bold 13px Pretendard" : "11px Pretendard";
          ctx.fillText(i, x + cellW / 2 - 8, y + cellH / 2 + 4);

          if (isOut) {
            ctx.beginPath();
            ctx.moveTo(x + 4, y + 4);
            ctx.lineTo(x + cellW - 4, y + cellH - 4);
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        if (infoEl) {
          const primeCount = 100 - eliminated.size;
          infoEl.innerHTML = `
            <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
              에라토스테네스의 체: 2, 3, 5, 7의 배수를 모두 지우면 100 이하의 모든 소수(<span class="text-emerald-600 font-black">${primeCount}개</span>)가 나타납니다!
            </div>
          `;
        }
      } else {
        // --- 소인수분해 가지치기 트리 뷰 ---
        const tree = getFactorTree(targetNum);
        const map = getPrimeFactorsMap(targetNum);

        // 지수 표기 포맷팅 (e.g. 2^2 × 3 × 5)
        const expStr = Object.keys(map)
          .map((base) => (map[base] > 1 ? `${base}<sup>${map[base]}</sup>` : base))
          .join(" × ");

        ctx.fillStyle = "#1e293b";
        ctx.font = "bold 14px Pretendard";
        ctx.fillText(`소인수분해 트리: ${targetNum}`, 30, 30);

        function drawNode(node, x, y, dx) {
          if (!node) return;

          // 자식 노드가 있으면 가지치기 선 먼저 그리기
          if (node.left && node.right) {
            const leftX = x - dx;
            const leftY = y + 55;
            const rightX = x + dx;
            const rightY = y + 55;

            ctx.strokeStyle = "#94a3b8";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + 14);
            ctx.lineTo(leftX, leftY - 14);
            ctx.moveTo(x, y + 14);
            ctx.lineTo(rightX, rightY - 14);
            ctx.stroke();

            drawNode(node.left, leftX, leftY, dx * 0.55);
            drawNode(node.right, rightX, rightY, dx * 0.55);
          }

          // 노드 원 그리기
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fillStyle = node.isPrime ? "#10b981" : "#4f46e5";
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 12px Pretendard";
          ctx.fillText(node.val, x - (node.val > 9 ? 8 : 4), y + 4);
        }

        drawNode(tree, width / 2, 65, 80);

        if (infoEl) {
          infoEl.innerHTML = `
            <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>수: <strong class="text-indigo-600">${targetNum}</strong></span>
              <span>거듭제곱 꼴 소인수분해 결과: <strong class="text-emerald-700 font-black text-base">${targetNum} = ${expStr}</strong></span>
              <span class="text-[11px] text-slate-500">(초록색 노드 = 소인수)</span>
            </div>
          `;
        }
      }
    };

    draw();

    const eliminateMultiples = (base) => {
      for (let i = base * 2; i <= 100; i += base) {
        eliminated.add(i);
      }
      draw();
    };

    document.getElementById("btnElim2").addEventListener("click", () => eliminateMultiples(2));
    document.getElementById("btnElim3").addEventListener("click", () => eliminateMultiples(3));
    document.getElementById("btnElim5").addEventListener("click", () => eliminateMultiples(5));
    document.getElementById("btnElim7").addEventListener("click", () => eliminateMultiples(7));
    document.getElementById("btnResetPrimes").addEventListener("click", () => {
      eliminated = new Set([1]);
      draw();
    });

    const tabSieve = document.getElementById("tabSieve");
    const tabTree = document.getElementById("tabTree");
    const sieveBtns = document.getElementById("sieveButtons");
    const treeWrap = document.getElementById("treeInputWrap");

    tabSieve.addEventListener("click", () => {
      subMode = "sieve";
      tabSieve.classList.add("active", "clay-btn-primary");
      tabTree.classList.remove("active", "clay-btn-primary");
      sieveBtns.classList.remove("hidden");
      treeWrap.classList.add("hidden");
      draw();
    });

    tabTree.addEventListener("click", () => {
      subMode = "tree";
      tabTree.classList.add("active", "clay-btn-primary");
      tabSieve.classList.remove("active", "clay-btn-primary");
      sieveBtns.classList.add("hidden");
      treeWrap.classList.remove("hidden");
      draw();
    });

    document.getElementById("btnFactorize").addEventListener("click", () => {
      const input = document.getElementById("numInput");
      const val = parseInt(input.value);
      if (val >= 2 && val <= 200) {
        targetNum = val;
        draw();
      }
    });
  },

  /* =========================================================================
   * 8. [중3 통계] 산점도 & 대푯값 시소 저울 (이상치에 따른 평균/중앙값 비교)
   * ========================================================================= */
  mountScatter(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "scatter";

    let points = [
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 5, y: 5 },
      { x: 6, y: 6 },
      { x: 7, y: 7 }
    ];

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <button id="btnPosCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-indigo-700">양의 상관관계</button>
            <button id="btnNegCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-rose-700">음의 상관관계</button>
            <button id="btnNoCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-slate-700">상관관계 없음</button>
          </div>
          <button id="btnAddOutlier" class="clay-btn clay-btn-coral px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
            극단값(이상치 x=9, y=10) 추가!
          </button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "scatter") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      // 상단 60%: 산점도 그래프
      const plotH = height * 0.58;
      const margin = 40;
      const plotW = width - margin * 2;

      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, plotH - 10);
      ctx.lineTo(width - margin, plotH - 10);
      ctx.moveTo(margin, 20);
      ctx.lineTo(margin, plotH - 10);
      ctx.stroke();

      ctx.font = "bold 11px Pretendard";
      ctx.fillStyle = "#64748b";
      ctx.fillText("공부 시간 (x)", width - margin - 75, plotH + 8);
      ctx.fillText("성적 (y)", margin - 15, 16);

      // 데이터 점 렌더링
      points.forEach((pt) => {
        const px = margin + (pt.x / 10) * plotW;
        const py = plotH - 10 - (pt.y / 10) * (plotH - 30);

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#6366f1";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // --- 하단 40%: 대푯값 시소 저울 시뮬레이터 (Seesaw) ---
      const seesawY = height * 0.84;
      const fulcrumX = width / 2;
      const seesawLen = width * 0.7;

      // 평균 & 중앙값 계산
      const yValues = points.map((p) => p.y).sort((a, b) => a - b);
      const mean = yValues.reduce((sum, v) => sum + v, 0) / yValues.length;
      const mid = Math.floor(yValues.length / 2);
      const median = yValues.length % 2 === 0 ? (yValues[mid - 1] + yValues[mid]) / 2 : yValues[mid];

      // 시소 받침대 삼각형
      ctx.beginPath();
      ctx.moveTo(fulcrumX, seesawY);
      ctx.lineTo(fulcrumX - 16, seesawY + 30);
      ctx.lineTo(fulcrumX + 16, seesawY + 30);
      ctx.closePath();
      ctx.fillStyle = "#64748b";
      ctx.fill();

      // 시소 널판지 (평균 편차에 따른 시각적 밸런스)
      const tiltAngle = Math.max(-0.25, Math.min(0.25, (mean - 5) * 0.05));
      ctx.save();
      ctx.translate(fulcrumX, seesawY);
      ctx.rotate(tiltAngle);

      ctx.fillStyle = "#334155";
      ctx.fillRect(-seesawLen / 2, -5, seesawLen, 10);

      // 시소 위의 평균(Mean) 빨간 추 위치
      const meanPos = ((mean - 5) / 5) * (seesawLen * 0.45);
      ctx.beginPath();
      ctx.arc(meanPos, -15, 12, 0, Math.PI * 2);
      ctx.fillStyle = "#e11d48";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#e11d48";
      ctx.font = "bold 11px Pretendard";
      ctx.fillText(`평균: ${mean.toFixed(1)}`, meanPos - 22, -32);

      // 시소 위의 중앙값(Median) 파란 깃발 위치
      const medianPos = ((median - 5) / 5) * (seesawLen * 0.45);
      ctx.beginPath();
      ctx.arc(medianPos, -12, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#3b82f6";
      ctx.fill();
      ctx.fillStyle = "#1d4ed8";
      ctx.fillText(`중앙값: ${median.toFixed(1)}`, medianPos - 26, 26);

      ctx.restore();

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>자료 ${points.length}개</span>
            <span>평균(Mean): <strong class="text-rose-600 font-black">${mean.toFixed(2)}</strong></span>
            <span>중앙값(Median): <strong class="text-blue-600 font-black">${median.toFixed(2)}</strong></span>
            <span class="text-[11px] text-slate-500">화면을 클릭해 점을 추가해보세요!</span>
          </div>
        `;
      }
    };

    draw();

    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const margin = 40;
      const plotH = rect.height * 0.58;
      const plotW = rect.width - margin * 2;

      const clickX = e.clientX - rect.left - margin;
      const clickY = plotH - 10 - (e.clientY - rect.top);

      if (clickX >= 0 && clickX <= plotW && clickY >= 0 && clickY <= plotH - 30) {
        const x = parseFloat(((clickX / plotW) * 10).toFixed(1));
        const y = parseFloat(((clickY / (plotH - 30)) * 10).toFixed(1));
        points.push({ x, y });
        draw();
      }
    };

    document.getElementById("btnPosCorr").addEventListener("click", () => {
      points = [
        { x: 1, y: 2 },
        { x: 2, y: 3 },
        { x: 3, y: 3.5 },
        { x: 4, y: 5 },
        { x: 5, y: 6 },
        { x: 7, y: 7 },
        { x: 8, y: 8.5 },
        { x: 9, y: 9 }
      ];
      draw();
    });

    document.getElementById("btnNegCorr").addEventListener("click", () => {
      points = [
        { x: 1, y: 9 },
        { x: 2, y: 8 },
        { x: 3, y: 7 },
        { x: 5, y: 5 },
        { x: 6, y: 4.5 },
        { x: 7, y: 3 },
        { x: 8, y: 2 },
        { x: 9, y: 1.5 }
      ];
      draw();
    });

    document.getElementById("btnNoCorr").addEventListener("click", () => {
      points = [
        { x: 2, y: 8 },
        { x: 2, y: 2 },
        { x: 5, y: 5 },
        { x: 5, y: 9 },
        { x: 8, y: 3 },
        { x: 8, y: 7 }
      ];
      draw();
    });

    document.getElementById("btnAddOutlier").addEventListener("click", () => {
      points.push({ x: 9, y: 10 });
      draw();
    });
  }
};
