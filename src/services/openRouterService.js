import OpenAI from "openai";

export async function getTarotReading(cards, question, language = "vi") {
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  if (!openaiApiKey || openaiApiKey === "your_api_key_here") {
    throw new Error(
      "OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file."
    );
  }

  const openai = new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true, // Only for client-side usage
  });

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

  console.log("Attempting OpenAI API first...");

  try {
    // Try OpenAI API first using the responses.create method
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    if (
      !response.output ||
      !response.output[0] ||
      !response.output[0].content
    ) {
      throw new Error("Unexpected API response format");
    }

    // Extract the text content from the response
    const content = response.output[0].content[0];
    if (content.type === "output_text") {
      console.log("Successfully got response from OpenAI API");
      return content.text;
    } else {
      throw new Error("Unexpected content type in response");
    }
  } catch (openaiError) {
    console.error(
      "OpenAI API failed, falling back to OpenRouter:",
      openaiError
    );

    // Fallback to OpenRouter
    if (!openRouterApiKey || openRouterApiKey === "your_api_key_here") {
      throw new Error(
        "Both OpenAI and OpenRouter API keys are not configured. Please add at least one API key to your .env file."
      );
    }

    console.log("Falling back to OpenRouter API...");

    const requestBody = {
      model: "mistralai/mistral-small-3.2-24b-instruct:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    };

    const fallbackResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Mystical Tarot Reader",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!fallbackResponse.ok) {
      const errorData = await fallbackResponse.json().catch(() => ({}));
      console.error("OpenRouter API Error:", errorData);
      throw new Error(
        errorData.error?.message ||
          errorData.message ||
          `OpenRouter API request failed with status ${fallbackResponse.status}: ${fallbackResponse.statusText}`
      );
    }

    const fallbackData = await fallbackResponse.json();

    if (
      !fallbackData.choices ||
      !fallbackData.choices[0] ||
      !fallbackData.choices[0].message
    ) {
      throw new Error("Unexpected OpenRouter API response format");
    }

    console.log("Successfully got response from OpenRouter API");
    return fallbackData.choices[0].message.content;
  }
}
