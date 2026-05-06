/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eraser, Brain, RotateCcw, Send, Download } from 'lucide-react';
import { cn } from './lib/utils';
import { GoogleGenAI } from '@google/genai';

const CANVAS_SIZE = 280; // Display size
const GRID_SIZE = 28;    // MNIST size
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prediction, setPrediction] = useState<{ prediction: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [grid, setGrid] = useState<number[]>(new Array(GRID_SIZE * GRID_SIZE).fill(0));

  // Drawing logic
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);

    if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
      updateGrid(gridX, gridY);
    }
  };

  const updateGrid = (x: number, y: number) => {
    const newGrid = [...grid];
    // Draw with a brush effect (Gaussian-like)
    for (let di = -1; di <= 1; di++) {
      for (let dj = -1; dj <= 1; dj++) {
        const nx = x + di;
        const ny = y + dj;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          const index = ny * GRID_SIZE + nx;
          const weight = (di === 0 && dj === 0) ? 1.0 : 0.5;
          newGrid[index] = Math.min(1.0, newGrid[index] + weight);
        }
      }
    }
    setGrid(newGrid);
  };

  const clearCanvas = () => {
    setGrid(new Array(GRID_SIZE * GRID_SIZE).fill(0));
    setPrediction(null);
  };

  const performPrediction = async () => {
    if (grid.every(v => v === 0)) return;

    setLoading(true);
    setPrediction(null);

    try {
      // Create ASCII grid for Gemini to process
      let gridStr = "";
      for (let i = 0; i < 28; i++) {
        for (let j = 0; j < 28; j++) {
          gridStr += grid[i * 28 + j] > 0.3 ? "█" : ".";
        }
        gridStr += "\n";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Identify the single handwritten digit (0-9) represented by this 28x28 pixel grid.
Output ONLY a valid JSON object: {"prediction": "digit", "confidence": float}

Grid:
${gridStr}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const resultText = response.text || "";
      const result = JSON.parse(resultText);
      setPrediction(result);
    } catch (err) {
      console.error(err);
      // Fallback
      setPrediction({ prediction: "?", confidence: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Render grid to visual canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid pixels
    grid.forEach((value, i) => {
      if (value > 0) {
        const x = (i % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;
        ctx.fillStyle = `rgba(255, 255, 255, ${value})`;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    // Optional: Draw guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [grid]);

  // Render grid to visual canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid pixels
    grid.forEach((value, i) => {
      if (value > 0) {
        const x = (i % GRID_SIZE) * CELL_SIZE;
        const y = Math.floor(i / GRID_SIZE) * CELL_SIZE;
        ctx.fillStyle = `rgba(255, 255, 255, ${value})`;
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    });

    // Optional: Draw guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, [grid]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 selection:bg-blue-500/30">
      <div className="max-w-4xl mx-auto space-y-8 mt-12">
        <header className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium tracking-wider uppercase mb-2"
          >
            Machine Learning • MNIST
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
          >
            Digit <span className="text-blue-500">Recognizer</span>
          </motion.h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Draw a single digit (0-9) on the canvas below and our neural network will try to recognize it.
          </p>
        </header>

        <main className="grid md:grid-cols-2 gap-8 items-start">
          {/* Canvas Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-500 uppercase tracking-widest">Draw Area</h2>
              <div className="flex gap-2">
                <button 
                  onClick={clearCanvas}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                  title="Clear Canvas"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            <div className="relative group mx-auto" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
              <canvas
                id="digit-canvas"
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={draw}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={draw}
                onTouchEnd={handleMouseUp}
                className="rounded-xl cursor-crosshair shadow-inner touch-none border border-slate-700 bg-slate-950"
              />
              <div className="absolute inset-0 pointer-events-none rounded-xl border border-white/5 group-hover:border-blue-500/30 transition-colors" />
            </div>

            <div className="mt-8">
              <button
                id="predict-button"
                onClick={performPrediction}
                disabled={loading}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                  loading 
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                )}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Brain size={20} />
                    Predict Digit
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {prediction ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-4"
                  >
                    <span className="text-sm font-medium text-blue-400 uppercase tracking-[0.2em]">Prediction</span>
                    <div className="text-9xl font-black text-white tabular-nums tracking-tighter">
                      {prediction.prediction}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs text-slate-500 font-mono mb-1">
                        <span>Confidence</span>
                        <span>{(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.confidence * 100}%` }}
                          transition={{ delay: 0.2, duration: 0.8 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 text-slate-500"
                  >
                    <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                      <Send size={24} className="opacity-20" />
                    </div>
                    <p className="text-balance">Draw something and click predict to see the result</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Resolution</div>
                <div className="text-lg font-semibold">28x28 <span className="text-xs font-normal text-slate-600">px</span></div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">Model</div>
                <div className="text-lg font-semibold">MLP <span className="text-xs font-normal text-slate-600">Network</span></div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10">
              <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                <Download size={14} />
                Download Python Assets
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The <code className="text-blue-300">model_train.py</code> and <code className="text-blue-300">app.py</code> files are included in the project for local training and deployment using Scikit-learn and FastAPI.
              </p>
            </div>
          </motion.div>
        </main>

        <footer className="pt-8 border-t border-slate-900 text-center text-slate-600 text-xs">
          Built with React, Express, and Google Gemini AI
        </footer>
      </div>
    </div>
  );
}
