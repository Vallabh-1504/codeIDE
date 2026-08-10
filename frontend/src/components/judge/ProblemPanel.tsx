"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Question } from "@/types/judge";

interface ProblemPanelProps {
    question: Question;
}

const markdownComponents = {
    p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="mb-3 text-sm leading-relaxed text-slate-700" {...props} />
    ),
    ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-slate-700" {...props} />
    ),
    ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
        <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-slate-700" {...props} />
    ),
    li: (props: React.HTMLAttributes<HTMLLIElement>) => <li className="leading-relaxed" {...props} />,
    strong: (props: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-slate-800" {...props} />,
    code: (props: React.HTMLAttributes<HTMLElement>) => (
        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-slate-800" {...props} />
    ),
    h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800" {...props} />
    ),
    h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="mb-2 mt-4 text-base font-semibold text-slate-800" {...props} />
    ),
    h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-800" {...props} />
    ),
};

const ProblemPanel: React.FC<ProblemPanelProps> = ({ question }) => {
    return (
        <div className="flex h-full flex-col overflow-auto p-4">
            <h2 className="mb-3 text-xl font-semibold text-slate-800">{question.title}</h2>

            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
                {question.content}
            </ReactMarkdown>

            {question.sampleTestCases.map((sample, index) => (
                <div key={index} className="mb-4">
                    <h3 className="mb-2 text-sm font-medium text-slate-500">Sample {index + 1}</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="mb-1 text-xs font-medium text-slate-400">Input</div>
                            <pre className="overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800">
                                {sample.input}
                            </pre>
                        </div>
                        <div>
                            <div className="mb-1 text-xs font-medium text-slate-400">Expected Output</div>
                            <pre className="overflow-auto rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-800">
                                {sample.expectedOutput}
                            </pre>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProblemPanel;
