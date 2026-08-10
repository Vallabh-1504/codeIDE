"use client";

import React from "react";

interface InputPanelProps {
    value: string;
    onChange: (value: string) => void;
}

const InputPanel: React.FC<InputPanelProps> = ({ value, onChange }) => {
    return (
        <div className="flex h-[30%] flex-col rounded-md border border-slate-200 bg-white p-3">
            <h3 className="mb-2 border-b border-slate-100 pb-1 text-sm font-medium text-slate-500">
                STDIN (Standard Input)
            </h3>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="h-full w-full resize-none font-mono text-sm text-slate-800 outline-none"
                placeholder="Provide any inputs required by your program here..."
            />
        </div>
    );
};

export default InputPanel;
