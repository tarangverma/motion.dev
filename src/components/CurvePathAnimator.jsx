import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Download, Trash2, Code, Copy, Settings, Grid, MousePointer2 } from 'lucide-react';

// Simple easing functions for preview
const EASINGS = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

export default function CurvePathAnimator() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  
  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [config, setConfig] = useState({
    speed: 1,
    showGrid: true,
    strokeWidth: 4,
    easing: 'linear',
    loop: false
  });
  const [showCopied, setShowCopied] = useState(false);
  
  const animationRef = useRef(null);

  // Resize canvas on mount
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (canvas && wrapper) {
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;
        // Trigger redraw
        setPath(p => [...p]);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const currentIndex = Math.min(path.length - 1, Math.floor(easedProgress * (path.length - 1)));
      
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

  // Animation Loop
  useEffect(() => {
    if (isAnimating && path.length > 1) {
      let startTime;
      const totalDuration = (path.length * 20) / config.speed; // Normalize duration based on length
      
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const runtime = timestamp - startTime;
        const relativeProgress = Math.min(runtime / totalDuration, 1);
        
        // Map 0-1 progress to path index
        const indexProgress = relativeProgress * (path.length - 1);
        
        setAnimationProgress(indexProgress);

        if (runtime < totalDuration) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          if (config.loop) {
            startTime = timestamp;
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setIsAnimating(false);
          }
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationRef.current);
    }
  }, [isAnimating, path.length, config.speed, config.loop]);

  // Calculate cumulative distances for accurate path following
  const getPathDistances = (pathPoints) => {
    if (pathPoints.length < 2) return [0];
    
    const distances = [0];
    let totalDist = 0;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const dx = pathPoints[i].x - pathPoints[i - 1].x;
      const dy = pathPoints[i].y - pathPoints[i - 1].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
      distances.push(totalDist);
    }
    
    return distances;
  };

  // Calculations
  const getInterpolatedPosition = () => {
    // 1. Safety Guard: If path is empty or has only 1 point
    if (!path || path.length < 2) {
      return path?.[0] || { x: 0, y: 0 };
    }
    
    // 2. Calculate cumulative distances along the path
    const distances = getPathDistances(path);
    const totalDistance = distances[distances.length - 1];
    
    if (totalDistance === 0) return path[0];
    
    // 3. Apply easing to get 0-1 progress
    const maxIdx = path.length - 1;
    const safeProgress = Math.min(animationProgress, maxIdx);
    const rawT = safeProgress / maxIdx;
    const easedT = EASINGS[config.easing](Math.min(Math.max(rawT, 0), 1));
    
    // 4. Convert eased progress to target distance
    const targetDistance = easedT * totalDistance;
    
    // 5. Find the two points that bracket this distance
    let segmentIndex = 0;
    for (let i = 0; i < distances.length - 1; i++) {
      if (targetDistance >= distances[i] && targetDistance <= distances[i + 1]) {
        segmentIndex = i;
        break;
      }
    }
    
    // 6. Boundary check
    if (segmentIndex >= path.length - 1) return path[path.length - 1];
    
    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];
    
    if (!start || !end) return path[path.length - 1];
    
    // 7. Calculate fraction within this segment based on distance
    const segmentStartDist = distances[segmentIndex];
    const segmentEndDist = distances[segmentIndex + 1];
    const segmentLength = segmentEndDist - segmentStartDist;
    
    const fraction = segmentLength > 0 
      ? (targetDistance - segmentStartDist) / segmentLength 
      : 0;
    
    return {
      x: start.x + (end.x - start.x) * fraction,
      y: start.y + (end.y - start.y) * fraction
    };
  };

  const generateSVGPath = () => {
    if (path.length < 2) return '';
    return `M ${Math.round(path[0].x)} ${Math.round(path[0].y)} ` + 
           path.slice(1).map(p => `L ${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');
  };

  const generateCSS = () => {
    const pathData = generateSVGPath();
    return `.element {
  offset-path: path(
    "${pathData}"
  );
  animation: move 2s ${config.easing} ${config.loop ? 'infinite' : 'forwards'};
}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateCSS());
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const currentPos = getInterpolatedPosition();

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Header */}
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
            onClick={() => {
              setPath([]);
              setIsAnimating(false);
              setAnimationProgress(0);
            }}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas Area */}
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
                <div className="w-full h-full bg-indigo-500 rounded-lg shadow-[0_0_20px_rgba(99,102,241,0.6)] animate-pulse flex items-center justify-center">
                   <div className="w-2 h-2 bg-white rounded-full" />
                </div>
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

        {/* Sidebar Controls */}
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
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${
                  isAnimating 
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
                onChange={(e) => setConfig({...config, speed: parseFloat(e.target.value)})}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-2">
               <label className="text-sm font-medium text-slate-300">CSS Easing</label>
               <div className="grid grid-cols-2 gap-2">
                 {Object.keys(EASINGS).map(ease => (
                   <button
                    key={ease}
                    onClick={() => setConfig({...config, easing: ease})}
                    className={`px-3 py-2 text-xs rounded border transition-colors ${
                      config.easing === ease 
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
                onClick={() => setConfig(prev => ({...prev, loop: !prev.loop}))}
                className={`w-12 h-6 rounded-full transition-colors relative ${config.loop ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${config.loop ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
             <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Show Grid</label>
              <button 
                onClick={() => setConfig(prev => ({...prev, showGrid: !prev.showGrid}))}
                className={`p-2 rounded transition-colors ${config.showGrid ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-500'}`}
              >
                <Grid size={18} />
              </button>
            </div>
          </div>

          {/* Code Export */}
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
                  {generateCSS()}
                </pre>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-600 italic">
                  Draw a path to generate code...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}