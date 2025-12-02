import React, { useState, useRef, useEffect } from 'react';
import Header from './curve-path/Header';
import Canvas from './curve-path/Canvas';
import Controls from './curve-path/Controls';
import CodeExport from './curve-path/CodeExport';

export default function CurvePathAnimator() {
  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [path, setPath] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [config, setConfig] = useState({
    speed: 0.1,
    showGrid: true,
    strokeWidth: 4,
    easing: 'linear',
    loop: false
  });
  const [customObjectUrl, setCustomObjectUrl] = useState(null);

  const animationRef = useRef(null);

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

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Header
        onClear={() => {
          setPath([]);
          setIsAnimating(false);
          setAnimationProgress(0);
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        <Canvas
          path={path}
          setPath={setPath}
          isDrawing={isDrawing}
          setIsDrawing={setIsDrawing}
          setAnimationProgress={setAnimationProgress}
          setIsAnimating={setIsAnimating}
          animationProgress={animationProgress}
          config={config}
          customObjectUrl={customObjectUrl}
        />

        <div className="w-96 border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
          <Controls
            isAnimating={isAnimating}
            setIsAnimating={setIsAnimating}
            path={path}
            setAnimationProgress={setAnimationProgress}
            config={config}
            setConfig={setConfig}
            customObjectUrl={customObjectUrl}
            setCustomObjectUrl={setCustomObjectUrl}
          />
          <CodeExport path={path} config={config} />
        </div>
      </div>
    </div>
  );
}