"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from '@monaco-editor/react';
import axios from 'axios';
import {io, Socket} from 'socket.io-client';

interface CodeEditorProps{
    roomId: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({roomId}) =>{
    const [code, setCode] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    // Socket Connection
    useEffect(() =>{
        const newSocket = io('http://localhost:3000');
        setSocket(newSocket);

        newSocket.on('connect', () =>{
            console.log('Connected to socket:', newSocket.id);
            newSocket.emit('join-room', roomId);
        });

        return () =>{
            newSocket.disconnect();
        };
    }, [roomId]);

    const runCode = async () =>{
        setLoading(true);
        setOutput('Running...');

        try{
            const response = await axios.post('http://localhost:3000/run', {
                code: code,
            });

            const {jobId} = response.data;
            console.log(`Code submitted: ${jobId}`);

            const intervalId = setInterval(async () =>{
                const statusRes = await axios.get(`http://localhost:3000/status/${jobId}`);
                const {state, result, error} = statusRes.data;

                console.log("Polling Status:", state);

                if(state === 'completed'){
                    clearInterval(intervalId);
                    setLoading(false);
                    setOutput(result.output || "No output");
                }
                else if(state === 'failed'){
                    clearInterval(intervalId);
                    setLoading(false);
                    setOutput(`Error: ${error}`);
                }
                // If 'active' or 'delayed', keep polling...
            }, 1000);
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

        <div className="flex flex-grow gap-4">
            {/* LEFT: Code Editor */}
            <div className="w-1/2 border border-gray-700">
            <Editor
                height="100%"
                defaultLanguage="cpp"
                theme="vs-dark"
                value={code}
                onChange={(value) => setCode(value || "")}
                options={{
                minimap: { enabled: true },
                fontSize: 14,
                }}
            />
            </div>

            {/* RIGHT: Output Console */}
            <div className="w-1/2 bg-black border border-gray-700 p-4 font-mono text-sm overflow-auto">
            <h3 className="text-gray-400 mb-2 border-b border-gray-700 pb-1">OUTPUT</h3>
            <pre className="whitespace-pre-wrap">{output}</pre>
            </div>
        </div>
        </div>
    );
};

export default CodeEditor;