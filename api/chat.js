// Vercel Serverless Function: MathClay 以묓븰?섑븰 AI ?섑븰 ?쒗꽣 API
const SYSTEM_PROMPT = `?뱀떊? 'MathClay 以묓븰?섑븰'???꾨Ц AI ?섑븰 ?쒗꽣 ?좎깮?섏엯?덈떎.
??쒕?援?以묓븰援?1~3?숇뀈 ?숈깮?ㅼ쓽 ?섑븰 吏덈Ц??移쒖젅?섍퀬, 吏곴??곸씠硫? ?④퀎蹂꾨줈 ?댄빐?섍린 ?쎄쾶 ?듬??댁＜?몄슂.

[援먯쑁 吏??吏移?
1. ??? 以묓븰援?1~3?숇뀈 ?숈깮 (以?: ?뚯씤?섎텇?? ?뺤닔? ?좊━?? 臾몄옄? ?? ?쇱감諛⑹젙?? 醫뚰몴?됰㈃怨?洹몃옒??/ 以?: ?좊━?섏? ?쒗솚?뚯닔, ?앹쓽 怨꾩궛, ?쇱감遺?깆떇, ?곕┰?쇱감諛⑹젙?? ?쇱감?⑥닔, ?쇨컖?뺤쓽 ?깆쭏(?몄떖怨??댁떖), ?ш컖?뺤쓽 ?깆쭏, ?쇳?怨좊씪???뺣━, ?뺣쪧 / 以?: ?쒓낢洹쇨낵 ?ㅼ닔, ?ㅽ빆?앹쓽 怨깆뀍怨??몄닔遺꾪빐, ?댁감諛⑹젙?? ?댁감?⑥닔, ?쇨컖鍮? ?먯쓽 ?깆쭏, ?듦퀎-???컪怨??고룷??.
2. ?댁“: 留ㅼ슦 移쒖젅?섍퀬, 寃⑸젮?섎ŉ, ?곕쑜???섑븰援먯궗 ?ㅼ븻留ㅻ꼫 ("~?댁슂", "~???, "?④퍡 ?뚯븘蹂쇨퉴??").
3. ?ㅻ챸 援ъ“:
   - ?뙚 [吏곴???媛쒕뀗 ?↔린]: 怨듭떇留??щ떖 ?몄슦吏 ?딅룄濡??쇱긽?곸씤 ?덉떆??吏곴??곸씤 鍮꾩쑀濡?癒쇱? ?ㅻ챸?⑸땲??
   - ?뱷 [李④렐李④렐 ?④퀎蹂????: 1?④퀎, 2?④퀎 ?깆쑝濡?踰덊샇瑜?留ㅺ꺼 ???怨쇱젙怨??댁쑀瑜?紐낆풄?섍쾶 ?ㅻ챸?⑸땲??
   - ?뮕 [?좎깮?섏쓽 轅??& ?앷컖嫄곕━]: ?쒗뿕?먯꽌 ?먯＜ ?룰컝由щ뒗 ?⑥젙 ?곸씠???숈깮??吏곸젒 ??대낵 ???덈뒗 ?묒? ?앷컖嫄곕━ 吏덈Ц???섏졇以띾땲??
4. ?섏떇 ?묒꽦 洹쒖튃:
   - 紐⑤뱺 ?섑븰 湲고샇, 遺꾩닔, 猷⑦듃, 吏???깆? 諛섎뱶??KaTeX / LaTeX ?섏떇 臾몃쾿???ъ슜?⑸땲??
   - 臾몄옣 ???몃씪???섏떇? $...$ 濡?媛먯떥?몄슂. (?? $y = ax + b$, $a^2 + b^2 = c^2$, $\sin 30^\circ = \frac{1}{2}$)
   - ?듭떖 怨듭떇?대굹 湲??섏떇? ?낅┰??釉붾줉 ?섏떇 $$...$$ 濡?媛먯떥?몄슂.
5. ?숈깮??吏덈Ц??吏㏐쾶 ?섎뜑?쇰룄 以묓븰援??섑븰 怨쇱젙??留욌뒗 諛곌꼍怨??듭떖 ?ъ씤?몃? 移쒖젅?섍쾶 吏싳뼱二쇱꽭??
6. ?⑥닚 怨꾩궛湲곗쿂???듬쭔 ???섏?吏 留먭퀬, "??洹몃젃寃??섎뒗吏" ?먮━瑜?源⑥슦移????덈룄濡??뺤뒿?덈떎.`;

export default async function handler(req, res) {
  // CORS ?ㅻ뜑 ?ㅼ젙
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-openai-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed (POST ?붿껌留?吏?먰빀?덈떎)" });
  }

  try {
    const { messages, apiKey: clientKey } = req.body || {};
    const apiKey = (process.env.OPENAI_API_KEY || req.headers["x-openai-key"] || clientKey || "").trim();

    if (!apiKey) {
      return res.status(400).json({
        error: "OPENAI_API_KEY媛 ?깅줉?섏? ?딆븯?듬땲?? Vercel ?섍꼍蹂?섏뿉 OPENAI_API_KEY瑜??깅줉?섍굅??梨쀫큸 ?ㅼ젙(?숋툘)?먯꽌 ?낅젰?댁＜?몄슂."
      });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "吏덈Ц 硫붿떆吏 紐⑸줉(messages)???꾩슂?⑸땲??" });
    }

    // 理쒓렐 理쒕? 10媛?????좎? (而⑦뀓?ㅽ듃 愿由?
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
      const errorMessage = data?.error?.message || "OpenAI API ?몄텧 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.";
      let userFriendlyMsg = errorMessage;
      if (errorMessage.includes("Incorrect API key") || errorMessage.includes("invalid_api_key")) {
        userFriendlyMsg = "?낅젰??OPENAI_API_KEY媛 ?щ컮瑜댁? ?딆뒿?덈떎. ?ㅻ? ?ㅼ떆 ?뺤씤??二쇱꽭??";
      } else if (errorMessage.includes("quota") || errorMessage.includes("insufficient_quota")) {
        userFriendlyMsg = "OpenAI API ?щ젅???좊떦??Quota)???뚯쭊?섏뿀?듬땲?? 怨꾩젙 寃곗젣 ?뺣낫瑜??뺤씤??二쇱꽭??";
      } else if (errorMessage.includes("rate limit")) {
        userFriendlyMsg = "吏덈Ц ?붿껌???덈Т 留롮뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??";
      }
      return res.status(openaiResponse.status).json({ error: userFriendlyMsg, details: errorMessage });
    }

    const reply = data.choices?.[0]?.message?.content || "?듬????앹꽦?섏? 紐삵뻽?듬땲??";
    return res.status(200).json({ success: true, reply });

  } catch (err) {
    console.error("Serverless Function Internal Error:", err);
    return res.status(500).json({
      error: "?쒕쾭 泥섎━ 以??덇린移??딆? ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
      details: err.message
    });
  }
}
