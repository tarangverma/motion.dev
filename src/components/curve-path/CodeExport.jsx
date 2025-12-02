import React, { useState } from 'react';
import { Code, Copy } from 'lucide-react';
import { generateCSS } from './utils';

export default function CodeExport({ path, config }) {
    const [showCopied, setShowCopied] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateCSS(path, config));
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    return (
        <div className="flex-1 min-h-[200px] flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Code size={14} /> Generated CSS
                </h2>
                <button
                    onClick={copyToClipboard}
                    disabled={path.length === 0}
                    className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                >
                    {showCopied ? 'Copied!' : <><Copy size={12} /> Copy CSS</>}
                </button>
            </div>

            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-auto relative group">
                {path.length > 0 ? (
                    <pre className="whitespace-pre-wrap break-all">
                        {generateCSS(path, config)}
                    </pre>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 italic">
                        Draw a path to generate code...
                    </div>
                )}
            </div>
        </div>
    );
}
