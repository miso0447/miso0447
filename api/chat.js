// Vercel Serverless Function: MathClay 중학수학 AI 수학 튜터 API
const SYSTEM_PROMPT = `당신은 'MathClay 중학수학'의 전문 AI 수학 튜터 선생님입니다.
대한민국 중학교 1~3학년 학생들의 수학 질문에 친절하고, 직관적이며, 단계별로 이해하기 쉽게 답변해주세요.

[교육 지도 지침]
1. 대상: 중학교 1~3학년 학생 (중1: 소인수분해, 정수와 유리수, 문자와 식, 일차방정식, 좌표평면과 그래프 / 중2: 유리수와 순환소수, 식의 계산, 일차부등식, 연립일차방정식, 일차함수, 삼각형의 성질(외심과 내심), 사각형의 성질, 피타고라스 정리, 확률 / 중3: 제곱근과 실수, 다항식의 곱셈과 인수분해, 이차방정식, 이차함수, 삼각비, 원의 성질, 통계-대푯값과 산포도).
2. 어조: 매우 친절하고, 격려하며, 따뜻한 수학교사 톤앤매너 ("~해요", "~란다", "함께 알아볼까요?").
3. 설명 구조:
   - 🌟 [직관적 개념 잡기]: 공식만 달달 외우지 않도록 일상적인 예시나 직관적인 비유로 먼저 설명합니다.
   - 📝 [차근차근 단계별 풀이]: 1단계, 2단계 등으로 번호를 매겨 풀이 과정과 이유를 명쾌하게 설명합니다.
   - 💡 [선생님의 꿀팁 & 생각거리]: 시험에서 자주 헷갈리는 함정 팁이나 학생이 직접 풀어볼 수 있는 작은 생각거리 질문을 던져줍니다.
4. 수식 작성 규칙:
   - 모든 수학 기호, 분수, 루트, 지수 등은 반드시 KaTeX / LaTeX 수식 문법을 사용합니다.
   - 문장 속 인라인 수식은 $...$ 로 감싸세요. (예: $y = ax + b$, $a^2 + b^2 = c^2$, $\sin 30^\circ = \frac{1}{2}$)
   - 핵심 공식이나 긴 수식은 독립된 블록 수식 $$...$$ 로 감싸세요.
5. 학생이 질문을 짧게 하더라도 중학교 수학 과정에 맞는 배경과 핵심 포인트를 친절하게 짚어주세요.
6. 단순 계산기처럼 답만 툭 던지지 말고, "왜 그렇게 되는지" 원리를 깨우칠 수 있도록 돕습니다.`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-openai-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed (POST 요청만 지원합니다)" });
  }

  try {
    const { messages, apiKey: clientKey } = req.body || {};
    const apiKey = (process.env.OPENAI_API_KEY || req.headers["x-openai-key"] || clientKey || "").trim();

    if (!apiKey) {
      return res.status(400).json({
        error: "OPENAI_API_KEY가 등록되지 않았습니다. Vercel 환경변수에 OPENAI_API_KEY를 등록하거나 챗봇 설정(⚙️)에서 입력해주세요."
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "질문 메시지 목록(messages)이 필요합니다." });
    }

    const recentMessages = messages.slice(-10).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "")
    }));

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...recentMessages
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI API Error:", data);
      const errorMessage = data?.error?.message || "OpenAI API 호출 중 오류가 발생했습니다.";
      let userFriendlyMsg = errorMessage;
      if (errorMessage.includes("Incorrect API key") || errorMessage.includes("invalid_api_key")) {
        userFriendlyMsg = "입력된 OPENAI_API_KEY가 올바르지 않습니다. 키를 다시 확인해 주세요.";
      } else if (errorMessage.includes("quota") || errorMessage.includes("insufficient_quota")) {
        userFriendlyMsg = "OpenAI API 크레딧 할당량(Quota)이 소진되었습니다. 계정 결제 정보를 확인해 주세요.";
      } else if (errorMessage.includes("rate limit")) {
        userFriendlyMsg = "질문 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
      }
      return res.status(openaiResponse.status).json({ error: userFriendlyMsg, details: errorMessage });
    }

    const reply = data.choices?.[0]?.message?.content || "답변을 생성하지 못했습니다.";
    return res.status(200).json({ success: true, reply });

  } catch (err) {
    console.error("Serverless Function Internal Error:", err);
    return res.status(500).json({
      error: "서버 처리 중 예기치 않은 오류가 발생했습니다.",
      details: err.message
    });
  }
}
