import React, { useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Grid, Upload } from 'lucide-react';
import { EASINGS } from './utils';

export default function Controls({
    isAnimating,
    setIsAnimating,
    path,
    setAnimationProgress,
    config,
    setConfig,
    customObjectUrl,
    setCustomObjectUrl
}) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomObjectUrl(url);
        }
    };

    return (
        <div className="w-96 border-l border-slate-800 bg-slate-900 p-6 flex flex-col gap-8 overflow-y-auto">

            {/* Playback Controls */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Settings size={14} /> Preview
                </h2>

                <div className="flex gap-2">
                    <button
                        onClick={() => isAnimating ? setIsAnimating(false) : setIsAnimating(true)}
                        disabled={path.length < 2}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${isAnimating
                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isAnimating ? <Pause size={18} /> : <Play size={18} />}
                        {isAnimating ? 'Pause' : 'Play Animation'}
                    </button>

                    <button
                        onClick={() => { setIsAnimating(false); setAnimationProgress(0); }}
                        disabled={path.length < 2}
                        className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 disabled:opacity-50"
                    >
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            {/* Configuration */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Animation Speed</label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={config.speed}
                        onChange={(e) => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                        className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">CSS Easing</label>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.keys(EASINGS).map(ease => (
                            <button
                                key={ease}
                                onClick={() => setConfig({ ...config, easing: ease })}
                                className={`px-3 py-2 text-xs rounded border transition-colors ${config.easing === ease
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                                    }`}
                            >
                                {ease}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Loop Animation</label>
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, loop: !prev.loop }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${config.loop ? 'bg-indigo-500' : 'bg-slate-700'}`}
                    >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.loop ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-300">Show Grid</label>
                    <button
                        onClick={() => setConfig(prev => ({ ...prev, showGrid: !prev.showGrid }))}
                        className={`p-2 rounded transition-colors ${config.showGrid ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500'}`}
                    >
                        <Grid size={18} />
                    </button>
                </div>

                {/* Custom Object Upload */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Custom Object</label>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors border border-slate-700"
                        >
                            <Upload size={14} />
                            {customObjectUrl ? 'Change Image' : 'Upload Image'}
                        </button>
                        {customObjectUrl && (
                            <button
                                onClick={() => setCustomObjectUrl(null)}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Reset
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/svg+xml,image/png,image/jpeg"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-[10px] text-slate-500">Supports SVG, PNG, JPG</p>
                </div>
            </div>
        </div>
    );
}
