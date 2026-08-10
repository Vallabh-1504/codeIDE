"use client";

import React, { useEffect, useRef, useState } from "react";
import type { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { Socket } from "socket.io-client";
import { isAxiosError } from "axios";

import EditorPane from "@/components/shared/EditorPane";
import Toolbar from "./Toolbar";
import InputPanel from "./InputPanel";
import OutputPanel from "./OutputPanel";
import { createSocket } from "@/lib/socket";
import { runCode } from "@/lib/api";
import { DEFAULT_TEMPLATES } from "@/lib/templates";
import { Language, PlaygroundResultEvent, RunStatus } from "@/types/playground";

interface PlaygroundEditorProps {
    roomId: string;
}

const YJS_URL = process.env.NEXT_PUBLIC_YJS_URL || "ws://localhost:1234";

const PlaygroundEditor: React.FC<PlaygroundEditorProps> = ({ roomId }) => {
    const [connected, setConnected] = useState(false);
    const [language, setLanguage] = useState<Language>("cpp");
    const [stdin, setStdin] = useState("");
    const [status, setStatus] = useState<RunStatus>("idle");
    const [output, setOutput] = useState("");
    const [error, setError] = useState<string>();

    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const lastJobIdRef = useRef<string | null>(null);
    const yjsCleanupRef = useRef<(() => void) | null>(null);

    // Socket connection for run status & results
    useEffect(() => {
        const socket = createSocket();
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("join-room", roomId);
        });

        socket.on("disconnect", () => setConnected(false));

        socket.on("execution-started", () => {
            setStatus("running");
        });

        socket.on("playground-result", (data: PlaygroundResultEvent) => {
            if (data.jobId !== lastJobIdRef.current) return;
            setStatus(data.success ? "success" : "error");
            setOutput(data.output || "");
            setError(data.error);
        });

        return () => {
            socket.disconnect();
        };
    }, [roomId]);

    // Yjs binding for collaborative editing
    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;

        const ydoc = new Y.Doc();
        const provider = new WebsocketProvider(YJS_URL, roomId, ydoc);
        const ytext = ydoc.getText("monaco");

        provider.on("sync", (isSynced: boolean) => {
            if (isSynced && ytext.length === 0) {
                ytext.insert(0, DEFAULT_TEMPLATES[language]);
            }
        });

        const binding = new MonacoBinding(ytext, editor.getModel()!, new Set([editor]), provider.awareness);

        yjsCleanupRef.current = () => {
            binding.destroy();
            provider.disconnect();
            ydoc.destroy();
        };
    };

    useEffect(() => {
        return () => yjsCleanupRef.current?.();
    }, []);

    const handleRun = async () => {
        const editor = editorRef.current;
        if (!editor) return;

        const currentCode = editor.getValue();

        const needsInput =
            language === "cpp" ? /(cin\s*>>|scanf|getline)/.test(currentCode) : /input\s*\(/.test(currentCode);

        if (needsInput && !stdin.trim()) {
            const proceed = window.confirm(
                "Your code appears to read input (e.g. cin / input()), but the STDIN box is empty.\n\nRun anyway?"
            );
            if (!proceed) return;
        }

        setStatus("queued");
        setOutput("");
        setError(undefined);

        try {
            const { jobId } = await runCode({ code: currentCode, roomId, language, stdin });
            lastJobIdRef.current = jobId;
            socketRef.current?.emit("execution-started", { roomId, jobId });
        } catch (err) {
            setStatus("error");
            const message = isAxiosError(err) ? err.response?.data?.error : undefined;
            setError(message || "Failed to run code");
        }
    };

    return (
        <div className="flex h-screen flex-col bg-slate-100">
            <Toolbar
                roomId={roomId}
                connected={connected}
                language={language}
                onLanguageChange={setLanguage}
                status={status}
                onRun={handleRun}
            />

            <div className="flex grow gap-4 p-4">
                <div className="w-1/2 overflow-hidden rounded-md border border-slate-200">
                    <EditorPane language={language} onMount={handleEditorDidMount} />
                </div>

                <div className="flex w-1/2 flex-col">
                    <InputPanel value={stdin} onChange={setStdin} />
                    <OutputPanel status={status} output={output} error={error} />
                </div>
            </div>
        </div>
    );
};

export default PlaygroundEditor;
