/**
 * MathClay Junior - AI 수학 튜터 챗봇 모듈
 * OpenAI API와 Vercel Serverless Function(/api/chat)을 연동하여
 * 중학교 1~3학년 학생들의 수학 질문에 KaTeX 수식과 함께 단계별로 답변합니다.
 */

const MathClayChat = {
  isOpen: false,
  isLoading: false,
  history: [],
  apiKeyStorageKey: "mathclay_openai_key",

  // 추천 빠른 질문 목록
  quickQuestions: [
    { label: "외심 vs 내심 차이", query: "외심과 내심의 핵심 차이점을 쉽게 구별하는 법을 알려줘!" },
    { label: "일차함수 기울기", query: "일차함수 기울기가 왜 x 증가량 분의 y 증가량인가요?" },
    { label: "피타고라스 정리", query: "피타고라스 정리가 왜 직각삼각형에서만 성립하는지 설명해줘!" },
    { label: "음수 × 음수 = 양수?", query: "음수 곱하기 음수는 왜 양수가 되는지 직관적으로 알려줘!" },
    { label: "삼각비 암기 꿀팁", query: "중3 삼각비(sin, cos, tan) 30도, 45도, 60도 특수각 쉽게 외우는 법!" }
  ],

  getCustomApiKey() {
    try {
      return (localStorage.getItem(this.apiKeyStorageKey) || "").trim();
    } catch (e) {
      return "";
    }
  },

  setCustomApiKey(key) {
    try {
      if (key && key.trim()) {
        localStorage.setItem(this.apiKeyStorageKey, key.trim());
      } else {
        localStorage.removeItem(this.apiKeyStorageKey);
      }
    } catch (e) {}
  },

  init() {
    this.bindEvents();
    this.renderQuickChips();
    if (window.lucide) {
      lucide.createIcons();
    }
  },

  bindEvents() {
    const fabBtn = document.getElementById("chatFabBtn");
    const closeBtn = document.getElementById("chatCloseBtn");
    const clearBtn = document.getElementById("chatClearBtn");
    const settingsBtn = document.getElementById("chatSettingsBtn");
    const sendBtn = document.getElementById("chatSendBtn");
    const input = document.getElementById("chatInput");
    const navTrigger = document.getElementById("navAiTutorBtn");

    if (fabBtn) {
      fabBtn.addEventListener("click", () => this.toggleChat());
    }
    if (navTrigger) {
      navTrigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.openChat();
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeChat());
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.resetConversation());
    }
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.openSettingsModal());
    }
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.handleSend());
    }

    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleSend();
        }
      });
    }

    const saveKeyBtn = document.getElementById("chatSaveKeyBtn");
    const clearSavedKeyBtn = document.getElementById("chatClearSavedKeyBtn");
    const closeSettingsBtn = document.getElementById("chatCloseSettingsBtn");

    if (saveKeyBtn) {
      saveKeyBtn.addEventListener("click", () => {
        const inputKey = document.getElementById("chatCustomKeyInput")?.value || "";
        this.setCustomApiKey(inputKey);
        this.closeSettingsModal();
        alert("API 키가 브라우저에 저장되었습니다.");
      });
    }

    if (clearSavedKeyBtn) {
      clearSavedKeyBtn.addEventListener("click", () => {
        this.setCustomApiKey("");
        const inputKey = document.getElementById("chatCustomKeyInput");
        if (inputKey) inputKey.value = "";
        alert("저장된 API 키가 삭제되었습니다. (Vercel 환경변수 OPENAI_API_KEY 기본 사용)");
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener("click", () => this.closeSettingsModal());
    }
  },

  openChat() {
    const windowEl = document.getElementById("chatWindow");
    if (!windowEl) return;
    windowEl.classList.remove("hidden");
    windowEl.classList.add("flex");
    this.isOpen = true;

    if (window.lucide) {
      lucide.createIcons();
    }

    const input = document.getElementById("chatInput");
    if (input) {
      setTimeout(() => input.focus(), 200);
    }
    this.scrollToBottom();
  },

  closeChat() {
    const windowEl = document.getElementById("chatWindow");
    if (!windowEl) return;
    windowEl.classList.add("hidden");
    windowEl.classList.remove("flex");
    this.isOpen = false;
  },

  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  },

  renderQuickChips() {
    const chipsContainer = document.getElementById("chatQuickChips");
    if (!chipsContainer) return;

    chipsContainer.innerHTML = this.quickQuestions
      .map(
        (q, idx) => `
        <button type="button" class="chat-chip flex-shrink-0" onclick="MathClayChat.askQuickQuestion(${idx})">
          ${q.label}
        </button>
      `
      )
      .join("");
  },

  askQuickQuestion(idx) {
    const q = this.quickQuestions[idx];
    if (!q) return;
    const input = document.getElementById("chatInput");
    if (input) {
      input.value = q.query;
      this.handleSend();
    }
  },

  resetConversation() {
    this.history = [];
    const container = document.getElementById("chatMessages");
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-start gap-2.5 my-2">
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm">
          AI
        </div>
        <div class="chat-bubble-bot p-4 max-w-[85%] text-xs sm:text-sm leading-relaxed space-y-2">
          <p class="font-bold text-indigo-700 flex items-center gap-1.5">
            <span>👋 안녕! MathClay AI 수학 튜터야!</span>
          </p>
          <p>
            중학교 1~3학년 수학(일차함수, 피타고라스, 삼각비, 외심·내심, 소인수분해 등) 무엇이든 편하게 질문해줘.
            공식의 원리부터 단계별 풀이까지 친절하게 알려줄게!
          </p>
          <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            💡 상단 추천 질문 칩을 누르거나, 궁금한 문제나 개념을 직접 적어보세요!
          </div>
        </div>
      </div>
    `;
    this.renderQuickChips();
  },

  async handleSend() {
    if (this.isLoading) return;

    const input = document.getElementById("chatInput");
    if (!input) return;

    const question = input.value.trim();
    if (!question) return;

    input.value = "";

    this.appendUserMessage(question);
    this.history.push({ role: "user", content: question });

    this.isLoading = true;
    this.showTypingIndicator();
    this.scrollToBottom();

    try {
      const customKey = this.getCustomApiKey();
      const headers = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-openai-key"] = customKey;
      }

      let reply = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: this.history,
            apiKey: customKey || undefined
          })
        });

        if (res.status === 404 && customKey) {
          reply = await this.callOpenAIDirectly(customKey, this.history);
        } else {
          const data = await res.json();
          if (!res.ok) {
            const customErr = new Error(data.error || `서버 응답 오류 (HTTP ${res.status})`);
            customErr.details = data.details;
            throw customErr;
          }
          reply = data.reply;
        }
      } catch (fetchErr) {
        if (customKey && (fetchErr.message.includes("404") || fetchErr.message.includes("Failed to fetch"))) {
          reply = await this.callOpenAIDirectly(customKey, this.history);
        } else {
          throw fetchErr;
        }
      }

      this.removeTypingIndicator();
      this.appendBotMessage(reply);
      this.history.push({ role: "assistant", content: reply });

    } catch (err) {
      console.error("챗봇 요청 오류:", err);
      this.removeTypingIndicator();
      this.appendErrorMessage(err.message || "답변을 가져오는 중 오류가 발생했습니다.", err.details);
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
    }
  },

  async callOpenAIDirectly(apiKey, messages) {
    const SYSTEM_PROMPT = `당신은 'MathClay 중학수학'의 전문 AI 수학 튜터 선생님입니다. 대한민국 중학교 1~3학년 학생들의 수학 질문에 친절하고 단계별로 수식($...$, $$...$$)과 함께 설명해주세요.`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10)
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "OpenAI API 호출 실패");
    }
    return data.choices?.[0]?.message?.content || "답변을 생성하지 못했습니다.";
  },

  appendUserMessage(text) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex items-start justify-end gap-2.5 my-2.5";
    div.innerHTML = `
      <div class="chat-bubble-user p-3.5 max-w-[85%] text-xs sm:text-sm leading-relaxed text-white font-medium">
        ${this.escapeHtml(text).replace(/\n/g, "<br/>")}
      </div>
      <div class="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-700 text-xs font-bold shadow-sm">
        나
      </div>
    `;
    container.appendChild(div);
  },

  appendBotMessage(rawText) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex items-start gap-2.5 my-2.5";

    const formattedHtml = this.formatMathMarkdown(rawText);

    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm">
        AI
      </div>
      <div class="chat-bubble-bot p-4 max-w-[88%] text-xs sm:text-sm leading-relaxed">
        ${formattedHtml}
      </div>
    `;
    container.appendChild(div);

    this.renderKatex(div);
  },

  appendErrorMessage(errorText, details) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex items-start gap-2.5 my-2.5";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        !
      </div>
      <div class="chat-bubble-bot p-3.5 max-w-[85%] text-xs sm:text-sm leading-relaxed border-rose-200 bg-rose-50/70 text-rose-900 space-y-2">
        <p class="font-bold flex items-center gap-1 text-rose-700">
          <i data-lucide="alert-circle" class="w-4 h-4"></i> 안내
        </p>
        <p class="font-semibold">${this.escapeHtml(errorText)}</p>
        ${details ? `<p class="text-[11px] text-slate-600 bg-white/90 p-2.5 rounded-xl border border-rose-100 leading-relaxed">${this.escapeHtml(details)}</p>` : ""}
        <div class="pt-2 border-t border-rose-200 flex items-center gap-2">
          <button onclick="MathClayChat.openSettingsModal()" class="clay-btn clay-btn-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm flex items-center gap-1">
            <i data-lucide="key" class="w-3.5 h-3.5"></i>
            <span>⚙️ API 키 직접 입력하기</span>
          </button>
        </div>
      </div>
    `;
    container.appendChild(div);
    if (window.lucide) lucide.createIcons();
  },

  showTypingIndicator() {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const existing = document.getElementById("chatTypingIndicator");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.id = "chatTypingIndicator";
    div.className = "flex items-start gap-2.5 my-2";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-black shadow-sm">
        AI
      </div>
      <div class="chat-bubble-bot px-4 py-3 text-xs text-slate-500 flex items-center gap-1.5">
        <span>선생님이 수학 원리를 생각하고 있어요</span>
        <div class="flex items-center gap-1 ml-1.5">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    container.appendChild(div);
  },

  removeTypingIndicator() {
    const existing = document.getElementById("chatTypingIndicator");
    if (existing) existing.remove();
  },

  scrollToBottom() {
    const container = document.getElementById("chatMessages");
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  },

  escapeHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatMathMarkdown(text) {
    if (!text) return "";

    const mathTokens = [];
    let tokenIndex = 0;

    let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      const token = `%%MATH_DISPLAY_${tokenIndex++}%%`;
      mathTokens.push({ token, formula: formula.trim(), display: true });
      return token;
    });

    processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const token = `%%MATH_INLINE_${tokenIndex++}%%`;
      mathTokens.push({ token, formula: formula.trim(), display: false });
      return token;
    });

    let html = this.escapeHtml(processed);

    html = html.replace(/^### (.*$)/gim, '<h5 class="font-bold text-indigo-900 mt-2.5 mb-1">$1</h5>');
    html = html.replace(/^## (.*$)/gim, '<h4 class="font-black text-indigo-950 mt-3 mb-1.5 text-sm">$1</h4>');
    html = html.replace(/^# (.*$)/gim, '<h3 class="font-black text-indigo-950 mt-3 mb-2 text-base">$1</h3>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-300 pl-3 py-1 my-1 text-slate-600 bg-indigo-50/50 rounded-r">$1</blockquote>');
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="flex items-start gap-1.5 my-1 ml-1"><span class="font-bold text-indigo-600">$1.</span><span>$2</span></div>');
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<div class="flex items-start gap-2 my-0.5 ml-1"><span class="text-indigo-500 font-bold">•</span><span>$1</span></div>');
    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br/>');

    mathTokens.forEach(({ token, formula, display }) => {
      let renderedMath = "";
      if (window.katex && typeof window.katex.renderToString === "function") {
        try {
          renderedMath = window.katex.renderToString(formula, {
            displayMode: display,
            throwOnError: false
          });
        } catch (e) {
          renderedMath = display ? `\\[${this.escapeHtml(formula)}\\]` : `\\(${this.escapeHtml(formula)}\\)`;
        }
      } else {
        renderedMath = display ? `<div class="font-mono text-center my-2 text-indigo-900 font-bold">[${this.escapeHtml(formula)}]</div>` : `<span class="font-mono text-indigo-800 font-bold">(${this.escapeHtml(formula)})</span>`;
      }

      html = html.replace(token, renderedMath);
    });

    return html;
  },

  renderKatex(element) {
    if (window.renderMathInElement && typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(element, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("KaTeX renderMathInElement 오류:", e);
      }
    }
  },

  openSettingsModal() {
    const modal = document.getElementById("chatSettingsModal");
    const input = document.getElementById("chatCustomKeyInput");
    if (!modal) return;

    if (input) {
      input.value = this.getCustomApiKey();
    }
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  },

  closeSettingsModal() {
    const modal = document.getElementById("chatSettingsModal");
    if (modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  MathClayChat.init();
});
