import React, { useRef, useEffect } from 'react';
import { MousePointer2 } from 'lucide-react';
import { EASINGS, getInterpolatedPosition } from './utils';

export default function Canvas({
    path,
    setPath,
    isDrawing,
    setIsDrawing,
    setAnimationProgress,
    setIsAnimating,
    animationProgress,
    config,
    customObjectUrl
}) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);

    // Resize canvas on mount
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas && canvas.parentElement) {
                const parent = canvas.parentElement;
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
                // Trigger redraw
                setPath(p => [...p]);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [setPath]);

    // Main Draw Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Draw Grid
        if (config.showGrid) {
            ctx.strokeStyle = '#1e293b'; // Slate-800
            ctx.lineWidth = 1;
            const gridSize = 40;

            // Vertical lines
            for (let i = 0; i < canvas.width; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            // Horizontal lines
            for (let i = 0; i < canvas.height; i += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }
        }

        // 2. Draw Path
        if (path.length > 1) {
            // Draw background trace
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = config.strokeWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.setLineDash([5, 10]);

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw active path based on progress
            const easedProgress = EASINGS[config.easing](animationProgress / (path.length - 1 || 1));

            // Gradient Stroke
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#818cf8'); // Indigo
            gradient.addColorStop(1, '#c084fc'); // Purple

            ctx.strokeStyle = gradient;
            ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
            ctx.shadowBlur = 15;

            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Start Point
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(path[0].x, path[0].y, 6, 0, Math.PI * 2);
            ctx.fill();

            // End Point
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [path, animationProgress, config]);

    // Interaction Handlers
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setPath([{ x, y }]);
        setIsAnimating(false);
        setAnimationProgress(0);
    };

    const draw = (e) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Optimization: Only add point if distance > 10px (Smoothing)
        setPath(prev => {
            const last = prev[prev.length - 1];
            const dist = Math.hypot(x - last.x, y - last.y);
            if (dist > 10) {
                return [...prev, { x, y }];
            }
            return prev;
        });
    };

    const stopDrawing = () => setIsDrawing(false);

    const currentPos = getInterpolatedPosition(path, animationProgress, config);

    return (
        <div className="flex-1 relative bg-slate-950" ref={wrapperRef}>
            <div className="absolute inset-4 border border-slate-800 rounded-xl overflow-hidden bg-[#0f172a] shadow-2xl">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
                />

                {/* Animated Element */}
                {path.length > 0 && (
                    <div
                        className="absolute w-8 h-8 pointer-events-none z-20"
                        style={{
                            left: `${currentPos.x}px`,
                            top: `${currentPos.y}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {customObjectUrl ? (
                            <img
                                src={customObjectUrl}
                                alt="Moving Object"
                                className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                            />
                        ) : (
                            <div className="w-full h-full bg-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                        )}
                    </div>
                )}

                {/* Overlay Instructions */}
                {path.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-slate-600 flex flex-col items-center gap-2">
                            <MousePointer2 size={32} />
                            <p>Click and drag to draw a motion path</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
