import { GoogleGenerativeAI } from "@google/generative-ai";

export const generateSummary = async (apiKey, reports, studentName) => {
    if (!apiKey) {
        throw new Error("Gemini APIキーが設定されていません");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // Format reports for the prompt
    const reportsText = reports.map(r =>
        `日付: ${r.date}\n活動種別: ${r.type}\n内容: ${r.content}`
    ).join("\n---\n");

    const prompt = `
あなたは放課後等デイサービスの支援計画作成アシスタントです。
以下の「${studentName}」さんの日報リストをもとに、今月の「活動実績」と「来月の支援計画（案）」を作成してください。

# 制約事項
- 語尾は「です・ます」調で統一してください。
- 具体的かつポジティブな表現を心がけてください。
- 出力はJSON形式で、以下のキーを含めてください。
  - achievements: 今月の活動実績（200文字程度）
  - plan: 来月の支援計画案（200文字程度）

# 日報リスト
${reportsText}
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from markdown code block if present
        const jsonMatch = text.match(/```json\n([\s\S]*)\n```/);
        const jsonStr = jsonMatch ? jsonMatch[1] : text;

        return JSON.parse(jsonStr);
    } catch (err) {
        console.error("AI Generation Error:", err);
        throw new Error("AIによる生成に失敗しました: " + err.message);
    }
};
