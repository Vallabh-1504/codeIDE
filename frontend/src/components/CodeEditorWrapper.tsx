"use client";

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('./playground/PlaygroundEditor'), {
    ssr: false,
    loading: () => <p className="p-4 text-slate-500">Loading Editor...</p>
});

export default CodeEditor;