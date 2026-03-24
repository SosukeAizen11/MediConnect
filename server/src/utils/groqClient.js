import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const sendToGroq = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error with Groq AI client:", error);
    throw new Error("Failed to get AI analysis from Groq");
  }
};

export const analyzeReceptionistIntent = async (history) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an AI receptionist inside a hospital web application.

Context:
* The doctor is ALREADY selected by the patient from the UI.
* DO NOT ask for the doctor's name. Never mention choosing a doctor.

Your ONLY job is to extract the appointment date and time from the conversation.

Return ONLY valid JSON:

{
"date": "string or null",
"time": "string or null",
"response": "natural conversational reply"
}

IMPORTANT RULES:

* Be conversational and friendly (like a phone receptionist)
* Ask ONLY for missing info (date and/or time)
* If both date and time are present → confirm the booking
* DO NOT ask for doctor name, patient name, or patient ID

Examples:

User: tomorrow at 3
Output:
{
"date": "tomorrow",
"time": "3 PM",
"response": "Booking your appointment for tomorrow at 3 PM."
}

User: I want to book an appointment
Output:
{
"date": null,
"time": null,
"response": "Sure! What date and time would work best for you?"
}

User: tomorrow
Output:
{
"date": "tomorrow",
"time": null,
"response": "Got it, tomorrow! What time would you prefer?"
}

User: at 5 in the evening
Output:
{
"date": null,
"time": "5 PM",
"response": "5 PM works. Which date would you like?"
}`
        },
        ...history
      ],
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(aiResponse);
    } catch (parseErr) {
      console.error("⚠️ Groq JSON parse failed, raw response:", aiResponse);
      parsed = {
        date: null,
        time: null,
        response: "Sorry, I couldn't understand that. Please try again."
      };
    }
    console.log("Parsed AI:", parsed);
    return parsed;
  } catch (error) {
    console.error("❌ Groq AI client error:", error);
    return {
      date: null,
      time: null,
      response: "Sorry, I couldn't understand that. Please try again."
    };
  }
};
