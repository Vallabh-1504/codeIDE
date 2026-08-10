"use client";

import React from "react";
import { RunStatus } from "@/types/playground";

interface OutputPanelProps {
    status: RunStatus;
    output: string;
    error?: string;
}

const PANEL_STYLES: Record<RunStatus, string> = {
    idle: "bg-slate-50 border-slate-200",
    queued: "bg-slate-50 border-slate-200",
    running: "bg-slate-50 border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    error: "bg-red-50 border-red-200",
};

const OutputPanel: React.FC<OutputPanelProps> = ({ status, output, error }) => {
    const renderContent = () => {
        if (status === "queued" || status === "running") {
            return <span className="text-slate-500">Running your code…</span>;
        }
        if (status === "error") {
            return <span className="text-red-700">{error || "Something went wrong."}</span>;
        }
        if (status === "success") {
            return <span className="text-slate-800">{output || "(no output)"}</span>;
        }
        return <span className="text-slate-400">Run your code to see the output here.</span>;
    };

    return (
        <div className={`mt-4 flex h-[70%] flex-col rounded-md border p-3 ${PANEL_STYLES[status]}`}>
            <h3 className="mb-2 border-b border-black/5 pb-1 text-sm font-medium text-slate-500">Output</h3>
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-sm">{renderContent()}</pre>
        </div>
    );
};

export default OutputPanel;
