"use client";

import React, { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { isAxiosError } from "axios";
import { Group, Panel, Separator } from "react-resizable-panels";

import EditorPane from "@/components/shared/EditorPane";
import JudgeToolbar from "./JudgeToolbar";
import ProblemPanel from "./ProblemPanel";
import VerdictPanel from "./VerdictPanel";
import SubmissionHistory from "./SubmissionHistory";
import { createSocket } from "@/lib/socket";
import { getQuestion, getSubmissions, submitJudge } from "@/lib/api";
import { getAnonId } from "@/lib/identity";
import { JUDGE_TEMPLATES } from "@/lib/judgeTemplates";
import { Language, RunStatus } from "@/types/playground";
import { JobType, JudgeJobSandboxResult, JudgeResultEvent, Question, Submission } from "@/types/judge";

interface JudgeWorkspaceProps {
    questionId: number;
}

type Tab = "problem" | "submissions";

const JudgeWorkspace: React.FC<JudgeWorkspaceProps> = ({ questionId }) => {
    const [question, setQuestion] = useState<Question | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("problem");

    const [connected, setConnected] = useState(false);
    const [language, setLanguage] = useState<Language>("cpp");
    const [codeByLanguage, setCodeByLanguage] = useState<Record<Language, string>>(JUDGE_TEMPLATES);
    const [status, setStatus] = useState<RunStatus>("idle");
    const [activeJobType, setActiveJobType] = useState<JobType | null>(null);
    const [result, setResult] = useState<JudgeJobSandboxResult>();
    const [jobError, setJobError] = useState<string>();
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    const anonIdRef = useRef<string>("");
    const socketRef = useRef<Socket | null>(null);
    const lastJobIdRef = useRef<string | null>(null);
    const activeJobTypeRef = useRef<JobType | null>(null);

    useEffect(() => {
        anonIdRef.current = getAnonId();

        getQuestion(questionId)
            .then(setQuestion)
            .catch((err) => {
                const message = isAxiosError(err) ? err.response?.data?.error : undefined;
                setLoadError(message || "Failed to load question");
            });

        getSubmissions(anonIdRef.current, questionId)
            .then(setSubmissions)
            .catch(() => setSubmissions([]));
    }, [questionId]);

    useEffect(() => {
        const socket = createSocket();
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("join-room", anonIdRef.current);
        });

        socket.on("disconnect", () => setConnected(false));

        socket.on("judge-result", (data: JudgeResultEvent) => {
            if (data.jobId !== lastJobIdRef.current) return;
            setStatus(data.success ? "success" : "error");
            setResult(data.data);
            setJobError(data.error);

            if (data.success && activeJobTypeRef.current === "submit") {
                getSubmissions(anonIdRef.current, questionId)
                    .then(setSubmissions)
                    .catch(() => undefined);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [questionId]);

    const runJob = async (jobType: JobType) => {
        activeJobTypeRef.current = jobType;
        setActiveJobType(jobType);
        setStatus("queued");
        setResult(undefined);
        setJobError(undefined);

        try {
            const { jobId } = await submitJudge({
                code: codeByLanguage[language],
                language,
                questionId,
                jobType,
                userId: anonIdRef.current,
                roomId: anonIdRef.current,
            });
            lastJobIdRef.current = jobId;
            socketRef.current?.emit("execution-started", { roomId: anonIdRef.current, jobId });
        } catch (err) {
            setStatus("error");
            const message = isAxiosError(err) ? err.response?.data?.error : undefined;
            setJobError(message || "Failed to submit code");
        }
    };

    if (loadError) {
        return <div className="flex h-screen items-center justify-center text-red-700">{loadError}</div>;
    }

    if (!question) {
        return <div className="flex h-screen items-center justify-center text-slate-500">Loading question…</div>;
    }

    return (
        <div className="flex h-screen flex-col bg-slate-100">
            <JudgeToolbar
                title={question.title}
                connected={connected}
                language={language}
                onLanguageChange={setLanguage}
                status={status}
                activeJobType={activeJobType}
                onRun={() => runJob("run")}
                onSubmit={() => runJob("submit")}
            />

            <div className="flex grow p-4">
                <Group orientation="horizontal">
                    <Panel defaultSize={50} minSize={20} className="flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white">
                        <div className="flex border-b border-slate-200">
                            {(["problem", "submissions"] as Tab[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`px-4 py-2 text-sm font-medium capitalize ${
                                        tab === t
                                            ? "border-b-2 border-indigo-600 text-indigo-600"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {tab === "problem" ? (
                                <ProblemPanel question={question} />
                            ) : (
                                <SubmissionHistory submissions={submissions} />
                            )}
                        </div>
                    </Panel>

                    <Separator className="w-4 flex items-center justify-center cursor-col-resize group">
                        <div className="h-8 w-1 rounded-full bg-slate-300 group-hover:bg-slate-400 transition-colors" />
                    </Separator>

                    <Panel defaultSize={50} minSize={20} className="flex flex-col">
                        <div className="h-[50%] overflow-hidden rounded-md border border-slate-200">
                            <EditorPane
                                language={language}
                                value={codeByLanguage[language]}
                                onChange={(v) => setCodeByLanguage((prev) => ({ ...prev, [language]: v || "" }))}
                            />
                        </div>

                        <VerdictPanel status={status} result={result} jobError={jobError} />
                    </Panel>
                </Group>
            </div>
        </div>
    );
};

export default JudgeWorkspace;
