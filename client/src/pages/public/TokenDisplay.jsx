import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Loader2, Activity } from 'lucide-react';
import apiClient from '../../api/apiClient';

function TokenDisplay() {
    const { clinicId } = useParams();
    const [clinicName, setClinicName] = useState('Loading Clinic...');
    const [currentToken, setCurrentToken] = useState(null);
    const [waitingTokens, setWaitingTokens] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        if (!currentToken) return;
        setFlash(true);
        const timer = setTimeout(() => setFlash(false), 1000);
        return () => clearTimeout(timer);
    }, [currentToken?.tokenNumber]);

    // Fetch initial clinic details 
    useEffect(() => {
        const fetchClinic = async () => {
            try {
                // We'll use a basic public or existing route to get the clinic name if possible, 
                // but since it's public we might just rely on the first socket emit if we don't have a public clinic endpoint, 
                // or we can just fetch it directly if such endpoint exists.
                // Assuming `/api/v1/clinics/${clinicId}` is public or we just fetch it.
                // We'll wrap it in try catch and ignore if it fails, relying on the live data to populate.
                const res = await apiClient.get(`/clinics/${clinicId}`);
                setClinicName(res.data.data.name);
            } catch (err) {
                console.log('Could not fetch clinic name initially, will wait for socket data', err);
            }
        };
        fetchClinic();
    }, [clinicId]);

    useEffect(() => {
        // Initialize socket connection to the backend
        // Make sure the port matches the backend environment variable
        const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', ''));

        socket.on('connect', () => {
            setIsConnected(true);
            setError(null);
            // Join the specific clinic's room
            socket.emit('join:clinic', clinicId);
        });

        socket.on('connect_error', (err) => {
            setIsConnected(false);
            setError('Connection lost. Attempting to reconnect...');
            console.error('Socket connection error:', err);
        });

        // Listen for real-time token updates
        socket.on('token:update', (data) => {
            if (data.currentToken) {
                setCurrentToken(data.currentToken);
            } else {
                setCurrentToken(null);
            }
            if (data.waitingTokens) {
                setWaitingTokens(data.waitingTokens);
            }
        });

        // Cleanup on unmount
        return () => {
            socket.emit('leave:clinic', clinicId);
            socket.disconnect();
        };
    }, [clinicId]);


    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-indigo-500/30">
            {/* Top Bar */}
            <header className="h-24 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-10 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{clinicName}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span className={`text-sm font-semibold uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isConnected ? 'Live Overview' : 'Reconnecting...'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-slate-400 text-lg font-medium tracking-wide uppercase">Now Serving</h2>
                </div>
            </header>

            {/* Error Banner */}
            {error && !isConnected && (
                <div className="bg-red-500/10 border-b border-red-500/20 px-10 py-3 flex items-center justify-center">
                    <p className="text-red-400 font-medium">{error}</p>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">

                {/* Left Side - Current Token (Massive) */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 relative border-b lg:border-b-0 lg:border-r border-slate-800/50 overflow-hidden min-h-[50vh] lg:min-h-0">
                    {/* Background glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

                    {currentToken ? (
                        <>
                            <p className="text-slate-400 text-lg sm:text-2xl font-semibold tracking-widest uppercase mb-4 sm:mb-6">Token Number</p>
                            <h2 className={`text-[6rem] sm:text-[10rem] lg:text-[14rem] leading-none font-black tracking-tighter drop-shadow-2xl transition-all duration-500 ${flash ? 'scale-110 text-emerald-400 drop-shadow-[0_0_50px_rgba(52,211,153,0.8)]' : 'text-white'}`}>
                                {currentToken.tokenNumber}
                            </h2>
                            <div className={`mt-6 sm:mt-8 px-6 sm:px-8 py-3 sm:py-4 border rounded-2xl backdrop-blur-sm transition-colors duration-500 ${flash ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-indigo-500/20 border-indigo-500/30'}`}>
                                <p className={`text-xl sm:text-3xl font-bold transition-colors duration-500 ${flash ? 'text-emerald-300' : 'text-indigo-300'}`}>
                                    {currentToken.patient?.name ? currentToken.patient.name : 'Patient Name Withheld'}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center px-4">
                            <Activity className="w-16 h-16 sm:w-24 sm:h-24 text-slate-700 mb-6 sm:mb-8" />
                            <h2 className="text-3xl sm:text-5xl font-bold text-slate-500 mb-2 sm:mb-4">Please Wait</h2>
                            <p className="text-lg sm:text-2xl text-slate-600">The doctor is preparing to call the next patient.</p>
                        </div>
                    )}
                </div>

                {/* Right Side - Up Next Queue */}
                <div className="w-full lg:w-[450px] bg-slate-900/50 flex flex-col">
                    <div className="p-6 sm:p-8 border-b border-slate-800 shrink-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-between">
                            Up Next
                            <span className="bg-slate-800 text-slate-300 text-xs sm:text-sm py-1 px-3 rounded-full font-bold">
                                {waitingTokens.length} Waiting
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {waitingTokens.length > 0 ? (
                            waitingTokens.slice(0, 5).map((token, index) => (
                                <div
                                    key={token._id}
                                    className={`p-6 rounded-2xl flex items-center justify-between border ${index === 0
                                        ? 'bg-slate-800/80 border-slate-700 shadow-lg scale-[1.02] transform transition-transform'
                                        : 'bg-slate-800/30 border-slate-800/50 opacity-80'
                                        }`}
                                >
                                    <div>
                                        <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">
                                            {index === 0 ? 'Next in line' : `Position #${index + 1}`}
                                        </p>
                                        <p className="text-xl font-bold text-slate-200">
                                            {token.patient?.name ? token.patient.name : 'Patient'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-3xl font-black text-indigo-400">
                                            #{token.tokenNumber}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 p-8 text-center">
                                <Loader2 className="w-12 h-12 animate-spin opacity-20" />
                                <p className="text-lg font-medium">No other patients in queue</p>
                            </div>
                        )}

                        {waitingTokens.length > 5 && (
                            <div className="text-center p-4">
                                <p className="text-slate-500 font-medium">
                                    + {waitingTokens.length - 5} more patients waiting
                                </p>
                            </div>
                        )}
                    </div>
                </div>

            </main>

            {/* Bottom Marquee / Footer */}
            <footer className="h-16 bg-indigo-600 flex items-center justify-center shrink-0 px-4 text-center">
                <p className="text-sm sm:text-xl font-bold text-white tracking-wide truncate">
                    Please wait for your token number to be displayed on the screen.
                </p>
            </footer>
        </div>
    );
}

export default TokenDisplay;
