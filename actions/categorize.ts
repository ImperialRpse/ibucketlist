"use server";

import { GoogleGenAI } from '@google/genai';
import { CATEGORIES } from '@/lib/constants';

export async function suggestCategory(text: string): Promise<string> {
  if (!text) return "Others";
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `あなたはバケットリスト（やりたいことリスト）の分類アシスタントです。
以下のUsersの入力内容を分析し、最も適したCategoryを1つだけ出力してください。

【Categoryリスト】
${CATEGORIES.map(c => `- ${c}`).join('\n')}

【入力内容】
${text}

【ルール】
- 理由や解説は一切不要です。Category名のみを直接出力してください。
- 該当するものがない場合や判断できない場合は「Others」を出力してください。
- 出力は必ず上記のリストにある文字列と完全に一致させてください。`
    });

    const responseText = response.text || "";

    // AIの返答の中にリストの単語が含まれているかを探す（不要な記号や改行が含まれている場合の対策）
    const matchedCategory = CATEGORIES.find(c => responseText.includes(c));
    
    if (matchedCategory) {
      return matchedCategory;
    } else {
      console.warn("AI failed to categorize. Output:", responseText);
      return "Others";
    }
  } catch (error) {
    console.error("AI Category Suggestion Error:", error);
    return "Others";
  }
}
