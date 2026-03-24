import { analyzeReceptionistIntent } from "../utils/groqClient.js";
import { generateVoice } from "../utils/elevenlabsClient.js";
import Doctor from "../models/doctor.model.js";
import Appointment from "../models/appointment.model.js";

// Helper: attach TTS audio to any response
const sendWithVoice = async (res, data) => {
    try {
        const audioBuffer = await generateVoice(data.message);
        if (audioBuffer) {
            data.audio = audioBuffer.toString("base64");
        }
    } catch (err) {
        console.error("⚠️ ElevenLabs TTS failed (non-blocking):", err.message);
    }
    return res.json(data);
};


const sessionStore = new Map();

export const chatWithReceptionist = async (req, res) => {
    try {
        console.log("📩 Incoming transcript:", req.body);

        const { message, doctorId } = req.body;

        // ─── Validate request ───
        if (!message) {
            return res.status(400).json({
                success: false,
                message: "No message provided",
            });
        }

        const userId = req.user.id;

        if (!sessionStore.has(userId)) {
            sessionStore.set(userId, {
                date: null,
                time: null,
                step: "collecting",
                pendingBooking: {},
                history: [],
            });
        }

        const session = sessionStore.get(userId);
        const { history } = session;

        // ─── Confirmation Phase ───
        if (session.step === "confirming") {
            const lowerMsg = message.toLowerCase().trim();

            if (lowerMsg.includes("yes") || lowerMsg.includes("confirm") || lowerMsg.includes("book")) {
                const { parsedDate, selectedTime } = session.pendingBooking;

                // Fetch doctor directly from request doctorId
                const doctor = await Doctor.findById(doctorId).populate("user", "name");
                if (!doctor) {
                    return sendWithVoice(res, {
                        message: "Doctor not found.",
                        type: "NO_DOCTOR",
                    });
                }

                try {
                    console.log("📋 Booking data (confirm):", {
                        patient: req.user.id,
                        doctor: doctorId,
                        clinic: doctor.clinic,
                        date: parsedDate,
                        time: selectedTime
                    });

                    const appointment = await Appointment.create({
                        patient: req.user.id,
                        doctor: doctorId,
                        clinic: doctor.clinic,
                        date: parsedDate,
                        time: selectedTime,
                        status: "BOOKED",
                    });

                    if (!appointment) {
                        throw new Error("Appointment not created");
                    }

                    console.log("✅ Saved appointment (confirm):", appointment);
                    sessionStore.delete(userId);

                    const doctorName = doctor.user?.name || "the doctor";
                    return sendWithVoice(res, {
                        success: true,
                        type: "BOOKING_CONFIRMED",
                        message: `Your appointment with Dr. ${doctorName} has been booked successfully.`,
                        appointment
                    });
                } catch (err) {
                    console.error("Booking Error:", err);
                    return sendWithVoice(res, {
                        success: false,
                        type: "BOOKING_FAILED",
                        message: "Unable to book appointment"
                    });
                }
            }

            if (lowerMsg.includes("no") || lowerMsg.includes("cancel") || lowerMsg.includes("don't")) {
                // Clear session on cancel
                sessionStore.delete(userId);

                return sendWithVoice(res, {
                    message: "No problem! The booking has been cancelled. Is there anything else I can help you with?",
                });
            }

            // If unclear, ask again
            return sendWithVoice(res, {
                message: "I didn't quite catch that. Would you like me to confirm this booking? Please say yes or no.",
            });
        }

        // ─── Collecting Phase ───
        history.push({
            role: "user",
            content: message,
        });

        // CALL GROQ (safe)
        let intentData;
        try {
            intentData = await analyzeReceptionistIntent(history);
        } catch (err) {
            console.error("❌ Groq call error:", err);
            return sendWithVoice(res, {
                message: "Sorry, I couldn't process that. Please try again.",
                type: "AI_ERROR",
            });
        }

        console.log("Parsed AI:", intentData);

        // SAFETY CHECK: if Groq returned nothing usable
        if (!intentData || typeof intentData !== "object") {
            return sendWithVoice(res, {
                message: "Sorry, I didn't understand that. Please try again.",
                type: "PARSE_ERROR",
            });
        }

        history.push({
            role: "assistant",
            content: JSON.stringify(intentData),
        });

        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }

        const intent = intentData;

        // ─── Merge AI Extracted Data into Session ───
        if (intent.date && intent.date !== "null") {
            session.date = intent.date;
        }

        if (intent.time && intent.time !== "null") {
            session.time = intent.time;
        }

        // ─── 1️⃣ Check Missing Fields ───
        if (!session.date || !session.time) {
            return sendWithVoice(res, {
                message: intent.response || "How can I help you?",
                type: "INCOMPLETE_DATA",
                intent,
            });
        }

        // ─── 2️⃣ Validate Time ───
        const parseTime24 = (t) => {
            const timeLower = t.toLowerCase().replace(/\s/g, '');
            const ampmMatch = timeLower.match(/am|pm/);
            const numMatch = timeLower.match(/\d+/g);
            if (!numMatch) return NaN;
            
            let h = parseInt(numMatch[0]);
            let m = numMatch[1] ? parseInt(numMatch[1]) : 0;
            
            if (ampmMatch) {
                if (ampmMatch[0] === 'pm' && h < 12) h += 12;
                if (ampmMatch[0] === 'am' && h === 12) h = 0;
            }
            return h + (m / 60);
        };

        const timeVal = parseTime24(session.time);
        if (isNaN(timeVal) || timeVal < 8 || timeVal > 20) {
            session.time = null;
            return sendWithVoice(res, {
                message: "Appointments are available between 8 AM and 8 PM. Please choose another time.",
                type: "INCOMPLETE_DATA",
                intent,
            });
        }

        // ─── 3️⃣ All valid → Fetch Doctor by ID ───
        const doctor = await Doctor.findById(doctorId).populate("user", "name");

        if (!doctor) {
            return sendWithVoice(res, {
                message: "Doctor not found.",
                type: "NO_DOCTOR",
            });
        }

        // Parse date
        let parsedDate;
        if (session.date.toLowerCase() === "tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            parsedDate = tomorrow.toISOString().split("T")[0];
        } else {
            parsedDate = session.date;
        }

        const selectedTime = session.time;
        const doctorName = doctor.user?.name || "the doctor";

        // ─── 4️⃣ Confirm before booking ───
        session.step = "confirming";
        session.pendingBooking = { parsedDate, selectedTime };

        return sendWithVoice(res, {
            message: `I have an appointment with Dr. ${doctorName} on ${parsedDate} at ${selectedTime}. Shall I confirm this booking?`,
            type: "CONFIRM_BOOKING",
        });
    } catch (error) {
        console.error("❌ CRITICAL ERROR:", error);
        return res.status(200).json({
            success: false,
            message: "Something went wrong, please try again.",
            type: "SAFE_FALLBACK",
        });
    }
};
