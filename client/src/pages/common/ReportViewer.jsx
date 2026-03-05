import { useSearchParams } from "react-router-dom";

export default function ReportViewer() {
    const [params] = useSearchParams();
    const url = params.get("url");

    if (!url) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-gray-500">No report URL provided.</p>
            </div>
        );
    }

    return (
        <div style={{ height: "100vh", width: "100%", margin: 0, padding: 0, overflow: "hidden" }}>
            <iframe
                src={url}
                title="Medical Report Viewer"
                width="100%"
                height="100%"
                style={{ border: "none" }}
            />
        </div>
    );
}
