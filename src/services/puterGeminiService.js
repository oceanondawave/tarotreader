export async function getTarotReading(cards, question, language = "vi") {
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

    try {
        // Check if puter is available globally
        if (!window.puter) {
            throw new Error("Puter.js library not loaded. Please check your internet connection.");
        }

        // Check if user is signed in
        if (window.puter.auth && !window.puter.auth.isSignedIn()) {
            console.log("Starting Puter sign-in flow...");
            try {
                await window.puter.auth.signIn();
                console.log("Puter sign-in successful.");
            } catch (err) {
                console.error("Puter sign-in failed/cancelled");
                throw new Error("ERROR_PUTER_AUTH");
            }
        }

        // using gemini-3-flash-preview as requested for speed
        const response = await window.puter.ai.chat(prompt, { model: "gemini-3-flash-preview" });

        if (typeof response === "string") {
            return response;
        } else if (response?.message?.content) {
            return response.message.content;
        } else if (response?.text) {
            return response.text;
        } else {
            // Fallback: try to stringify if it's an object we don't recognize
            return JSON.stringify(response);
        }

    } catch (error) {
        console.error("Puter Gemini API failed:", error.message);

        // Re-throw specific errors to be handled by the UI
        if (error.message === "ERROR_PUTER_AUTH") {
            throw error;
        }

        throw new Error("ERROR_API_FAILED");
    }
}
