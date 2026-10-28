import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Eraser, RotateCcw, Trash2, Download, Check } from 'lucide-react';

const COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Teal', value: '#00a896' },
  { label: 'Emerald', value: '#10b981' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Coral Red', value: '#ef4444' }
];

const BRUSH_SIZES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 4 },
  { label: 'Broad', size: 8 }
];

export function ArabicWhiteboard({ slotName = "Classroom" }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(4);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#05191b';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Save initial blank state
    saveSnapshot();
  }, []);

  const saveSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL();
      setHistory(prev => [...prev.slice(-15), dataUrl]);
    } catch {
      // ignore
    }
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'eraser') {
      ctx.strokeStyle = '#05191b';
      ctx.lineWidth = brushSize * 4;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
      saveSnapshot();
    }
  };

  const handleClear = () => {
    if (!window.confirm('Are you sure you want to clear the whiteboard?')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#05191b';
    ctx.fillRect(0, 0, rect.width, rect.height);
    saveSnapshot();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const newHistory = [...history];
    newHistory.pop(); // remove current state
    const previousSnapshot = newHistory[newHistory.length - 1];

    const img = new Image();
    img.src = previousSnapshot;
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      setHistory(newHistory);
    };
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Alarabia_Whiteboard_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '8px' }}>
      {/* Whiteboard Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '6px 10px',
          backgroundColor: '#092528',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Tool & Colors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setTool('pen')}
              style={{
                background: tool === 'pen' ? 'var(--color-primary)' : 'transparent',
                color: tool === 'pen' ? '#041416' : '#cbd5e1',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
              title="Pen tool"
            >
              <PenTool size={13} /> Pen
            </button>
            <button
              onClick={() => setTool('eraser')}
              style={{
                background: tool === 'eraser' ? 'var(--color-primary)' : 'transparent',
                color: tool === 'eraser' ? '#041416' : '#cbd5e1',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
              title="Eraser tool"
            >
              <Eraser size={13} /> Eraser
            </button>
          </div>

          {/* Color Palette (Active when Pen selected) */}
          {tool === 'pen' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: c.value,
                    border: color === c.value ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transform: color === c.value ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                  title={c.label}
                />
              ))}
            </div>
          )}

          {/* Brush Sizes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushSize(b.size)}
                style={{
                  background: brushSize === b.size ? 'rgba(0, 168, 150, 0.3)' : 'transparent',
                  color: brushSize === b.size ? 'var(--color-primary)' : '#94a3b8',
                  border: brushSize === b.size ? '1px solid var(--color-primary)' : '1px solid transparent',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls: Undo, Clear, Download */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            style={{
              background: 'none',
              border: 'none',
              color: history.length <= 1 ? '#64748b' : '#cbd5e1',
              cursor: history.length <= 1 ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Undo stroke"
          >
            <RotateCcw size={15} />
          </button>
          <button
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear canvas"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={handleDownload}
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
            title="Download drawing as PNG"
          >
            {copied ? <Check size={13} /> : <Download size={13} />}
            <span>{copied ? "Downloaded" : "Save Image"}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        style={{
          flex: 1,
          width: '100%',
          minHeight: '440px',
          borderRadius: '8px',
          overflow: 'hidden',
          backgroundColor: '#05191b',
          border: '1px solid rgba(0, 168, 150, 0.2)',
          position: 'relative',
          touchAction: 'none'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            width: '100%',
            height: '100%',
            cursor: tool === 'pen' ? 'crosshair' : 'cell',
            display: 'block'
          }}
        />
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '12px',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.25)',
          pointerEvents: 'none',
          userSelect: 'none'
        }}>
          Alarabia Digital Canvas • {slotName}
        </div>
      </div>
    </div>
  );
}
