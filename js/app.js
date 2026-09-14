/**
 * MathClay Junior - 중학교 수학 교사용 인터랙티브 시뮬레이션 플랫폼
 */

document.addEventListener("DOMContentLoaded", () => {
  initLinearFunctionSim();
  initCategoryFilter();
  initSearch();
  initMobileMenu();
  initSimulationModal();
  initDiceSimulation();
});

/* -------------------------------------------------------------
 * 1. 히어로 인터랙티브 시뮬레이션: 일차함수 y = ax + b 기울기 & 절편 탐구기
 * ------------------------------------------------------------- */
function initLinearFunctionSim() {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const aSlider = document.getElementById("slopeSlider");
  const bSlider = document.getElementById("interceptSlider");
  const formulaDisplay = document.getElementById("functionFormula");
  const slopeValText = document.getElementById("slopeValueText");
  const interceptValText = document.getElementById("interceptValueText");
  const autoAnimateBtn = document.getElementById("autoAnimateBtn");

  let a = 1.0;
  let b = 0.0;
  let isAnimating = false;
  let animDir = 0.02;
  let animFrameId = null;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    draw();
  }

  window.addEventListener("resize", resize);

  function draw() {
    const width = canvas.getBoundingClientRect().width;
    const height = canvas.getBoundingClientRect().height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const unit = Math.min(width, height) / 11;

    // 모눈종이
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    for (let x = -6; x <= 6; x++) {
      const px = centerX + x * unit;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    for (let y = -6; y <= 6; y++) {
      const py = centerY - y * unit;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // X, Y 축
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // 일차함수 직선
    const xMin = -6;
    const xMax = 6;
    const yAtMin = a * xMin + b;
    const yAtMax = a * xMax + b;

    ctx.beginPath();
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.moveTo(centerX + xMin * unit, centerY - yAtMin * unit);
    ctx.lineTo(centerX + xMax * unit, centerY - yAtMax * unit);
    ctx.stroke();

    // 기울기 삼각형
    if (Math.abs(a) >= 0.1) {
      const startX = centerX;
      const startY = centerY - b * unit;
      const cornerX = centerX + 1 * unit;
      const cornerY = startY;
      const endY = centerY - (a * 1 + b) * unit;

      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 2;
      ctx.moveTo(startX, startY);
      ctx.lineTo(cornerX, cornerY);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = a > 0 ? "#e11d48" : "#2563eb";
      ctx.moveTo(cornerX, cornerY);
      ctx.lineTo(cornerX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // y절편 점
    const interceptY = centerY - b * unit;
    ctx.beginPath();
    ctx.arc(centerX, interceptY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#e11d48";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    updateFormulaText();
  }

  function updateFormulaText() {
    let aStr = "";
    if (a === 1) aStr = "x";
    else if (a === -1) aStr = "-x";
    else if (a === 0) aStr = "";
    else aStr = `${a.toFixed(1)}x`;

    let bStr = "";
    if (b > 0) {
      bStr = aStr === "" ? `${b.toFixed(1)}` : ` + ${b.toFixed(1)}`;
    } else if (b < 0) {
      bStr = aStr === "" ? `${b.toFixed(1)}` : ` - ${Math.abs(b).toFixed(1)}`;
    } else {
      if (aStr === "") bStr = "0";
    }

    const fullFormula = `y = ${aStr}${bStr}`;
    if (formulaDisplay) formulaDisplay.textContent = fullFormula;
    if (slopeValText) slopeValText.textContent = `a = ${a.toFixed(1)}`;
    if (interceptValText) interceptValText.textContent = `b = ${b.toFixed(1)}`;
  }

  if (aSlider) {
    aSlider.addEventListener("input", (e) => {
      isAnimating = false;
      if (autoAnimateBtn) autoAnimateBtn.classList.remove("bg-indigo-600", "text-white");
      a = parseFloat(e.target.value);
      draw();
    });
  }

  if (bSlider) {
    bSlider.addEventListener("input", (e) => {
      isAnimating = false;
      b = parseFloat(e.target.value);
      draw();
    });
  }

  if (autoAnimateBtn) {
    autoAnimateBtn.addEventListener("click", () => {
      isAnimating = !isAnimating;
      if (isAnimating) {
        autoAnimateBtn.classList.add("bg-indigo-600", "text-white");
        animateLoop();
      } else {
        autoAnimateBtn.classList.remove("bg-indigo-600", "text-white");
        cancelAnimationFrame(animFrameId);
      }
    });
  }

  function animateLoop() {
    if (!isAnimating) return;
    a += animDir;
    if (a > 2.5) {
      a = 2.5;
      animDir = -0.02;
    } else if (a < -2.5) {
      a = -2.5;
      animDir = 0.02;
    }
    if (aSlider) aSlider.value = a.toFixed(1);
    draw();
    animFrameId = requestAnimationFrame(animateLoop);
  }

  setTimeout(resize, 50);
}

/* -------------------------------------------------------------
 * 2. 카테고리 필터링 (중1, 중2, 중3, 기하, 함수, 확률통계)
 * ------------------------------------------------------------- */
function initCategoryFilter() {
  const filterBtns = document.querySelectorAll(".clay-filter-btn");
  const cards = document.querySelectorAll(".sim-card");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");

      cards.forEach((card) => {
        const grade = card.getAttribute("data-grade");
        const domain = card.getAttribute("data-domain");

        const matches = 
          filter === "all" || 
          filter === grade || 
          filter === domain;

        if (matches) {
          card.style.display = "flex";
          setTimeout(() => {
            card.style.opacity = "1";
            card.style.transform = "translateY(0) scale(1)";
          }, 10);
        } else {
          card.style.opacity = "0";
          card.style.transform = "scale(0.95)";
          setTimeout(() => {
            card.style.display = "none";
          }, 200);
        }
      });
    });
  });
}

