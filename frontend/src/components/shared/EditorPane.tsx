"use client";

import React from "react";
import { Editor, OnMount } from "@monaco-editor/react";

interface EditorPaneProps {
    language: string;
    onMount?: OnMount;
    defaultValue?: string;
    value?: string;
    onChange?: (value: string | undefined) => void;
}

const EditorPane: React.FC<EditorPaneProps> = ({ language, onMount, defaultValue, value, onChange }) => {
    return (
        <Editor
            height="100%"
            language={language}
            theme="vs"
            defaultValue={defaultValue}
            value={value}
            onChange={onChange}
            onMount={onMount}
            options={{
                minimap: { enabled: true },
                fontSize: 16,
                wordWrap: "on",
            }}
        />
    );
};

export default EditorPane;
