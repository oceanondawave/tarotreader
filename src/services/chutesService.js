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
      ? `Một người đã rút những lá bài sau và đặt câu hỏi. Hãy giải thích ý nghĩa các lá bài và đưa ra lời khuyên ngắn gọn.

Các Lá Bài:
${cardDescriptions}

Câu Hỏi: ${question}

Yêu cầu:
- Giải thích ngắn gọn từng lá bài trong ngữ cảnh câu hỏi
- Chỉ ra mối liên hệ giữa các lá bài
- Đưa ra lời khuyên thiết thực và thẳng thắn
- Tối đa 200 từ, viết ngắn gọn, đi vào trọng tâm
- Sử dụng **in đậm** cho tiêu đề và *in nghiêng* để nhấn mạnh

QUAN TRỌNG: Trả lời HOÀN TOÀN bằng TIẾNG VIỆT. Không dùng tiếng Anh. Không dùng các cụm từ như "Tôi là...", "Tôi là một nhà bói toán...". Nói trực tiếp với người dùng.`
      : `A person has drawn the following cards and asks a question. Interpret the cards and provide brief guidance.

Cards:
${cardDescriptions}

Question: ${question}

Requirements:
- Briefly interpret each card in context of their question
- Show how cards relate to each other
- Provide direct, practical advice
- Maximum 200 words, be concise and to the point
- Use **bold** for headings and *italics* for emphasis

IMPORTANT: Respond ENTIRELY in ENGLISH. Do not use phrases like "I am...", "I am a tarot reader...". Speak directly to the user.`;

  const prompt = `${promptInstructions}

Please provide the reading now:`;

  console.log("Attempting Chutes API...");

  try {
    const requestBody = {
      model: "unsloth/gemma-3-4b-it",
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
