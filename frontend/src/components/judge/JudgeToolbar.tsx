"use client";

import React from "react";
import { Language, RunStatus } from "@/types/playground";
import { JobType } from "@/types/judge";

interface JudgeToolbarProps {
    title: string;
    connected: boolean;
    language: Language;
    onLanguageChange: (language: Language) => void;
    status: RunStatus;
    activeJobType: JobType | null;
    onRun: () => void;
    onSubmit: () => void;
}

const JudgeToolbar: React.FC<JudgeToolbarProps> = ({
    title,
    connected,
    language,
    onLanguageChange,
    status,
    activeJobType,
    onRun,
    onSubmit,
}) => {
    const isBusy = status === "queued" || status === "running";
    const isRunBusy = isBusy && activeJobType === "run";
    const isSubmitBusy = isBusy && activeJobType === "submit";

    return (
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-3">
                <h1 className="truncate text-lg font-semibold text-slate-800">{title}</h1>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
                    {connected ? "Connected" : "Disconnected"}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <select
                    value={language}
                    onChange={(e) => onLanguageChange(e.target.value as Language)}
                    disabled={isBusy}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none disabled:opacity-60"
                >
                    <option value="cpp">C++</option>
                    <option value="python">Python</option>
                </select>

                <button
                    onClick={onRun}
                    disabled={isBusy}
                    className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                        isBusy
                            ? "cursor-not-allowed bg-slate-100 text-slate-400"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                    {isRunBusy ? "Running…" : "Run"}
                </button>

                <button
                    onClick={onSubmit}
                    disabled={isBusy}
                    className={`rounded-md px-6 py-2 text-sm font-semibold text-white transition ${
                        isBusy ? "cursor-not-allowed bg-slate-300" : "bg-indigo-600 hover:bg-indigo-500"
                    }`}
                >
                    {isSubmitBusy ? "Submitting…" : "Submit"}
                </button>
            </div>
        </div>
    );
};

export default JudgeToolbar;
