/**
 * MathClay Junior - 8가지 중학교 수학 시뮬레이션 인터랙티브 엔진
 */

const SimulationEngine = {
  currentSim: null,
  animId: null,

  // 공통 캔버스 리사이즈 헬퍼
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
  },

  /* =========================================================================
   * 1. [중2 기하] 피타고라스 정리 (물 채우기 & 넓이 보존 증명)
   * ========================================================================= */
  mountPythagoras(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "pythagoras";

    let a = 3;
    let b = 4;
    let liquidProgress = 0; // 0 ~ 1
    let isPouring = false;

    // 컨트롤 UI 생성
    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-16">밑변 a = <strong id="valA" class="text-indigo-600 font-mono">3</strong></span>
            <input type="range" id="sliderA" min="2" max="5" value="3" step="1" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-3 text-xs font-bold text-slate-700">
            <span class="w-16">높이 b = <strong id="valB" class="text-emerald-600 font-mono">4</strong></span>
            <input type="range" id="sliderB" min="2" max="5" value="4" step="1" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <button id="btnPour" class="clay-btn clay-btn-primary px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="droplets" class="w-3.5 h-3.5"></i> 물 채우기 회전 증명
          </button>
          <button id="btnResetPyth" class="clay-btn clay-btn-secondary px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> 초기화
          </button>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const draw = () => {
      if (SimulationEngine.currentSim !== "pythagoras") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const c = Math.sqrt(a * a + b * b);
      const scale = Math.min(width, height) / 14;

      const originX = width * 0.38;
      const originY = height * 0.65;

      const pxA = a * scale;
      const pxB = b * scale;

      // 직각삼각형 꼭짓점
      const p0 = { x: originX, y: originY }; // 직각 꼭짓점
      const p1 = { x: originX + pxA, y: originY }; // 밑변 끝점
      const p2 = { x: originX, y: originY - pxB }; // 높이 끝점

      // 1. 밑변 정사각형 a^2
      const aFillRatio = Math.max(0, 1 - liquidProgress);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.15 + 0.6 * aFillRatio})`;
      ctx.strokeStyle = "#4f46e5";
      ctx.lineWidth = 2;
      ctx.fillRect(p0.x, p0.y, pxA, pxA * aFillRatio);
      ctx.strokeRect(p0.x, p0.y, pxA, pxA);

      ctx.fillStyle = "#4338ca";
      ctx.font = "bold 13px Pretendard";
      ctx.fillText(`a² = ${a * a}`, p0.x + pxA / 2 - 18, p0.y + pxA / 2 + 5);

      // 2. 높이 정사각형 b^2
      const bFillRatio = Math.max(0, 1 - liquidProgress);
      ctx.fillStyle = `rgba(16, 185, 129, ${0.15 + 0.6 * bFillRatio})`;
      ctx.strokeStyle = "#059669";
      ctx.fillRect(p0.x - pxB * bFillRatio, p2.y, pxB * bFillRatio, pxB);
      ctx.strokeRect(p0.x - pxB, p2.y, pxB, pxB);

      ctx.fillStyle = "#065f46";
      ctx.fillText(`b² = ${b * b}`, p0.x - pxB / 2 - 18, p2.y + pxB / 2 + 5);

      // 3. 빗변 정사각형 c^2 (회전된 사각형)
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x); // p1 -> p2 방향
      const pxC = c * scale;

      ctx.save();
      ctx.translate(p1.x, p1.y);
      ctx.rotate(angle);

      // 빗변 정사각형 채움 (물 채우기 비율)
      const cFill = liquidProgress;
      ctx.fillStyle = `rgba(244, 63, 94, ${0.15 + 0.65 * cFill})`;
      ctx.strokeStyle = "#e11d48";
      ctx.fillRect(0, -pxC * cFill, pxC, pxC * cFill);
      ctx.strokeRect(0, -pxC, pxC, pxC);

      ctx.fillStyle = "#9f1239";
      ctx.fillText(`c² = ${(c * c).toFixed(0)}`, pxC / 2 - 18, -pxC / 2);
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
      ctx.lineWidth = 3;
      ctx.stroke();

      // 직각 표시 기호
      const markSize = 12;
      ctx.beginPath();
      ctx.moveTo(p0.x + markSize, p0.y);
      ctx.lineTo(p0.x + markSize, p0.y - markSize);
      ctx.lineTo(p0.x, p0.y - markSize);
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2;
      ctx.stroke();

      // 변 길이 라벨
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 12px Pretendard";
      ctx.fillText(`a = ${a}`, (p0.x + p1.x) / 2 - 10, p0.y - 6);
      ctx.fillText(`b = ${b}`, p0.x + 6, (p0.y + p2.y) / 2 + 4);
      ctx.fillText(`c = ${c.toFixed(1)}`, (p1.x + p2.x) / 2 + 10, (p1.y + p2.y) / 2 - 4);

      // 정보 박스 업데이트
      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>a² (${a * a}) + b² (${b * b}) = <span class="text-rose-600 font-black">${a * a + b * b}</span></span>
            <span>c² = <span class="text-rose-600 font-black">${(c * c).toFixed(0)}</span> (c ≈ ${c.toFixed(2)})</span>
          </div>
        `;
      }

      if (isPouring) {
        liquidProgress += 0.02;
        if (liquidProgress >= 1) {
          liquidProgress = 1;
          isPouring = false;
        }
      }

      SimulationEngine.animId = requestAnimationFrame(draw);
    };

    draw();

    // 슬라이더 및 버튼 이벤트 바인딩
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
    });

    document.getElementById("btnResetPyth").addEventListener("click", () => {
      liquidProgress = 0;
      isPouring = false;
    });
  },

  /* =========================================================================
   * 2. [중2 함수] 일차함수 y = ax + b 탐구기 (직선 위 점 대입)
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
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "linear") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const unit = Math.min(width, height) / 12;

      // 모눈
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      for (let x = -6; x <= 6; x++) {
        ctx.beginPath();
        ctx.moveTo(centerX + x * unit, 0);
        ctx.lineTo(centerX + x * unit, height);
        ctx.stroke();
      }
      for (let y = -6; y <= 6; y++) {
        ctx.beginPath();
        ctx.moveTo(0, centerY - y * unit);
        ctx.lineTo(width, centerY - y * unit);
        ctx.stroke();
      }

      // 축
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

      // 탐구 점 (testX, testY)
      const testY = a * testX + b;
      const ptPxX = centerX + testX * unit;
      const ptPxY = centerY - testY * unit;

      // 점 가이드선
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ptPxX, centerY);
      ctx.lineTo(ptPxX, ptPxY);
      ctx.lineTo(centerX, ptPxY);
      ctx.stroke();
      ctx.setLineDash([]);

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

      // 정보
      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            직선의 방정식: <span class="text-indigo-600 font-black">y = ${a}x ${b >= 0 ? "+ " + b : "- " + Math.abs(b)}</span> 
            | 점 대입: x=${testX} 일 때 y = ${a}×(${testX}) ${b >= 0 ? "+" : ""}${b} = <span class="text-emerald-600 font-black">${testY.toFixed(1)}</span>
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
  },

  /* =========================================================================
   * 3. [중3 기하] 삼각비와 닮음 (각도 & 삼각형 크기 조작)
   * ========================================================================= */
  mountTrig(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "trig";

    let deg = 30;
    let sizeScale = 1.0; // 크기 확대/축소

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
          <span class="text-xs text-slate-500 font-semibold mr-1">특수각 빠른 설정:</span>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="30">30°</button>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="45">45°</button>
          <button class="btn-preset-deg clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-purple-700" data-deg="60">60°</button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "trig") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const rad = (deg * Math.PI) / 180;
      const baseLen = 180 * sizeScale;
      const heightLen = baseLen * Math.tan(rad);
      const hypLen = baseLen / Math.cos(rad);

      const pBase = { x: width * 0.18, y: height * 0.8 };
      const pRight = { x: pBase.x + baseLen, y: pBase.y };
      const pTop = { x: pBase.x + baseLen, y: pBase.y - heightLen };

      // 직각삼각형 채우기
      ctx.beginPath();
      ctx.moveTo(pBase.x, pBase.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pTop.x, pTop.y);
      ctx.closePath();
      ctx.fillStyle = "rgba(139, 92, 246, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "#7c3aed";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 각도 호
      ctx.beginPath();
      ctx.arc(pBase.x, pBase.y, 35, 0, -rad, true);
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = "#ec4899";
      ctx.font = "bold 12px Pretendard";
      ctx.fillText(`${deg}°`, pBase.x + 42, pBase.y - 12);

      // 변 길이 라벨
      ctx.font = "bold 11px Pretendard";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(`밑변: ${(baseLen / 30).toFixed(1)}`, (pBase.x + pRight.x) / 2 - 15, pBase.y + 18);
      ctx.fillText(`높이: ${(heightLen / 30).toFixed(1)}`, pRight.x + 10, (pRight.y + pTop.y) / 2);
      ctx.fillText(`빗변: ${(hypLen / 30).toFixed(1)}`, (pBase.x + pTop.x) / 2 - 35, (pBase.y + pTop.y) / 2 - 10);

      const sinV = Math.sin(rad).toFixed(3);
      const cosV = Math.cos(rad).toFixed(3);
      const tanV = Math.tan(rad).toFixed(3);

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="grid grid-cols-3 gap-2 font-mono text-xs sm:text-sm font-bold text-center">
            <div class="clay-inset p-2 rounded-xl bg-purple-50">sin ${deg}° = <span class="text-purple-700 font-black">${sinV}</span></div>
            <div class="clay-inset p-2 rounded-xl bg-indigo-50">cos ${deg}° = <span class="text-indigo-700 font-black">${cosV}</span></div>
            <div class="clay-inset p-2 rounded-xl bg-pink-50">tan ${deg}° = <span class="text-pink-700 font-black">${tanV}</span></div>
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
   * 4. [중3 함수] 이차함수 y = a(x - p)^2 + q (농구공 슛 궤적)
   * ========================================================================= */
  mountQuadratic(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "quadratic";

    let a = -0.5;
    let p = 2;
    let q = 3;
    let ballX = -4;
    let isShooting = false;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>폭 a: <strong id="quadAVal" class="text-rose-600 font-mono">-0.5</strong></span>
            <input type="range" id="quadASlider" min="-1.5" max="1.5" step="0.25" value="-0.5" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>꼭짓점 p: <strong id="quadPVal" class="text-indigo-600 font-mono">2</strong></span>
            <input type="range" id="quadPSlider" min="-4" max="4" step="1" value="2" class="clay-slider flex-1">
          </div>
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>꼭짓점 q: <strong id="quadQVal" class="text-emerald-600 font-mono">3</strong></span>
            <input type="range" id="quadQSlider" min="-3" max="5" step="1" value="3" class="clay-slider flex-1">
          </div>
        </div>
        <div class="flex items-center justify-between pt-1 border-t border-slate-100">
          <button id="btnShootBall" class="clay-btn clay-btn-coral px-4 py-2 text-xs font-bold text-white flex items-center gap-1.5">
            <i data-lucide="play" class="w-3.5 h-3.5"></i> 농구공 궤적 슛 발사!
          </button>
          <span class="text-xs text-slate-500 font-semibold">대칭축: <strong class="text-indigo-600 font-mono">x = ${p}</strong></span>
        </div>
      </div>
    `;
    if (window.lucide) lucide.createIcons();

    const draw = () => {
      if (SimulationEngine.currentSim !== "quadratic") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height * 0.65;
      const unit = Math.min(width, height) / 14;

      // 축
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // 포물선 그리기
      ctx.beginPath();
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 3;

      for (let x = -7; x <= 7; x += 0.1) {
        const y = a * Math.pow(x - p, 2) + q;
        const px = centerX + x * unit;
        const py = centerY - y * unit;
        if (x === -7) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 대칭축 x = p
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 2;
      ctx.moveTo(centerX + p * unit, 0);
      ctx.lineTo(centerX + p * unit, height);
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
      ctx.fillText(`꼭짓점 (${p}, ${q})`, vX + 10, vY - 8);

      // 날아가는 농구공 애니메이션
      if (isShooting) {
        const currentY = a * Math.pow(ballX - p, 2) + q;
        const bPxX = centerX + ballX * unit;
        const bPxY = centerY - currentY * unit;

        ctx.beginPath();
        ctx.arc(bPxX, bPxY, 10, 0, Math.PI * 2);
        ctx.fillStyle = "#f97316";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ballX += 0.15;
        if (ballX > 7) {
          isShooting = false;
          ballX = -4;
        }
      }

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            이차함수 표준형: <span class="text-rose-600 font-black">y = ${a}(x - ${p})² + ${q}</span>
            | ${a < 0 ? "위로 볼록 (최댓값 " + q + ")" : "아래로 볼록 (최솟값 " + q + ")"}
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
      if (a === 0) a = 0.1;
      document.getElementById("quadAVal").textContent = a.toFixed(2);
      draw();
    });

    document.getElementById("quadPSlider").addEventListener("input", (e) => {
      p = parseInt(e.target.value);
      document.getElementById("quadPVal").textContent = p;
      draw();
    });

    document.getElementById("quadQSlider").addEventListener("input", (e) => {
      q = parseInt(e.target.value);
      document.getElementById("quadQVal").textContent = q;
      draw();
    });

    document.getElementById("btnShootBall").addEventListener("click", () => {
      ballX = -4;
      isShooting = true;
      draw();
    });
  },

  /* =========================================================================
   * 5. [중1 기하] 입체도형 회전체와 전개도
   * ========================================================================= */
  mountSolid(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "solid";

    let shape = "cylinder"; // cylinder, cone, sphere
    let rotAngle = 0; // 0 ~ 360
    let isSpinning = false;

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <button class="btn-solid-tab clay-btn active px-3.5 py-1.5 text-xs font-bold" data-shape="cylinder">원기둥 (직사각형)</button>
          <button class="btn-solid-tab clay-btn px-3.5 py-1.5 text-xs font-bold" data-shape="cone">원뿔 (직각삼각형)</button>
          <button class="btn-solid-tab clay-btn px-3.5 py-1.5 text-xs font-bold" data-shape="sphere">구 (반원)</button>
        </div>
        <div class="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-700 flex-1">
            <span>회전각: <strong id="rotAngleVal" class="text-emerald-600 font-mono">0°</strong></span>
            <input type="range" id="rotAngleSlider" min="0" max="360" value="0" class="clay-slider flex-1">
          </div>
          <button id="btnSpinSolid" class="clay-btn clay-btn-primary px-3 py-1.5 text-xs font-bold text-white">
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

      // 회전축
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

      const r = 90;
      const h = 140;

      // 3D 회전체 표면 윤곽 렌더링
      const rad = (rotAngle * Math.PI) / 180;
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2.5;

      if (shape === "cylinder") {
        // 직사각형이 회전한 원기둥
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - h / 2, r * Math.sin(rad), 20, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX, centerY + h / 2, r * Math.sin(rad), 20, 0, 0, Math.PI * 2);
        ctx.rect(centerX, centerY - h / 2, r * Math.cos(rad), h);
        ctx.fill();
        ctx.stroke();

        // 2D 단면
        ctx.fillStyle = "rgba(99, 102, 241, 0.4)";
        ctx.fillRect(centerX, centerY - h / 2, r, h);
        ctx.strokeRect(centerX, centerY - h / 2, r, h);
      } else if (shape === "cone") {
        // 직각삼각형이 회전한 원뿔
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - h / 2);
        ctx.lineTo(centerX + r * Math.cos(rad), centerY + h / 2);
        ctx.lineTo(centerX - r * Math.cos(rad), centerY + h / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.ellipse(centerX, centerY + h / 2, r * Math.abs(Math.sin(rad)), 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2D 단면
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - h / 2);
        ctx.lineTo(centerX + r, centerY + h / 2);
        ctx.lineTo(centerX, centerY + h / 2);
        ctx.closePath();
        ctx.fillStyle = "rgba(99, 102, 241, 0.4)";
        ctx.fill();
        ctx.stroke();
      } else {
        // 반원이 회전한 구
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r, r * Math.abs(Math.sin(rad)), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            평면도형 1회전 → <span class="text-emerald-700 font-black">${shape === "cylinder" ? "직사각형 → 원기둥" : shape === "cone" ? "직각삼각형 → 원뿔" : "반원 → 구"}</span> 
            | 회전축을 포함하는 평면으로 자른 단면은 항상 <span class="text-indigo-600 font-bold">선대칭도형</span>입니다.
          </div>
        `;
      }

      if (isSpinning) {
        rotAngle = (rotAngle + 4) % 360;
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
      if (isSpinning) draw();
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
   * 6. [중2 기하] 삼각형의 외심과 내심 실시간 작도기 (점 드래그)
   * ========================================================================= */
  mountIncenter(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "incenter";

    let pts = [
      { x: 180, y: 70, name: "A" },
      { x: 70, y: 240, name: "B" },
      { x: 320, y: 240, name: "C" }
    ];
    let draggedPt = null;
    let showCircum = true; // 외심
    let showIn = true; // 내심

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-4 text-xs font-bold text-slate-700">
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="chkCircum" checked class="rounded text-indigo-600">
              <span class="text-indigo-700">외심 (O) & 외접원</span>
            </label>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" id="chkIncenter" checked class="rounded text-rose-600">
              <span class="text-rose-700">내심 (I) & 내접원</span>
            </label>
          </div>
          <div class="flex items-center gap-1.5">
            <button id="btnAcute" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold">예각</button>
            <button id="btnRight" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-indigo-700">직각(빗변중점)</button>
            <button id="btnObtuse" class="clay-btn clay-btn-secondary px-3 py-1 text-xs font-bold text-amber-700">둔각(외부)</button>
          </div>
        </div>
      </div>
    `;

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
      ctx.fillStyle = "rgba(241, 245, 249, 0.6)";
      ctx.fill();
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 3;
      ctx.stroke();

      // 변 길이
      const a = Math.hypot(B.x - C.x, B.y - C.y);
      const b = Math.hypot(A.x - C.x, A.y - C.y);
      const c = Math.hypot(A.x - B.x, A.y - B.y);

      // 내심 계산: (a*A + b*B + c*C) / (a + b + c)
      const p = a + b + c;
      const inX = (a * A.x + b * B.x + c * C.x) / p;
      const inY = (a * A.y + b * B.y + c * C.y) / p;
      // 내접원 반지름: s = p/2, Area = sqrt(s(s-a)(s-b)(s-c)), r = Area / s
      const s = p / 2;
      const area = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
      const inR = area / s;

      // 외심 계산
      const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
      const circumX =
        ((A.x ** 2 + A.y ** 2) * (B.y - C.y) +
          (B.x ** 2 + B.y ** 2) * (C.y - A.y) +
          (C.x ** 2 + C.y ** 2) * (A.y - B.y)) /
        d;
      const circumY =
        ((A.x ** 2 + A.y ** 2) * (C.x - B.x) +
          (B.x ** 2 + B.y ** 2) * (A.x - C.x) +
          (C.x ** 2 + C.y ** 2) * (B.x - A.x)) /
        d;
      const circumR = Math.hypot(A.x - circumX, A.y - circumY);

      // 외심 & 외접원 렌더링
      if (showCircum && Math.abs(d) > 0.01) {
        ctx.beginPath();
        ctx.arc(circumX, circumY, circumR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(79, 70, 229, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(circumX, circumY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#4f46e5";
        ctx.fill();
        ctx.fillText("외심 O", circumX + 8, circumY - 4);
      }

      // 내심 & 내접원 렌더링
      if (showIn && inR > 0) {
        ctx.beginPath();
        ctx.arc(inX, inY, inR, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(225, 29, 72, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(inX, inY, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#e11d48";
        ctx.fill();
        ctx.fillText("내심 I", inX + 8, inY - 4);
      }

      // 꼭짓점 A, B, C 표시 (드래그 가능 핸들)
      pts.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.strokeStyle = "#059669";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#065f46";
        ctx.font = "bold 13px Pretendard";
        ctx.fillText(pt.name, pt.x - 4, pt.y - 12);
      });

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            꼭짓점을 마우스로 드래그해보세요! | 
            <span class="text-indigo-600">외심: 세 변의 수직이등분선의 교점</span> | 
            <span class="text-rose-600">내심: 세 내각의 이등분선의 교점</span>
          </div>
        `;
      }
    };

    draw();

    // 드래그 마우스 이벤트 바인딩
    canvas.onmousedown = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      pts.forEach((pt) => {
        if (Math.hypot(pt.x - mouseX, pt.y - mouseY) < 20) {
          draggedPt = pt;
        }
      });
    };

    window.onmousemove = (e) => {
      if (!draggedPt) return;
      const rect = canvas.getBoundingClientRect();
      draggedPt.x = Math.max(30, Math.min(rect.width - 30, e.clientX - rect.left));
      draggedPt.y = Math.max(30, Math.min(rect.height - 30, e.clientY - rect.top));
      draw();
    };

    window.onmouseup = () => {
      draggedPt = null;
    };

    document.getElementById("chkCircum").addEventListener("change", (e) => {
      showCircum = e.target.checked;
      draw();
    });

    document.getElementById("chkIncenter").addEventListener("change", (e) => {
      showIn = e.target.checked;
      draw();
    });

    document.getElementById("btnAcute").addEventListener("click", () => {
      pts[0] = { x: 200, y: 60, name: "A" };
      pts[1] = { x: 80, y: 240, name: "B" };
      pts[2] = { x: 320, y: 240, name: "C" };
      draw();
    });

    document.getElementById("btnRight").addEventListener("click", () => {
      pts[0] = { x: 80, y: 80, name: "A" };
      pts[1] = { x: 80, y: 240, name: "B" };
      pts[2] = { x: 320, y: 240, name: "C" };
      draw();
    });

    document.getElementById("btnObtuse").addEventListener("click", () => {
      pts[0] = { x: 300, y: 180, name: "A" };
      pts[1] = { x: 60, y: 240, name: "B" };
      pts[2] = { x: 340, y: 240, name: "C" };
      draw();
    });
  },

  /* =========================================================================
   * 7. [중1 수와 연산] 에라토스테네스의 체 & 소인수분해 트리
   * ========================================================================= */
  mountPrime(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "prime";

    // 1부터 100까지 격자 생성
    let eliminated = new Set([1]); // 1은 소수가 아님

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <button id="btnElim2" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-blue-700">2의 배수 지우기</button>
          <button id="btnElim3" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-purple-700">3의 배수 지우기</button>
          <button id="btnElim5" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-amber-700">5의 배수 지우기</button>
          <button id="btnElim7" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-rose-700">7의 배수 지우기</button>
          <button id="btnResetPrimes" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-slate-600">초기화</button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "prime") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

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

        ctx.fillStyle = isPrimeCandidate ? "rgba(16, 185, 129, 0.2)" : isOut ? "#f1f5f9" : "#ffffff";
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);
        ctx.strokeStyle = isPrimeCandidate ? "#10b981" : "#cbd5e1";
        ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.fillStyle = isPrimeCandidate ? "#047857" : isOut ? "#94a3b8" : "#1e293b";
        ctx.font = isPrimeCandidate ? "bold 13px Pretendard" : "11px Pretendard";
        ctx.fillText(i, x + cellW / 2 - 8, y + cellH / 2 + 4);

        if (isOut) {
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + cellW - 4, y + cellH - 4);
          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      if (infoEl) {
        const primeCount = 100 - eliminated.size;
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800">
            소수란 1보다 큰 자연수 중 1과 자기 자신만을 약수로 가지는 수 | 남은 소수 후보: <span class="text-emerald-600 font-black">${primeCount}개</span>
          </div>
        `;
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
  },

  /* =========================================================================
   * 8. [중3 통계] 산점도와 상관관계 & 대푯값 저울
   * ========================================================================= */
  mountScatter(canvas, controlsEl, infoEl) {
    this.stop();
    this.currentSim = "scatter";

    let points = [
      { x: 2, y: 3 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 6, y: 7 },
      { x: 8, y: 9 }
    ];

    controlsEl.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <button id="btnPosCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-indigo-700">양의 상관관계</button>
            <button id="btnNegCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-rose-700">음의 상관관계</button>
            <button id="btnNoCorr" class="clay-btn clay-btn-secondary px-3 py-1.5 text-xs font-bold text-slate-700">상관관계 없음</button>
          </div>
          <button id="btnAddOutlier" class="clay-btn clay-btn-coral px-3 py-1.5 text-xs font-bold text-white">
            극단값(이상치) 추가
          </button>
        </div>
      </div>
    `;

    const draw = () => {
      if (SimulationEngine.currentSim !== "scatter") return;
      const { ctx, width, height } = this.setupCanvas(canvas);

      ctx.clearRect(0, 0, width, height);

      const margin = 40;
      const plotW = width - margin * 2;
      const plotH = height - margin * 2;

      // 축
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(margin, height - margin);
      ctx.lineTo(width - margin, height - margin);
      ctx.moveTo(margin, margin);
      ctx.lineTo(margin, height - margin);
      ctx.stroke();

      ctx.font = "bold 11px Pretendard";
      ctx.fillStyle = "#64748b";
      ctx.fillText("수학 공부 시간 (x)", width - margin - 80, height - margin + 25);
      ctx.fillText("시험 성적 (y)", margin - 15, margin - 12);

      // 점 렌더링
      points.forEach((pt) => {
        const px = margin + (pt.x / 10) * plotW;
        const py = height - margin - (pt.y / 10) * plotH;

        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#6366f1";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 평균 & 중앙값 계산
      const yValues = points.map((p) => p.y).sort((a, b) => a - b);
      const mean = (yValues.reduce((sum, v) => sum + v, 0) / yValues.length).toFixed(1);
      const mid = Math.floor(yValues.length / 2);
      const median = (yValues.length % 2 === 0 ? (yValues[mid - 1] + yValues[mid]) / 2 : yValues[mid]).toFixed(1);

      if (infoEl) {
        infoEl.innerHTML = `
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
            <span>자료 개수: ${points.length}개</span>
            <span>평균(Mean): <strong class="text-rose-600 font-black">${mean}</strong></span>
            <span>중앙값(Median): <strong class="text-indigo-600 font-black">${median}</strong></span>
          </div>
        `;
      }
    };

    draw();

    // 캔버스 클릭 시 사용자 데이터 점 추가
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const margin = 40;
      const plotW = rect.width - margin * 2;
      const plotH = rect.height - margin * 2;

      const clickX = e.clientX - rect.left - margin;
      const clickY = rect.height - margin - (e.clientY - rect.top);

      if (clickX >= 0 && clickX <= plotW && clickY >= 0 && clickY <= plotH) {
        const x = (clickX / plotW) * 10;
        const y = (clickY / plotH) * 10;
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
      // 이상치 추가: x=1인데 y=10 (극단적 천재)
      points.push({ x: 1, y: 10 });
      draw();
    });
  }
};
