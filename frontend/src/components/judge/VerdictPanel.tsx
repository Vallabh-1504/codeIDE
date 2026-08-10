"use client";

import React from "react";
import { RunStatus } from "@/types/playground";
import { JudgeJobSandboxResult, JudgeStatus, VerdictStatus } from "@/types/judge";

interface VerdictPanelProps {
    status: RunStatus;
    result?: JudgeJobSandboxResult;
    jobError?: string;
}

const STATUS_BADGE: Record<JudgeStatus, string> = {
    Accepted: "bg-emerald-100 text-emerald-700",
    "Wrong Answer": "bg-red-100 text-red-700",
    "Time Limit Exceeded": "bg-amber-100 text-amber-700",
    "Runtime Error": "bg-red-100 text-red-700",
    "Compile Error": "bg-red-100 text-red-700",
    "Internal Error": "bg-red-100 text-red-700",
};

const VERDICT_BADGE: Record<VerdictStatus, string> = {
    AC: "bg-emerald-100 text-emerald-700",
    WA: "bg-red-100 text-red-700",
    TLE: "bg-amber-100 text-amber-700",
    RE: "bg-red-100 text-red-700",
    CE: "bg-red-100 text-red-700",
};

const VerdictPanel: React.FC<VerdictPanelProps> = ({ status, result, jobError }) => {
    const renderBody = () => {
        if (status === "queued" || status === "running") {
            return <p className="text-sm text-slate-500">Judging your code…</p>;
        }
        if (status === "error") {
            return <p className="text-sm text-red-700">{jobError || "Something went wrong."}</p>;
        }
        if (status === "success" && result) {
            const ranNoTests = result.totalCases === 0;

            return (
                <>
                    <div className="mb-3 flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_BADGE[result.status]}`}>
                            {result.status}
                        </span>
                        {!ranNoTests && (
                            <span className="text-sm text-slate-600">
                                {result.passedCases}/{result.totalCases} passed · {result.totalTime}ms
                            </span>
                        )}
                    </div>

                    {ranNoTests ? (
                        <pre className="overflow-auto rounded-md bg-red-50 p-2 font-mono text-xs text-red-700">
                            {result.verdicts[0]?.errorDetails || "No further details available."}
                        </pre>
                    ) : (
                        <div className="space-y-2">
                            {result.verdicts.map((verdict, index) => (
                                <div key={index} className="rounded-md border border-slate-200 p-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${VERDICT_BADGE[verdict.status]}`}>
                                            {verdict.status}
                                        </span>
                                        <span className="text-xs text-slate-500">Test {index + 1} · {verdict.time}ms</span>
                                    </div>

                                    {(verdict.expectedOutput !== undefined || verdict.actualOutput !== undefined) && (
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            <div>
                                                <div className="mb-1 text-xs font-medium text-slate-400">Expected</div>
                                                <pre className="overflow-auto rounded bg-slate-50 p-1.5 font-mono text-xs text-slate-800">
                                                    {verdict.expectedOutput}
                                                </pre>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-xs font-medium text-slate-400">Actual</div>
                                                <pre className="overflow-auto rounded bg-slate-50 p-1.5 font-mono text-xs text-slate-800">
                                                    {verdict.actualOutput}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {verdict.errorDetails && (
                                        <pre className="mt-2 overflow-auto rounded bg-red-50 p-1.5 font-mono text-xs text-red-700">
                                            {verdict.errorDetails}
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            );
        }
        return <p className="text-sm text-slate-400">Run or Submit to see results here.</p>;
    };

    return (
        <div className="mt-4 flex h-[50%] flex-col overflow-auto rounded-md border border-slate-200 bg-white p-3">
            <h3 className="mb-2 border-b border-slate-100 pb-1 text-sm font-medium text-slate-500">Result</h3>
            {renderBody()}
        </div>
    );
};

export default VerdictPanel;
