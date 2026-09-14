// Vercel Serverless Function: 탐구 결과 DB 저장 및 조회 API
let inMemoryRecords = [];

export default function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const record = req.body;
      if (!record || !record.triangleType) {
        return res.status(400).json({ error: "잘못된 데이터 형식입니다." });
      }

      record.id = record.id || `rec_${Date.now()}`;
      record.createdAt = record.createdAt || new Date().toISOString();
      inMemoryRecords.unshift(record);

      // 최대 200개 유지
      if (inMemoryRecords.length > 200) {
        inMemoryRecords.pop();
      }

      return res.status(201).json({ success: true, record });
    } catch (e) {
      return res.status(500).json({ error: "서버 저장 실패", details: e.message });
    }
  }

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      count: inMemoryRecords.length,
      records: inMemoryRecords
    });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
