import Groq from "groq-sdk";

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

/**
 * Sends extracted medical report text to Groq for AI explanation.
 * @param {string} promptText - The cleaned text extracted from the medical report.
 * @returns {Promise<string>} - The AI-generated explanation.
 */
export const sendToGroq = async (promptText) => {
    try {
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a medical report explanation assistant. Explain reports clearly and safely without diagnosing diseases.",
                },
                {
                    role: "user",
                    content: promptText,
                },
            ],
            temperature: 0.3,
            max_tokens: 1200,
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Groq API Error:", error.message);
        throw new Error(
            `Failed to get AI analysis from Groq: ${error.message}`
        );
    }
};
