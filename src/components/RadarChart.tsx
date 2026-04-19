'use client';

import { useEffect, useRef } from 'react';

interface RadarDimension {
  name: string;
  score: number;
}

interface RadarChartProps {
  dimensions: Array<RadarDimension>;
  previousDimensions?: Array<RadarDimension>; // 上次的能力数据，用于对比
  onDimensionChange?: (index: number, score: number) => void;
  editable?: boolean;
  size?: number;
  showLabels?: boolean;
  showScore?: boolean;
}

export function RadarChart({ 
  dimensions, 
  previousDimensions,
  onDimensionChange, 
  editable = true,
  size = 300,
  showLabels = true,
  showScore = true
}: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const padding = 65; // 增加边距，确保标签完整显示
    const canvasSize = size + padding * 2;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const maxRadius = size * 0.35; // 缩小雷达图半径，为标签留更多空间
    const levels = 5;
    const dimensionCount = dimensions.length;
    const angleStep = (Math.PI * 2) / dimensionCount;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw background circles
    for (let i = 1; i <= levels; i++) {
      const radius = (maxRadius / levels) * i;
      ctx.beginPath();
      for (let j = 0; j <= dimensionCount; j++) {
        const angle = j * angleStep - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = i === levels ? '#cbd5e1' : '#e2e8f0';
      ctx.lineWidth = i === levels ? 1.5 : 1;
      ctx.stroke();
    }

    // Draw axis lines
    for (let i = 0; i < dimensionCount; i++) {
      const angle = i * angleStep - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + maxRadius * Math.cos(angle),
        centerY + maxRadius * Math.sin(angle)
      );
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw previous data polygon (if exists) - 灰色虚线
    if (previousDimensions && previousDimensions.length === dimensionCount) {
      ctx.beginPath();
      for (let i = 0; i < dimensionCount; i++) {
        const value = previousDimensions[i]?.score || 0;
        const normalizedValue = value / 10;
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + maxRadius * normalizedValue * Math.cos(angle);
        const y = centerY + maxRadius * normalizedValue * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(156, 163, 175, 0.2)';
      ctx.fill();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw current data polygon
    ctx.beginPath();
    for (let i = 0; i < dimensionCount; i++) {
      const value = dimensions[i]?.score || 0;
      const normalizedValue = value / 10;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + maxRadius * normalizedValue * Math.cos(angle);
      const y = centerY + maxRadius * normalizedValue * Math.sin(angle);
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw data points and score labels
    for (let i = 0; i < dimensionCount; i++) {
      const value = dimensions[i]?.score || 0;
      const normalizedValue = value / 10;
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + maxRadius * normalizedValue * Math.cos(angle);
      const y = centerY + maxRadius * normalizedValue * Math.sin(angle);
      
      // Draw point
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw score label near the point
      if (showScore) {
        const scoreOffset = 18;
        const scoreX = x + scoreOffset * Math.cos(angle);
        const scoreY = y + scoreOffset * Math.sin(angle);
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.fillStyle = '#1d4ed8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${value}`, scoreX, scoreY);
      }
    }

    // Draw dimension labels
    if (showLabels) {
      ctx.font = 'bold 13px system-ui, "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = 0; i < dimensionCount; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const labelRadius = maxRadius + 35; // 增加标签距离
        let x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);

        // 根据角度调整文本对齐方式，确保标签不超出边界
        const cosAngle = Math.cos(angle);
        if (Math.abs(cosAngle) < 0.1) {
          // 顶部或底部
          ctx.textAlign = 'center';
          ctx.textBaseline = Math.sin(angle) > 0 ? 'top' : 'bottom';
        } else if (cosAngle > 0) {
          // 右侧
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          x += 5;
        } else {
          // 左侧 - 使用右对齐，确保文本向右延伸
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          x -= 5;
        }

        ctx.fillStyle = '#374151';
        ctx.fillText(dimensions[i]?.name || '', x, y);
      }
    }
  }, [dimensions, previousDimensions, size, showLabels, showScore]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!editable || !onDimensionChange) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const padding = 65;
    const canvasSize = size + padding * 2;
    
    const x = (e.clientX - rect.left) * dpr / dpr - padding;
    const y = (e.clientY - rect.top) * dpr / dpr - padding;
    const centerX = canvasSize / 2 - padding;
    const centerY = canvasSize / 2 - padding;
    const maxRadius = size * 0.35;
    const dimensionCount = dimensions.length;
    const angleStep = (Math.PI * 2) / dimensionCount;

    // Calculate which dimension was clicked
    const dx = x - centerX;
    const dy = y - centerY;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const clickedDimension = Math.round((angle < 0 ? angle + Math.PI * 2 : angle) / angleStep) % dimensionCount;

    // Calculate new value based on distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);
    let newValue = Math.round((distance / maxRadius) * 10);
    newValue = Math.max(1, Math.min(10, newValue));

    onDimensionChange(clickedDimension, newValue);
  };

  const padding = 65;
  const canvasSize = size + padding * 2;

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: canvasSize, height: canvasSize }}
        className={`cursor-pointer ${editable ? 'hover:opacity-90' : ''}`}
        onClick={handleCanvasClick}
      />
      {previousDimensions && (
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-400 opacity-50"></div>
            <span>本次</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-2 border-dashed border-gray-400 bg-gray-200 opacity-50"></div>
            <span>上次</span>
          </div>
        </div>
      )}
      {editable && (
        <p className="text-xs text-gray-500 text-center mt-2">
          点击雷达图中的点可以调整评分
        </p>
      )}
    </div>
  );
}
