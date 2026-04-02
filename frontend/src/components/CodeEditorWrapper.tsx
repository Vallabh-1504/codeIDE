"use client";

import dynamic from 'next/dynamic';

const CodeEditor = dynamic(() => import('./CodeEditor'), {
    ssr: false,
    loading: () => <p className="text-white p-4">Loading Editor...</p>
});

export default CodeEditor;