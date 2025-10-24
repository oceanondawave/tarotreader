export async function getTarotReading(cards, question, language = "vi") {
  const chutesApiKey = import.meta.env.VITE_CHUTES_API_KEY;

  if (!chutesApiKey || chutesApiKey === "your_api_key_here") {
    throw new Error(
      "Chutes API key not configured. Please add VITE_CHUTES_API_KEY to your .env file."
    );
  }

  const cardDescriptions = cards
    .map((card) => {
      return `${card.name}: ${card.description} (Keywords: ${card.keywords.join(
        ", "
      )})`;
    })
    .join("\n\n");

  const promptInstructions =
    language === "vi"
      ? `Bạn là một nhà bói toán Tarot thông thái và huyền bí. Một người đã rút những lá bài sau và đặt câu hỏi. Hãy cung cấp một bài đọc sâu sắc, có suy nghĩ, kết nối các lá bài với câu hỏi của họ.

Các Lá Bài Đã Rút:
${cardDescriptions}

Câu Hỏi: ${question}

Hãy cung cấp bài đọc với:
1. Giải thích từng lá bài trong ngữ cảnh câu hỏi của họ
2. Chỉ ra cách các lá bài liên quan với nhau
3. Đưa ra lời khuyên và cái nhìn sâu sắc có ý nghĩa
4. Được viết bằng giọng điệu huyền bí nhưng dễ hiểu
5. Độ dài khoảng 3-4 đoạn văn
6. Sử dụng **in đậm** cho các tiêu đề và *in nghiêng* để nhấn mạnh các điểm quan trọng

QUAN TRỌNG: Trả lời HOÀN TOÀN bằng TIẾNG VIỆT. Không dùng tiếng Anh.`
      : `You are a wise and mystical tarot reader. A person has drawn the following cards and asks a question. Provide a thoughtful, insightful reading that connects the cards to their question.

Cards Drawn:
${cardDescriptions}

Question: ${question}

Provide a reading that:
1. Interprets each card in the context of their question
2. Shows how the cards relate to each other
3. Offers meaningful guidance and insight
4. Is written in a mystical yet accessible tone
5. Is about 3-4 paragraphs long
6. Use **bold** for headings and *italics* to emphasize important points

Please respond ENTIRELY in ENGLISH.`;

  const prompt = `${promptInstructions}

Please provide the reading now:`;

  console.log("Attempting Chutes API...");

  try {
    const requestBody = {
      model: "meituan-longcat/LongCat-Flash-Chat-FP8",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
      max_tokens: 2048,
      temperature: 0.7,
    };

    const response = await fetch("https://llm.chutes.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chutesApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Chutes API Error:", errorData);
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `Chutes API request failed with status ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Unexpected Chutes API response format");
    }

    console.log("Successfully got response from Chutes API");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Chutes API failed:", error);
    throw error;
  }
}
