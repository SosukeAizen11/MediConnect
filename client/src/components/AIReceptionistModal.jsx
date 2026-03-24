import { useState, useRef, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import apiClient from '../api/apiClient';
import { startDeepgramCapture, stopDeepgramCapture } from '../utils/deepgram';

function AIReceptionistModal({ isOpen, onClose, doctor }) {
    const doctorId = doctor?._id;
    const doctorName = doctor?.user?.name;
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [aiMessage, setAiMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [mute, setMute] = useState(false);
    const [conversationActive, setConversationActive] = useState(true);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioPlayerRef = useRef(null);

    // ─── ElevenLabs Audio Playback ───
    const playElevenLabsAudio = (base64Audio) => {
        // Stop previous audio
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current = null;
        }

        if (mute || !base64Audio) {
            // If muted or no audio, auto-start listening after a delay
            setTimeout(() => startListening(), 1000);
            return;
        }

        try {
            const audioBlob = new Blob(
                [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
                { type: "audio/mpeg" }
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioPlayer = new Audio(audioUrl);
            audioPlayerRef.current = audioPlayer;

            audioPlayer.onended = () => {
                URL.revokeObjectURL(audioUrl);
                audioPlayerRef.current = null;
                setTimeout(() => startListening(), 1000);
            };

            audioPlayer.play().catch(err => {
                console.error("Audio play failed:", err);
                setTimeout(() => startListening(), 1000);
            });
        } catch (err) {
            console.error("ElevenLabs audio decode error:", err);
            setTimeout(() => startListening(), 1000);
        }
    };

    // Cleanup deepgram on close
    useEffect(() => {
        if (!isOpen) {
            setListening(false);
            setTranscript('');
            setMessages([]);
            setConversationActive(true);
            
            if (recognitionRef.current) {
                stopDeepgramCapture(recognitionRef.current);
                recognitionRef.current = null;
            }
        } else {
            setConversationActive(true);
            const initialGreeting = "Hello, you have reached the clinic. How can I assist you today?";
            setMessages([{ role: "ai", text: initialGreeting }]);
            // No ElevenLabs audio for initial greeting (no API call), just auto-listen
            setTimeout(() => startListening(), 2000);
        }

        return () => {
            if (recognitionRef.current) {
                stopDeepgramCapture(recognitionRef.current);
                recognitionRef.current = null;
            }
        };
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, transcript]);

    const handleUserTranscript = async (text) => {
        setTranscript(text);
        setListening(false);
        setMessages(prev => [...prev, { role: "user", text }]);

        if (recognitionRef.current) {
            stopDeepgramCapture(recognitionRef.current);
            recognitionRef.current = null;
        }

        try {
            const response = await apiClient.post('/ai-receptionist/chat', {
                message: text,
                doctorId,
            });
            console.log('AI receptionist response:', response.data);

            const { message: aiMsg, audio } = response.data;
            
            if (response.data.type === "BOOKING_CONFIRMED") {
                setAiMessage(aiMsg);
                setMessages(prev => [...prev, { role: "ai", text: aiMsg }]);
                setListening(false);
                setConversationActive(false);
                playElevenLabsAudio(audio);
            } else if (aiMsg) {
                setAiMessage(aiMsg);
                setMessages(prev => [...prev, { role: "ai", text: aiMsg }]);
                playElevenLabsAudio(audio);
            }
        } catch (err) {
            console.error('AI receptionist API error:', err);
        }
    };

    const startListening = () => {
        if (!conversationActive) return;
        
        // Stop any existing session
        if (recognitionRef.current) {
            stopDeepgramCapture(recognitionRef.current);
        }

        setTranscript('');
        setListening(true);
        recognitionRef.current = startDeepgramCapture(handleUserTranscript);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 z-10">
                {/* Close icon */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Title and Mute Toggle */}
                <div className="flex justify-between items-center mb-4 mt-2">
                    <h2 className="text-xl font-bold text-gray-800">
                        🎤 AI Receptionist
                    </h2>
                    <button
                        onClick={() => {
                            if (!mute) window.speechSynthesis.cancel();
                            setMute(!mute);
                        }}
                        className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-gray-700 font-medium flex items-center gap-1"
                    >
                        {mute ? "🔇 Unmute" : "🔊 Mute"}
                    </button>
                </div>

                {/* Doctor context */}
                {doctor && (
                    <p className="text-sm text-gray-500 mb-4">
                        Speaking with receptionist for{' '}
                        <span className="font-medium text-gray-700">
                            Dr. {doctor.user?.name || 'Unknown'}
                        </span>
                    </p>
                )}

                {/* Mic icon + instruction */}
                <div className="flex flex-col items-center py-6">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                            listening
                                ? 'bg-red-100 animate-pulse'
                                : 'bg-blue-50'
                        }`}
                    >
                        <Mic
                            className={`w-8 h-8 ${
                                listening ? 'text-red-500' : 'text-blue-600'
                            }`}
                        />
                    </div>
                    <p className="text-gray-700 text-center font-medium">
                        {listening
                            ? 'Listening… speak now'
                            : 'Click the button and tell me how I can help you.'}
                    </p>
                </div>

                {/* Chat Messages Display */}
                <div className="flex flex-col gap-3 my-4 overflow-y-auto max-h-60 p-2 border-t border-b border-gray-100">
                    {messages.map((msg, index) => (
                        <div key={index} className={msg.role === "user" ? "text-right" : "text-left"}>
                            <div className={`inline-block p-2.5 rounded-lg text-sm max-w-[85%] ${
                                msg.role === "user" 
                                    ? "bg-blue-600 text-white rounded-br-none" 
                                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                            }`}>
                                {msg.role === "ai" && "🤖 "}
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Example prompts */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Examples
                    </p>
                    <ul className="space-y-1.5 text-sm text-gray-600">
                        <li>• Book appointment with Dr Sumeet tomorrow</li>
                        <li>• What time is doctor available?</li>
                        <li>• Cancel my appointment</li>
                    </ul>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                    {listening ? (
                        <button
                            onClick={() => {
                                if (recognitionRef.current) {
                                    stopDeepgramCapture(recognitionRef.current);
                                    recognitionRef.current = null;
                                }
                                if (audioPlayerRef.current) {
                                    audioPlayerRef.current.pause();
                                    audioPlayerRef.current = null;
                                }
                                setListening(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors bg-red-500 text-white hover:bg-red-600"
                        >
                            <X className="w-4 h-4" />
                            Stop Conversation
                        </button>
                    ) : (
                        <button
                            onClick={startListening}
                            disabled={!conversationActive}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                !conversationActive 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                            <Mic className="w-4 h-4" />
                            Start Speaking
                        </button>
                    )}
                    
                    {!conversationActive && (
                        <p className="text-center text-sm font-medium text-green-600 mt-1">
                            Conversation ended. Appointment booked.
                        </p>
                    )}
                    
                    <button
                        onClick={() => {
                            if (audioPlayerRef.current) {
                                audioPlayerRef.current.pause();
                                audioPlayerRef.current = null;
                            }
                            onClose();
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIReceptionistModal;
