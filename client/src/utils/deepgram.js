// Deepgram Browser STT via native WebSocket (no SDK needed)
const DEEPGRAM_WS_URL = "wss://api.deepgram.com/v1/listen";

export const startDeepgramCapture = (onTranscript) => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

    if (!apiKey) {
        console.error("Missing VITE_DEEPGRAM_API_KEY");
        return null;
    }

    const state = {
        socket: null,
        mediaRecorder: null,
        stream: null,
        isAborted: false,
    };

    const initialize = async () => {
        try {
            // 1. Get microphone stream first
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (state.isAborted) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            state.stream = stream;

            // 2. Open WebSocket to Deepgram
            const params = new URLSearchParams({
                model: "nova-2",
                language: "en-US",
                smart_format: "true",
                punctuate: "true",
            });

            const socket = new WebSocket(`${DEEPGRAM_WS_URL}?${params}`, ["token", apiKey]);
            state.socket = socket;

            socket.onopen = () => {
                if (state.isAborted) return;
                console.log("Deepgram WebSocket connected");

                // 3. Start recording mic and piping chunks
                const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
                state.mediaRecorder = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                        socket.send(event.data);
                    }
                };

                mediaRecorder.start(250); // stream 250ms chunks
            };

            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "Results" && data.is_final) {
                        const transcript = data.channel?.alternatives?.[0]?.transcript;
                        if (transcript) {
                            onTranscript(transcript);
                        }
                    }
                } catch (err) {
                    console.error("Deepgram parse error:", err);
                }
            };

            socket.onerror = (err) => {
                console.error("Deepgram WebSocket error:", err);
            };

            socket.onclose = () => {
                console.log("Deepgram WebSocket closed");
            };
        } catch (err) {
            console.error("Failed to initialize Deepgram:", err);
        }
    };

    initialize();

    return state;
};

export const stopDeepgramCapture = (state) => {
    if (!state) return;

    state.isAborted = true;

    try {
        if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
            state.mediaRecorder.stop();
        }

        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
        }

        if (state.socket && state.socket.readyState === WebSocket.OPEN) {
            state.socket.close();
        }
    } catch (err) {
        console.error("Error stopping Deepgram:", err);
    }
};
