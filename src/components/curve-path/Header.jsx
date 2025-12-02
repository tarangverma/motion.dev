import React from 'react';
import { MousePointer2, Trash2 } from 'lucide-react';

export default function Header({ onClear }) {
    return (
        <header className="h-16 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-500 p-2 rounded-lg">
                    <MousePointer2 size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-white">MotionPath.dev</h1>
                    <p className="text-xs text-slate-400">CSS offset-path generator</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onClear}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
                    title="Clear Canvas"
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </header>
    );
}