/* -------------------------------------------------------------
 * 3. 검색 및 키보드 단축키 (Ctrl+K)
 * ------------------------------------------------------------- */
function initSearch() {
  const searchInput = document.getElementById("simSearchInput");
  const cards = document.querySelectorAll(".sim-card");
  const noResult = document.getElementById("noSearchResult");

  if (!searchInput) return;

  function filterBySearch() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const title = card.querySelector(".sim-title")?.textContent.toLowerCase() || "";
      const desc = card.querySelector(".sim-desc")?.textContent.toLowerCase() || "";
      const tags = card.getAttribute("data-tags")?.toLowerCase() || "";
      const curriculum = card.querySelector(".sim-curriculum")?.textContent.toLowerCase() || "";

      if (title.includes(query) || desc.includes(query) || tags.includes(query) || curriculum.includes(query)) {
        card.style.display = "flex";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    if (noResult) {
      if (visibleCount === 0) {
        noResult.classList.remove("hidden");
      } else {
        noResult.classList.add("hidden");
      }
    }
  }

  searchInput.addEventListener("input", filterBySearch);

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });
}

/* -------------------------------------------------------------
 * 4. 모바일 네비게이션 드로어
 * ------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const mobileMenu = document.getElementById("mobileMenuDrawer");

  if (!toggleBtn || !mobileMenu) return;

  toggleBtn.addEventListener("click", () => {
    const isOpen = !mobileMenu.classList.contains("hidden");
    if (isOpen) {
      mobileMenu.classList.add("hidden");
    } else {
      mobileMenu.classList.remove("hidden");
    }
  });
}

/* -------------------------------------------------------------
 * 5. 중학 교구 실시간 인터랙티브 조작 스튜디오 모달
 * ------------------------------------------------------------- */
