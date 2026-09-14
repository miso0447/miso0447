/**
 * MathClay Junior - AI ?섑븰 ?쒗꽣 梨쀫큸 紐⑤뱢
 * OpenAI API? Vercel Serverless Function(/api/chat)???곕룞?섏뿬
 * 以묓븰援?1~3?숇뀈 ?숈깮?ㅼ쓽 ?섑븰 吏덈Ц??KaTeX ?섏떇怨??④퍡 ?④퀎蹂꾨줈 ?듬??⑸땲??
 */

const MathClayChat = {
  isOpen: false,
  isLoading: false,
  history: [],
  apiKeyStorageKey: "mathclay_openai_key",

  // 異붿쿇 鍮좊Ⅸ 吏덈Ц 紐⑸줉
  quickQuestions: [
    { label: "?몄떖 vs ?댁떖 李⑥씠", query: "?몄떖怨??댁떖???듭떖 李⑥씠?먯쓣 ?쎄쾶 援щ퀎?섎뒗 踰뺤쓣 ?뚮젮以?" },
    { label: "?쇱감?⑥닔 湲곗슱湲?, query: "?쇱감?⑥닔 湲곗슱湲곌? ??x 利앷???遺꾩쓽 y 利앷??됱씤媛??" },
    { label: "?쇳?怨좊씪???뺣━", query: "?쇳?怨좊씪???뺣━媛 ??吏곴컖?쇨컖?뺤뿉?쒕쭔 ?깅┰?섎뒗吏 ?ㅻ챸?댁쨾!" },
    { label: "?뚯닔 횞 ?뚯닔 = ?묒닔?", query: "?뚯닔 怨깊븯湲??뚯닔?????묒닔媛 ?섎뒗吏 吏곴??곸쑝濡??뚮젮以?" },
    { label: "?쇨컖鍮??붽린 轅??, query: "以? ?쇨컖鍮?sin, cos, tan) 30?? 45?? 60???뱀닔媛??쎄쾶 ?몄슦??踰?" }
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
    const minBtn = document.getElementById("chatMinBtn");
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
    if (minBtn) {
      minBtn.addEventListener("click", () => this.closeChat());
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

    // ?ㅼ젙 紐⑤떖 ???痍⑥냼 ?대깽??諛붿씤??    const saveKeyBtn = document.getElementById("chatSaveKeyBtn");
    const clearSavedKeyBtn = document.getElementById("chatClearSavedKeyBtn");
    const closeSettingsBtn = document.getElementById("chatCloseSettingsBtn");

    if (saveKeyBtn) {
      saveKeyBtn.addEventListener("click", () => {
        const inputKey = document.getElementById("chatCustomKeyInput")?.value || "";
        this.setCustomApiKey(inputKey);
        this.closeSettingsModal();
        alert("API ?ㅺ? 釉뚮씪?곗?????λ릺?덉뒿?덈떎.");
      });
    }

    if (clearSavedKeyBtn) {
      clearSavedKeyBtn.addEventListener("click", () => {
        this.setCustomApiKey("");
        const inputKey = document.getElementById("chatCustomKeyInput");
        if (inputKey) inputKey.value = "";
        alert("??λ맂 API ?ㅺ? ??젣?섏뿀?듬땲?? (Vercel ?섍꼍蹂??OPENAI_API_KEY 湲곕낯 ?ъ슜)");
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
            <span>?몝 ?덈뀞! MathClay AI ?섑븰 ?쒗꽣??</span>
          </p>
          <p>
            以묓븰援?1~3?숇뀈 ?섑븰(?쇱감?⑥닔, ?쇳?怨좊씪?? ?쇨컖鍮? ?몄떖쨌?댁떖, ?뚯씤?섎텇???? 臾댁뾿?대뱺 ?명븯寃?吏덈Ц?댁쨾.
            怨듭떇???먮━遺???④퀎蹂???닿퉴吏 移쒖젅?섍쾶 ?뚮젮以꾧쾶!
          </p>
          <div class="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            ?뮕 ?곷떒 異붿쿇 吏덈Ц 移⑹쓣 ?꾨Ⅴ嫄곕굹, 沅곴툑??臾몄젣??媛쒕뀗??吏곸젒 ?곸뼱蹂댁꽭??
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

    // ?낅젰李?珥덇린??    input.value = "";

    // ?ъ슜??硫붿떆吏 異붽?
    this.appendUserMessage(question);
    this.history.push({ role: "user", content: question });

    // 濡쒕뵫 ?몃뵒耳?댄꽣 ?쒖떆
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

      // 1. ?쒕쾭由ъ뒪 API (/api/chat) ?몄텧
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
          // 濡쒖뺄 ?뺤쟻 ?쒕쾭(file:// ???먯꽌 404?닿퀬 customKey媛 ?덈뒗 寃쎌슦 OpenAI API 吏곸젒 ?몄텧 ?대갚
          reply = await this.callOpenAIDirectly(customKey, this.history);
        } else {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `?쒕쾭 ?묐떟 ?ㅻ쪟 (HTTP ${res.status})`);
          }
          reply = data.reply;
        }
      } catch (fetchErr) {
        // ?ㅽ듃?뚰겕 ?먮뒗 404 ??濡쒖뺄 customKey媛 ?덉쑝硫?吏곸젒 ?몄텧 ?쒕룄
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
      console.error("梨쀫큸 ?붿껌 ?ㅻ쪟:", err);
      this.removeTypingIndicator();
      this.appendErrorMessage(err.message || "?듬???媛?몄삤??以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
    } finally {
      this.isLoading = false;
      this.scrollToBottom();
    }
  },

  // 濡쒖뺄 ?뚯씪/?뺤쟻 ?쒕쾭 ?섍꼍?먯꽌 吏곸젒 ?몄텧 ?대갚
  async callOpenAIDirectly(apiKey, messages) {
    const SYSTEM_PROMPT = `?뱀떊? 'MathClay 以묓븰?섑븰'???꾨Ц AI ?섑븰 ?쒗꽣 ?좎깮?섏엯?덈떎. ??쒕?援?以묓븰援?1~3?숇뀈 ?숈깮?ㅼ쓽 ?섑븰 吏덈Ц??移쒖젅?섍퀬 ?④퀎蹂꾨줈 ?섏떇($...$, $$...$$)怨??④퍡 ?ㅻ챸?댁＜?몄슂.`;
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
      throw new Error(data?.error?.message || "OpenAI API ?몄텧 ?ㅽ뙣");
    }
    return data.choices?.[0]?.message?.content || "?듬????앹꽦?섏? 紐삵뻽?듬땲??";
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
        ??      </div>
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

    // KaTeX ?섏떇 ?뚮뜑留??곸슜
    this.renderKatex(div);
  },

  appendErrorMessage(errorText) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = "flex items-start gap-2.5 my-2.5";
    div.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-rose-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm">
        !
      </div>
      <div class="chat-bubble-bot p-3.5 max-w-[85%] text-xs sm:text-sm leading-relaxed border-rose-200 bg-rose-50/70 text-rose-900">
        <p class="font-bold flex items-center gap-1 text-rose-700 mb-1">
          <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> ?덈궡
        </p>
        <p>${this.escapeHtml(errorText)}</p>
        <div class="mt-2 pt-2 border-t border-rose-200 flex items-center gap-2">
          <button onclick="MathClayChat.openSettingsModal()" class="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-[11px] font-bold text-rose-700 hover:bg-rose-50 transition-colors">
            ?숋툘 API ???ㅼ젙 ?뺤씤
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
        <span>?좎깮?섏씠 ?섑븰 ?먮━瑜??앷컖?섍퀬 ?덉뼱??/span>
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

  /**
   * Markdown ?뚯떛 諛?KaTeX ?섏떇 蹂댁〈 ?뚮뜑留?   */
  formatMathMarkdown(text) {
    if (!text) return "";

    // 1. ?섏떇 釉붾줉 ($$..$$ ? $..$) ?꾩떆 ?좏겙?뷀븯??留덊겕?ㅼ슫 ?뚯꽌 媛꾩꽠 諛⑹?
    const mathTokens = [];
    let tokenIndex = 0;

    // Display math $$...$$
    let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
      const token = `%%MATH_DISPLAY_${tokenIndex++}%%`;
      mathTokens.push({ token, formula: formula.trim(), display: true });
      return token;
    });

    // Inline math $...$
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (match, formula) => {
      const token = `%%MATH_INLINE_${tokenIndex++}%%`;
      mathTokens.push({ token, formula: formula.trim(), display: false });
      return token;
    });

    // 2. 留덊겕?ㅼ슫 蹂??    let html = this.escapeHtml(processed);

    // ?쒕ぉ (###, ##, #)
    html = html.replace(/^### (.*$)/gim, '<h5 class="font-bold text-indigo-900 mt-2.5 mb-1">$1</h5>');
    html = html.replace(/^## (.*$)/gim, '<h4 class="font-black text-indigo-950 mt-3 mb-1.5 text-sm">$1</h4>');
    html = html.replace(/^# (.*$)/gim, '<h3 class="font-black text-indigo-950 mt-3 mb-2 text-base">$1</h3>');

    // 援듦쾶 (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-bold text-slate-900">$1</strong>');

    // 湲곗슱??(*text*)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    // ?몄슜援?(> ...)
    html = html.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-indigo-300 pl-3 py-1 my-1 text-slate-600 bg-indigo-50/50 rounded-r">$1</blockquote>');

    // 踰덊샇 由ъ뒪??(1. 2. 3.)
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="flex items-start gap-1.5 my-1 ml-1"><span class="font-bold text-indigo-600">$1.</span><span>$2</span></div>');

    // 遺덈┸ 由ъ뒪??(- or *)
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<div class="flex items-start gap-2 my-0.5 ml-1"><span class="text-indigo-500 font-bold">??/span><span>$1</span></div>');

    // 以꾨컮轅?    html = html.replace(/\n\n/g, '<div class="h-2"></div>');
    html = html.replace(/\n/g, '<br/>');

    // 3. ?섏떇 蹂듭썝 諛?KaTeX ?뚮뜑留?    mathTokens.forEach(({ token, formula, display }) => {
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
        // KaTeX媛 ?꾩쭅 以鍮꾨릺吏 ?딆? 寃쎌슦 湲곕낯 ?쒓린
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
        console.warn("KaTeX renderMathInElement ?ㅻ쪟:", e);
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

// DOM 濡쒕뱶 ?꾨즺 ??珥덇린??document.addEventListener("DOMContentLoaded", () => {
  MathClayChat.init();
});
