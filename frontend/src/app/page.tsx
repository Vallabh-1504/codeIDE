"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { randomid } from "ksort-id";
import { getQuestions } from "@/lib/api";
import { QuestionSummary } from "@/types/judge";

const Home = () => {
    const router = useRouter();
    const [questions, setQuestions] = useState<QuestionSummary[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        getQuestions()
            .then(setQuestions)
            .catch(() => setLoadError("Failed to load questions"));
    }, []);

    const createRoom = () => {
        const roomId = randomid(5); // unique id
        router.push(`/room/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <h1 className="text-xl font-semibold text-slate-800">CodeStudio</h1>
                <button
                    onClick={createRoom}
                    className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Create Playground Room
                </button>
            </div>

            <div className="mx-auto max-w-3xl px-6 py-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-800">Problems</h2>

                {loadError && <p className="text-sm text-red-700">{loadError}</p>}

                {!loadError && questions.length === 0 && (
                    <p className="text-sm text-slate-400">No problems available yet.</p>
                )}

                <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    {questions.map((question, index) => (
                        <button
                            key={question.questionId}
                            onClick={() => router.push(`/judge/${question.questionId}`)}
                            className={`flex w-full items-center gap-4 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                                index !== 0 ? "border-t border-slate-100" : ""
                            }`}
                        >
                            <span className="w-8 text-slate-400">{question.questionId}.</span>
                            <span className="font-medium text-slate-800">{question.title}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