function initSimulationModal() {
  const modal = document.getElementById("simModal");
  const modalClose = document.getElementById("modalCloseBtn");
  const modalTitle = document.getElementById("modalTitle");
  const modalDesc = document.getElementById("modalDesc");
  const modalGrade = document.getElementById("modalGrade");
  const modalCanvas = document.getElementById("modalStudioCanvas");
  const modalControls = document.getElementById("modalStudioControls");
  const modalInfo = document.getElementById("modalStudioInfo");
  const modalPoint = document.getElementById("modalTeachingPoint");
  const runButtons = document.querySelectorAll(".btn-run-sim");
  const simCards = document.querySelectorAll(".sim-card");

  if (!modal || !modalCanvas) return;

  const middleSimData = {
    pythagoras: {
      title: "피타고라스 정리: 물 채우기 & 직각삼각형 넓이 증명",
      grade: "중2-2 기하",
      desc: "두 직각변 위에 세운 정사각형의 넓이의 합(a² + b²)이 빗변 위의 정사각형 넓이(c²)와 완벽히 같음을 시각적으로 회전하며 물을 채우거나 퍼즐을 맞추는 방식으로 증명합니다.",
      teachingPoint: "공식 유도 전, 면적(넓이) 보존 개념을 직관적으로 확인시켜 학생들의 기하학적 이해도를 극대화합니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountPythagoras(c, ctrl, inf)
    },
    linear: {
      title: "일차함수 y = ax + b 기울기와 절편 탐구기",
      grade: "중2-1 함수",
      desc: "슬라이더를 통해 기울기 a의 부호(우상향, 우하향)와 절댓값에 따른 경사도, y절편 b에 따른 y축 평행이동의 원리를 실시간 좌표평면에서 탐구합니다.",
      teachingPoint: "기울기 정의(증가량의 비율)와 점 (x, y) 대입 성립의 의미를 직접 조작하며 확인시킵니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountLinear(c, ctrl, inf)
    },
    trig: {
      title: "삼각비(sin, cos, tan)와 직각삼각형 닮음비",
      grade: "중3-2 기하",
      desc: "직각삼각형의 크기가 아무리 커지거나 작아져도 각도 A가 일정하면 세 변의 길이의 비는 변하지 않는다는 삼각비의 불변성을 조작하며 배웁니다.",
      teachingPoint: "닮은 도형의 성질과 삼각비의 정의를 연결하여, 특수각 30°, 45°, 60°의 값을 자연스럽게 체득하게 합니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountTrig(c, ctrl, inf)
    },
    quadratic: {
      title: "이차함수 y = a(x - p)² + q 포물선과 꼭짓점 이동",
      grade: "중3-1 함수",
      desc: "기본형 y = ax²에서 출발하여 x축 방향으로 p만큼, y축 방향으로 q만큼 평행이동했을 때 꼭짓점과 축이 어떻게 변하는지 슬라이더로 추적합니다.",
      teachingPoint: "농구공의 슛 궤적을 쏘아보며, 실생활 속 이차함수의 활용과 대칭축의 의미를 직관적으로 전달합니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountQuadratic(c, ctrl, inf)
    },
    solid: {
      title: "입체도형(원기둥·원뿔·구)의 회전체와 전개도",
      grade: "중1-2 기하",
      desc: "평면도형을 회전축을 중심으로 1회전 시켰을 때 생기는 회전체(원기둥, 원뿔, 구)를 360° 회전시켜보고 3D 단면을 관찰합니다.",
      teachingPoint: "공간 지각력이 부족한 중1 학생들이 입체도형의 단면과 겉넓이 공식을 외우지 않고 회전으로 이해할 수 있습니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountSolid(c, ctrl, inf)
    },
    incenter: {
      title: "삼각형의 외심과 내심 실시간 작도기",
      grade: "중2-2 기하",
      desc: "삼각형의 꼭짓점 A, B, C를 마우스로 직접 드래그하여 예각, 직각, 둔각삼각형으로 변형할 때, 외심이 빗변의 중점 또는 외부로 이동하는 성질을 실시간으로 관찰합니다.",
      teachingPoint: "시험에 단골로 출제되는 외심(수직이등분선의 교점)과 내심(각의 이등분선의 교점)의 위치 차이를 직접 손으로 끌어보며 확인시킵니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountIncenter(c, ctrl, inf)
    },
    prime: {
      title: "에라토스테네스의 체 & 소인수분해 트리",
      grade: "중1-1 수와 연산",
      desc: "1부터 100까지의 격자판에서 2, 3, 5, 7의 배수를 순차적으로 지워나가며 소수만 남기는 에라토스테네스의 체 알고리즘 시뮬레이터입니다.",
      teachingPoint: "합성수와 소수의 구분을 시각적인 배수 제거 애니메이션으로 재미있게 학습시킵니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountPrime(c, ctrl, inf)
    },
    scatter: {
      title: "산점도와 상관관계 & 대푯값(평균/중앙값) 저울",
      grade: "중3-2 통계",
      desc: "좌표평면 위를 클릭하여 데이터를 직접 추가해보고, 극단적인 이상치(Outlier)가 추가되었을 때 평균(Mean)과 중앙값(Median) 중 어느 쪽이 영향을 크게 받는지 확인합니다.",
      teachingPoint: "데이터 시대에 필수적인 통계적 문해력과 평균의 취약점을 시각적으로 체감하게 합니다.",
      mount: (c, ctrl, inf) => SimulationEngine.mountScatter(c, ctrl, inf)
    }
  };

  function openSim(simId) {
    const data = middleSimData[simId];
    if (!data) return;

    if (modalTitle) modalTitle.textContent = data.title;
    if (modalGrade) modalGrade.textContent = data.grade;
    if (modalDesc) modalDesc.textContent = data.desc;
    if (modalPoint) modalPoint.textContent = data.teachingPoint;

    modal.classList.remove("hidden");
    modal.classList.add("flex");

    // 모달 캔버스에 해당 교구 인터랙티브 엔진 마운트
    setTimeout(() => {
      data.mount(modalCanvas, modalControls, modalInfo);
    }, 60);
  }

  // 카드 내 '교구 실행' 버튼 클릭 시 오픈
  runButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const simId = btn.getAttribute("data-sim-id");
      openSim(simId);
    });
  });

  // 카드 자체를 클릭해도 오픈
  simCards.forEach((card) => {
    card.addEventListener("click", () => {
      const btn = card.querySelector(".btn-run-sim");
      if (btn) {
        const simId = btn.getAttribute("data-sim-id");
        openSim(simId);
      }
    });
  });

  function closeModal() {
    SimulationEngine.stop();
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });
}

