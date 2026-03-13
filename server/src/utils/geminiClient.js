/**
 * Utility for interacting with Google Gemini v1 REST API
 */

export const sendToGemini = async (promptText) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds max

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: promptText }
                        ]
                    }
                ]
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gemini API call failed: Status ${response.status} - ${errorData}`);
        }

        const data = await response.json();

        // Safely extract the generated text from Gemini's response structure
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
            return data.candidates[0].content.parts[0].text;
        }

        throw new Error("Unexpected response structure from Gemini API");
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error("Gemini API request timed out after 10 seconds");
        }
        console.error('Error in sendToGemini:', error.message);
        throw error;
    }
};
