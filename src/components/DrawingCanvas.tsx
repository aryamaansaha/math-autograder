'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from './ui';

interface DrawingCanvasProps {
  onSave: (base64: string) => void;
  isLoading?: boolean;
}

type Tool = 'pen' | 'eraser';

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onSave, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [showBlankWarning, setShowBlankWarning] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - larger default size
    canvas.width = 800;
    canvas.height = 600;

    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Drawing style
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    setContext(ctx);
  }, []);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Resize canvas when entering/exiting fullscreen (preserve drawing)
  useEffect(() => {
    if (!canvasRef.current || !context) return;

    const canvas = canvasRef.current;
    
    // Save current canvas content as image before resizing
    const imageUrl = canvas.toDataURL();
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    if (isFullscreen) {
      // Fullscreen: use viewport size
      const width = window.innerWidth - 100; // Leave some padding
      const height = window.innerHeight - 150; // Leave space for controls
      canvas.width = width;
      canvas.height = height;
      
      // Restore drawing style
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      
      // Fill white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, width, height);
      
      // Restore previous drawing content (scaled to fit)
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, oldWidth, oldHeight, 0, 0, width, height);
      };
      img.src = imageUrl;
    } else {
      // Normal: reset to default size
      canvas.width = 800;
      canvas.height = 600;
      
      // Restore drawing style
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      
      // Fill white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, 800, 600);
      
      // Restore previous drawing content (scaled to fit)
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0, oldWidth, oldHeight, 0, 0, 800, 600);
      };
      img.src = imageUrl;
    }
  }, [isFullscreen, context]);

  // Get scaled mouse position (handles CSS scaling of canvas)
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    const { x, y } = getCanvasCoords(e);
    
    // Set tool-specific styles
    if (currentTool === 'eraser') {
      context.strokeStyle = 'white';
      context.lineWidth = 20; // Larger eraser
    } else {
      context.strokeStyle = 'black';
      context.lineWidth = 3;
    }
    
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { x, y } = getCanvasCoords(e);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    const canvas = canvasRef.current;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Check if canvas is essentially blank (mostly white pixels)
  const isCanvasBlank = (): boolean => {
    if (!canvasRef.current || !context) return true;
    
    const canvas = canvasRef.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Count non-white pixels (checking RGB values)
    let nonWhitePixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Consider a pixel "drawn" if it's not white (allowing some tolerance)
      if (r < 250 || g < 250 || b < 250) {
        nonWhitePixels++;
      }
    }
    
    // If less than 0.1% of pixels are non-white, consider it blank
    const totalPixels = canvas.width * canvas.height;
    return (nonWhitePixels / totalPixels) < 0.001;
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    // Warn if canvas appears blank
    if (isCanvasBlank()) {
      setShowBlankWarning(true);
      return;
    }
    
    submitCanvas();
  };

  const submitCanvas = () => {
    if (!canvasRef.current) return;
    setShowBlankWarning(false);
    // Get base64 string
    const dataUrl = canvasRef.current.toDataURL('image/png');
    // Remove prefix for backend if needed (API handles both, but cleaner to send raw)
    const base64 = dataUrl.split(',')[1];
    onSave(base64);
  };

  return (
    <div 
      ref={containerRef}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem', 
        alignItems: 'center',
        width: '100%'
      }}
    >
      {/* Tool selection bar */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        padding: '0.5rem 1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => setCurrentTool('pen')}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            border: currentTool === 'pen' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: currentTool === 'pen' ? '#eff6ff' : 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: currentTool === 'pen' ? 'bold' : 'normal'
          }}
        >
          ✏️ Pen
        </button>
        <button
          onClick={() => setCurrentTool('eraser')}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1rem',
            border: currentTool === 'eraser' ? '2px solid var(--primary)' : '1px solid #cbd5e1',
            borderRadius: '6px',
            backgroundColor: currentTool === 'eraser' ? '#eff6ff' : 'white',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: currentTool === 'eraser' ? 'bold' : 'normal'
          }}
        >
          🧽 Eraser
        </button>
      </div>

      <canvas
        ref={canvasRef}
        style={{ 
          border: '2px solid #e2e8f0', 
          borderRadius: '4px', 
          cursor: currentTool === 'eraser' ? 'cell' : 'crosshair', 
          touchAction: 'none',
          maxWidth: '100%',
          height: 'auto'
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button variant="secondary" onClick={clearCanvas} disabled={isLoading}>
          🗑️ Clear All
        </Button>
        <Button variant="secondary" onClick={toggleFullscreen} disabled={isLoading}>
          {isFullscreen ? '⬇️ Exit Fullscreen' : '⬆️ Fullscreen'}
        </Button>
        {!isFullscreen && (
          <Button onClick={handleSave} isLoading={isLoading}>
            Submit Answer
          </Button>
        )}
      </div>
      {isFullscreen && (
        <div style={{ 
          color: '#64748b', 
          fontSize: '0.875rem', 
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          Exit fullscreen to submit your answer
        </div>
      )}

      {/* Blank Canvas Warning Modal */}
      {showBlankWarning && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <div style={{ 
              fontSize: '2.5rem', 
              textAlign: 'center', 
              marginBottom: '1rem' 
            }}>
              ✏️
            </div>
            <h3 style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '1.25rem', 
              fontWeight: 600,
              textAlign: 'center',
              color: '#1e293b'
            }}>
              Empty Canvas Detected
            </h3>
            <p style={{ 
              margin: '0 0 1.5rem 0', 
              color: '#64748b',
              textAlign: 'center',
              lineHeight: 1.5
            }}>
              Your canvas appears to be blank. Are you sure you want to submit without any work?
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '0.75rem', 
              justifyContent: 'center' 
            }}>
              <Button 
                variant="secondary" 
                onClick={() => setShowBlankWarning(false)}
              >
                Go Back
              </Button>
              <Button 
                onClick={submitCanvas}
                style={{ backgroundColor: '#ef4444' }}
              >
                Submit Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