/* -------------------------------------------------------------
 * 6. 중2 확률 실험실: 두 개의 주사위 던지기 & 대수의 법칙
 * ------------------------------------------------------------- */
function initDiceSimulation() {
  const dice1El = document.getElementById("dice1Face");
  const dice2El = document.getElementById("dice2Face");
  const lastSumEl = document.getElementById("lastDiceSum");
  const totalThrowsEl = document.getElementById("totalDiceThrows");
  const roll1Btn = document.getElementById("roll1Btn");
  const roll10Btn = document.getElementById("roll10Btn");
  const roll100Btn = document.getElementById("roll100Btn");
  const resetDiceBtn = document.getElementById("resetDiceBtn");

  const diceGlyphs = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const sumCounts = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0 };
  let totalThrows = 0;

  function rollOnce() {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const sum = d1 + d2;

    sumCounts[sum]++;
    totalThrows++;

    return { d1, d2, sum };
  }

  function updateDisplay(lastResult) {
    if (lastResult) {
      if (dice1El) dice1El.textContent = diceGlyphs[lastResult.d1 - 1];
      if (dice2El) dice2El.textContent = diceGlyphs[lastResult.d2 - 1];
      if (lastSumEl) lastSumEl.textContent = `합: ${lastResult.sum}`;
    }
    if (totalThrowsEl) totalThrowsEl.textContent = totalThrows.toLocaleString();
    updateBarChart();
  }

  function updateBarChart() {
    let maxCount = 1;
    for (let s = 2; s <= 12; s++) {
      if (sumCounts[s] > maxCount) maxCount = sumCounts[s];
    }

    for (let s = 2; s <= 12; s++) {
      const barEl = document.getElementById(`barSum${s}`);
      const countEl = document.getElementById(`countSum${s}`);
      const pctEl = document.getElementById(`pctSum${s}`);

      const count = sumCounts[s];
      const pct = totalThrows > 0 ? ((count / totalThrows) * 100).toFixed(1) : 0;
      const heightPercent = totalThrows > 0 ? Math.max((count / maxCount) * 100, 4) : 4;

      if (barEl) {
        barEl.style.height = `${heightPercent}%`;
        if (s === 7) {
          barEl.style.background = "#e11d48";
        }
      }
      if (countEl) countEl.textContent = count;
      if (pctEl) pctEl.textContent = `${pct}%`;
    }
  }

  if (roll1Btn) {
    roll1Btn.addEventListener("click", () => {
      const res = rollOnce();
      updateDisplay(res);
    });
  }

  if (roll10Btn) {
    roll10Btn.addEventListener("click", () => {
      let lastRes;
      for (let i = 0; i < 10; i++) lastRes = rollOnce();
      updateDisplay(lastRes);
    });
  }

  if (roll100Btn) {
    roll100Btn.addEventListener("click", () => {
      let lastRes;
      for (let i = 0; i < 100; i++) lastRes = rollOnce();
      updateDisplay(lastRes);
    });
  }

  if (resetDiceBtn) {
    resetDiceBtn.addEventListener("click", () => {
      for (let s = 2; s <= 12; s++) sumCounts[s] = 0;
      totalThrows = 0;
      if (dice1El) dice1El.textContent = "⚀";
      if (dice2El) dice2El.textContent = "⚀";
      if (lastSumEl) lastSumEl.textContent = "합: 2";
      updateDisplay(null);
    });
  }

  for (let i = 0; i < 30; i++) rollOnce();
  updateDisplay({ d1: 3, d2: 4, sum: 7 });
}
