import { useState } from 'react';
import {
    Brain,
    Upload,
    FileText,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    Loader2,
    ShieldCheck,
    Lightbulb,
    Activity,
    Info,
    X,
} from 'lucide-react';

function AIHealthInsights() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState('');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload PDF, JPG, or PNG files only');
                setSelectedFile(null);
                return;
            }
            setSelectedFile(file);
            setError('');
            setInsights(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('Please select a file to analyze');
            return;
        }

        setAnalyzing(true);
        setError('');

        // Simulate AI analysis delay
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Simulate AI response
        setInsights({
            summary: 'Based on the uploaded report, your overall health indicators appear to be within normal ranges. The report shows standard values for most tested parameters.',
            conditions: [
                { name: 'Vitamin D Levels', status: 'attention', description: 'Slightly below optimal range' },
                { name: 'Cholesterol', status: 'normal', description: 'Within healthy limits' },
                { name: 'Blood Pressure', status: 'normal', description: 'Normal range' },
            ],
            actions: [
                'Consider increasing Vitamin D intake through diet or supplements',
                'Maintain current exercise routine',
                'Schedule a follow-up test in 3 months',
                'Stay hydrated and maintain balanced nutrition',
            ],
        });

        setAnalyzing(false);
    };

    const clearResults = () => {
        setSelectedFile(null);
        setInsights(null);
        const fileInput = document.getElementById('ai-file-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-8 h-8 text-white" />
                    <h1 className="text-2xl font-bold text-white">AI Health Insights</h1>
                </div>
                <p className="text-blue-100">
                    Understand your medical reports with AI-powered insights
                </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Analyze Your Report</h2>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* File Input */}
                    <div>
                        <input
                            type="file"
                            id="ai-file-input"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="ai-file-input"
                            className="flex items-center justify-center gap-3 w-full p-8 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors bg-blue-50/50"
                        >
                            <Upload className="w-8 h-8 text-blue-500" />
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">
                                    {selectedFile ? selectedFile.name : 'Upload medical report'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PDF, JPG, or PNG files supported
                                </p>
                            </div>
                        </label>
                    </div>

                    {selectedFile && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-gray-700">{selectedFile.name}</span>
                            </div>
                            <button
                                onClick={clearResults}
                                className="p-1 hover:bg-blue-100 rounded"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>
                    )}

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing || !selectedFile}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Analyzing with AI...
                            </>
                        ) : (
                            <>
                                <Brain className="w-5 h-5" />
                                Analyze Report
                            </>
                        )}
                    </button>

                    {/* Security Note */}
                    <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Your data is processed securely and not stored</span>
                    </div>
                </div>
            </div>

            {/* Insights Output Section */}
            {insights ? (
                <div className="space-y-4">
                    {/* Summary Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-800">Summary</h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">{insights.summary}</p>
                    </div>

                    {/* Conditions Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-800">Possible Conditions</h3>
                        </div>
                        <div className="space-y-3">
                            {insights.conditions.map((condition, index) => (
                                <div
                                    key={index}
                                    className={`p-4 rounded-lg border ${condition.status === 'attention'
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-green-50 border-green-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {condition.status === 'attention' ? (
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        )}
                                        <span className="font-medium text-gray-800">{condition.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 ml-6">{condition.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions Card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-800">Suggested Actions</h3>
                        </div>
                        <ul className="space-y-2">
                            {insights.actions.map((action, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-gray-600 font-medium">Upload a report to see AI insights</p>
                    <p className="text-gray-400 text-sm mt-1">
                        Our AI will analyze your medical documents and provide insights
                    </p>
                </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">Important Notice</p>
                        <p className="text-sm text-amber-700 mt-1">
                            AI insights are for informational purposes only and not a medical diagnosis.
                            Always consult a qualified healthcare professional for medical advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AIHealthInsights;
