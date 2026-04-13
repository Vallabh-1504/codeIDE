"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface CodeEditorProps {
    roomId: string;
}

const TEST_CODE = `
    #include <iostream>
    using namespace std;
    int main(){
        cout << "hello world" << endl;
    }`;

const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || 3001;

const CodeEditor: React.FC<CodeEditorProps> = ({ roomId }) => {
    const [output, setOutput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [language, setLanguage] = useState<string>("cpp");
    const [stdin, setStdin] = useState<string>("");
    const editorRef = useRef<any>(null);

    // Socket Connection for code execution results
    useEffect(() => {
        const newSocket = io(`http://localhost:${SERVER_PORT}`);

        newSocket.on('connect', () =>{
            console.log('Connected to socket:', newSocket.id);
            newSocket.emit('join-room', roomId);
        });

        // Listen when code execution starts
        newSocket.on('execution-started', (data) =>{
            console.log(`Execution started for job ${data.jobId}`);
            setLoading(true);
            setOutput('Running...');
        });

        // Listen for the result
        newSocket.on('execution-result', (data) =>{
            setLoading(false);
            if(data.success){
                setOutput(data.output);
            }
            else{
                setOutput(`Error:\n${data.error}\n${data.output || ''}`);
            }
        });

        return () =>{
            newSocket.disconnect();
        };
    }, [roomId]);

    // Yjs connection for collaborative editing
    const handleEditorDidMount = (editor: any, monaco: any) =>{
        editorRef.current = editor;

        // 1. Initialize Yjs Document
        const ydoc = new Y.Doc();

        // 2. Connect to the Y-Websocket provider
        const provider = new WebsocketProvider(
            'ws://localhost:1234',
            roomId, // Connect to the specific room
            ydoc
        );

        // 3. Define shared text type
        const ytext = ydoc.getText('monaco');

        // 4. Bind the Yjs text to the Monaco Editor
        const binding = new MonacoBinding(
            ytext,
            editor.getModel(),
            new Set([editor]),
            provider.awareness
        );

        // Cleanup on unmount
        return () => {
            provider.disconnect();
            binding.destroy();
            ydoc.destroy();
        };
    };

    const runCode = async () =>{
        if(!editorRef.current) return;

        // 1. Get current synced code
        const currentCode = editorRef.current.getValue();

        // 2. a regexp to evalute whether there is any I/O in code
        const needsInput = language === 'cpp' 
            ? /(cin\s*>>|scanf|getline)/.test(currentCode) 
            : /input\s*\(/.test(currentCode);
            
        if(needsInput && !stdin.trim()){
            const proceed = window.confirm(
                "Warning: Your code appears to ask for input (e.g., cin / input()), but the STDIN box is empty.\n\nThis may cause unexpected behavior or garbage values. Do you want to run it anyway?"
            );
            if(!proceed) return;
        }

        // 2. Submit the code to endpoint
        try{
            const response = await axios.post(`http://localhost:${SERVER_PORT}/run`, {
                code: currentCode,
                roomId: roomId,
                language: language,
                stdin: stdin,
            });

            const { jobId } = response.data;
            console.log(`Code submitted: ${jobId}`);
        }
        catch(err: any){
            setLoading(false);
            setOutput(err.response?.data?.error || "Failed to run code");
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Code Execution Engine</h1>
                <div className="flex gap-4 items-center">
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 outline-none"
                    >
                        <option value="cpp">C++</option>
                        <option value="python">Python</option>
                    </select>
                    <button
                        onClick={runCode}
                        disabled={loading}
                        className={`px-6 py-2 rounded font-bold ${
                            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'
                        }`}
                    >
                        {loading ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div>

            <div className="flex grow gap-4">
                {/* LEFT: Code Editor */}
                <div className="w-1/2 flex flex-col gap-4">
                    <div className="flex-grow border border-gray-700">
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : 'python'}
                            theme="vs-dark"
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                                wordWrap: 'on'
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT: Output Console & input area */}
                <div className="w-1/2 bg-black border border-gray-700 p-4 font-mono text-sm overflow-auto flex flex-col">
                    {/* STDIN Input Area */}
                    <div className="h-1/4 border border-gray-700 p-2 bg-black flex flex-col">
                        <h3 className="text-gray-400 mb-2 border-b border-gray-700 pb-1 text-sm">STDIN (Standard Input)</h3>
                        <textarea
                            value={stdin}
                            onChange={(e) => setStdin(e.target.value)}
                            className="bg-transparent text-white w-full h-full outline-none resize-none font-mono text-sm"
                            placeholder="Provide any inputs required by your program here..."
                        />
                    </div>
                    {/* output Area */}
                    <h3 className="text-gray-400 mb-2 border-b border-gray-700 pb-1 text-sm bg-black sticky top-0">OUTPUT</h3>
                    <pre className="whitespace-pre-wrap">{output}</pre>
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;