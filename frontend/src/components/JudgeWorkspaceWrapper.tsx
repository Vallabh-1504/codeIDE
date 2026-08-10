"use client";

import dynamic from 'next/dynamic';

const JudgeWorkspace = dynamic(() => import('./judge/JudgeWorkspace'), {
    ssr: false,
    loading: () => <p className="p-4 text-slate-500">Loading problem...</p>
});

export default JudgeWorkspace;
