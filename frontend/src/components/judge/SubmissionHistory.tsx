"use client";

import React, { useState } from "react";
import { Submission } from "@/types/judge";

interface SubmissionHistoryProps {
    submissions: Submission[];
}

const STATUS_COLOR: Record<Submission["status"], string> = {
    Accepted: "text-emerald-700",
    "Wrong Answer": "text-red-700",
    "Time Limit Exceeded": "text-amber-700",
    "Runtime Error": "text-red-700",
    "Compile Error": "text-red-700",
    "Internal Error": "text-red-700",
};

const VERDICT_COLOR: Record<Submission["verdicts"][number]["status"], string> = {
    AC: "text-emerald-700",
    WA: "text-red-700",
    TLE: "text-amber-700",
    RE: "text-red-700",
    CE: "text-red-700",
};

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ submissions }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (submissions.length === 0) {
        return <p className="p-4 text-sm text-slate-400">No submissions yet for this problem.</p>;
    }

    return (
        <div className="flex h-full flex-col overflow-auto p-4">
            {submissions.map((submission) => (
                <button
                    key={submission._id}
                    onClick={() => setExpandedId(expandedId === submission._id ? null : submission._id)}
                    className="mb-2 rounded-md border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${STATUS_COLOR[submission.status]}`}>
                            {submission.status}
                        </span>
                        <span className="text-xs text-slate-400">
                            {new Date(submission.createdAt).toLocaleString()}
                        </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                        {submission.passedCases}/{submission.totalCases} passed · {submission.language} ·{" "}
                        {submission.totalTime}ms
                    </div>

                    {expandedId === submission._id && (
                        <div className="mt-3 border-t border-slate-100 pt-2">
                            {submission.totalCases === 0 ? (
                                <pre className="overflow-auto rounded bg-red-50 p-1.5 font-mono text-xs text-red-700">
                                    {submission.verdicts[0]?.errorDetails || "No further details available."}
                                </pre>
                            ) : (
                                <div className="space-y-1.5">
                                    {submission.verdicts.map((verdict, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="font-mono">Test {index + 1}:</span>
                                            <span className={`font-semibold ${VERDICT_COLOR[verdict.status]}`}>{verdict.status}</span>
                                            <span className="text-slate-400">{verdict.time}ms</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default SubmissionHistory;
