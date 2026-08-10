"use client";

import React, { useState } from "react";
import { Language, RunStatus } from "@/types/playground";

interface ToolbarProps {
    roomId: string;
    connected: boolean;
    language: Language;
    onLanguageChange: (language: Language) => void;
    status: RunStatus;
    onRun: () => void;
}

const RUN_LABEL: Record<RunStatus, string> = {
    idle: "Run",
    queued: "Queued…",
    running: "Running…",
    success: "Run",
    error: "Run",
};

const Toolbar: React.FC<ToolbarProps> = ({ roomId, connected, language, onLanguageChange, status, onRun }) => {
    const [copied, setCopied] = useState(false);
    const isBusy = status === "queued" || status === "running";

    const copyInviteLink = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
                <h1 className="text-lg font-semibold text-slate-800">CodeStudio</h1>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
                    {connected ? "Connected" : "Disconnected"}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={copyInviteLink}
                    className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                    Room: <span className="font-mono text-slate-800">{roomId}</span>
                    <span className="text-indigo-600">{copied ? "Copied!" : "Copy link"}</span>
                </button>

                <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none"
                >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                </select>

                <button
                    onClick={onRun}
                    disabled={isBusy}
                    className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition ${
                        isBusy ? "cursor-not-allowed bg-slate-300" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                >
                    {RUN_LABEL[status]}
                </button>
            </div>
        </div>
    );
};

export default Toolbar;
