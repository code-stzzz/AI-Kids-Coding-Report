'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Loader2, X, Download, ZoomIn, ZoomOut, RotateCcw, Calendar } from 'lucide-react';
import { domToPng } from 'modern-screenshot';

interface RadarDimension {
  name: string;
  score: number;
}

interface PosterData {
  studentName: string;
  languageName: string;
  courseUnitName: string;
  radarDimensions: RadarDimension[];
  previousRadarDimensions?: RadarDimension[]; // 上次的能力数据，用于对比
  currentStageContent: string;
  nextStageContent: string;
  coreStrengths: string;
  areasToImprove: string;
  progressDescription: string;
  improvementDescription: string;
  encouragementMessage: string;
  improvementPlan1?: string;
  improvementPlan2?: string;
  improvementPlan3?: string;
  competitionPlans?: string;
  generatedAt: string;
}

interface PosterGeneratorProps {
  data: PosterData;
  onClose?: () => void;
}

// 雷达图组件
function RadarChartCanvas({ dimensions, previousDimensions, size }: { 
  dimensions: RadarDimension[]; 
  previousDimensions?: RadarDimension[];
  size: number 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    const padding = 55; // 增加边距，确保标签完整显示
    const canvasSize = size + padding;
    canvas.width = canvasSize * dpr;
    canvas.height = canvasSize * dpr;
    ctx.scale(dpr, dpr);

    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    const maxRadius = size * 0.33; // 缩小雷达图半径，为标签留更多空间
    const levels = 5;
    const dimensionCount = dimensions.length;
    const angleStep = (Math.PI * 2) / dimensionCount;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Draw background circles (polygon style)
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
      ctx.fillStyle = 'rgba(156, 163, 175, 0.15)';
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

      // Draw score label
      const scoreOffset = 16;
      const scoreX = x + scoreOffset * Math.cos(angle);
      const scoreY = y + scoreOffset * Math.sin(angle);
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = '#1d4ed8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value}`, scoreX, scoreY);
    }

    // Draw dimension labels
    ctx.font = 'bold 13px system-ui, "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#374151';
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

      ctx.fillText(dimensions[i]?.name || '', x, y);
    }
  }, [dimensions, previousDimensions, size]);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: size + 55, height: size + 55 }}
    />
  );
}

export function PosterGenerator({ data, onClose }: PosterGeneratorProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100); // 缩放比例
  
  // 日期选择状态：默认使用传入的日期或当前日期
  const [selectedDate, setSelectedDate] = useState<string>(
    data.generatedAt || new Date().toLocaleDateString('zh-CN')
  );
  
  // 格式化日期为 YYYY-MM-DD 格式用于 input[type="date"]
  const formatDateForInput = (dateStr: string) => {
    // 尝试解析各种日期格式
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const year = parts[0].length === 4 ? parts[0] : parts[2];
      const month = parts[0].length === 4 ? parts[1].padStart(2, '0') : parts[0].padStart(2, '0');
      const day = parts[0].length === 4 ? parts[2].padStart(2, '0') : parts[1].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    // 默认返回今天的日期
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  // 格式化日期为中文显示格式
  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  };
  
  // 处理日期变化
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      setSelectedDate(formatDateForDisplay(value));
      // 日期变化后清除预览，需要重新生成
      setPreviewUrl(null);
    }
  };

  const generatePoster = useCallback(async () => {
    if (!posterRef.current) return;
    
    setGenerating(true);
    setZoom(100); // 重置缩放
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const element = posterRef.current;
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      console.log('海报元素尺寸:', { width: rect.width, height: rect.height });
      
      const dataUrl = await domToPng(element, {
        scale: 2, // 2x scale for mobile
      });
      
      console.log('海报生成成功');
      setPreviewUrl(dataUrl);
    } catch (error) {
      console.error('生成海报失败:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('lab') || errorMessage.includes('color')) {
        alert('生成海报失败：浏览器样式冲突，请尝试刷新页面后重试');
      } else {
        alert('生成海报失败，请重试');
      }
    } finally {
      setGenerating(false);
    }
  }, []);

  const downloadPoster = useCallback(() => {
    if (!previewUrl) return;
    
    const link = document.createElement('a');
    link.download = `学习报告_${data.studentName}_${new Date().toLocaleDateString().replace(/\//g, '-')}.png`;
    link.href = previewUrl;
    link.click();
    
    console.log('PNG 下载成功');
  }, [previewUrl, data.studentName]);

  // 生成标题：语言+单元+学习报告
  const posterTitle = `${data.languageName}${data.courseUnitName}学习报告`;

  // 海报内容组件（可复用）
  const PosterContent = () => (
    <>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ 
          fontSize: '36px', 
          fontWeight: 'bold', 
          color: '#1e40af',
          marginBottom: '12px'
        }}>
          {posterTitle}
        </div>
        <div style={{ 
          fontSize: '18px', 
          color: '#64748b',
          display: 'flex',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <span>学生姓名：{data.studentName}</span>
        </div>
      </div>

      {/* Student Info */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          fontWeight: 'bold'
        }}>
          {data.studentName.charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {data.studentName}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            日期：{selectedDate}
          </div>
        </div>
      </div>

      {/* Radar Chart Section */}
      <div style={{ 
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1e293b',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          六维能力雷达图
        </div>
        {data.previousRadarDimensions && (
          <div style={{ 
            fontSize: '12px', 
            color: '#64748b',
            marginBottom: '15px',
            display: 'flex',
            gap: '20px',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'rgba(59, 130, 246, 0.5)' }}></div>
              <span>本期</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', border: '2px dashed #9ca3af', background: 'rgba(156, 163, 175, 0.2)' }}></div>
              <span>上期</span>
            </div>
          </div>
        )}
        <RadarChartCanvas 
          dimensions={data.radarDimensions} 
          previousDimensions={data.previousRadarDimensions}
          size={280} 
        />
      </div>

      {/* Current Stage Content */}
      {data.currentStageContent && (
        <div style={{ 
          background: '#f0f9ff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          borderLeft: '4px solid #0284c7'
        }}>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: '#0369a1',
            marginBottom: '10px'
          }}>
            📖 本阶段学习内容
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#0c4a6e',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap'
          }}>
            {data.currentStageContent}
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div style={{ marginBottom: '30px' }}>
        {/* Progress Description */}
        {data.progressDescription && (
          <div style={{ 
            background: '#f0fdf4',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: '4px solid #16a34a'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#166534',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '18px' }}>✨</span>
              <span>进步表现</span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#15803d',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
              {data.progressDescription}
            </div>
          </div>
        )}

        {/* Areas to Improve */}
        {data.improvementDescription && (
          <div style={{ 
            background: '#fefce8',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: '4px solid #ca8a04'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#854d0e',
              marginBottom: '10px'
            }}>
              📝 待提升方向
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#a16207',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
              {data.improvementDescription}
            </div>
          </div>
        )}

        {/* Next Stage Content */}
        {data.nextStageContent && (
          <div style={{ 
            background: '#e0f2fe',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#0369a1',
              marginBottom: '10px'
            }}>
              📚 下阶段学习内容
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#0284c7',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
              {data.nextStageContent}
            </div>
          </div>
        )}

        {/* 学习建议 */}
        {(data.improvementPlan1 || data.improvementPlan2 || data.improvementPlan3) && (
          <div style={{ 
            background: '#faf5ff',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: '4px solid #9333ea'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#7c3aed',
              marginBottom: '12px'
            }}>
              💡 学习建议
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#6d28d9',
              lineHeight: 1.8
            }}>
              {data.improvementPlan1 && (
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#9333ea', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.improvementPlan1}</span>
                </div>
              )}
              {data.improvementPlan2 && (
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#9333ea', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.improvementPlan2}</span>
                </div>
              )}
              {data.improvementPlan3 && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#9333ea', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                  <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', overflowWrap: 'break-word' }}>{data.improvementPlan3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 赛考规划 */}
        {data.competitionPlans && (
          <div style={{ 
            background: '#fff7ed',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            borderLeft: '4px solid #ea580c'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#c2410c',
              marginBottom: '10px'
            }}>
              🏆 赛考规划
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: '#ea580c',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap'
            }}>
              {data.competitionPlans}
            </div>
          </div>
        )}

        {/* Encouragement Message */}
        {data.encouragementMessage && (
          <div style={{ 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ 
              fontSize: '18px',
              marginBottom: '10px',
              opacity: 0.9
            }}>
              💪 老师寄语
            </div>
            <div style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              lineHeight: 1.6
            }}>
              {data.encouragementMessage}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center',
        paddingTop: '20px',
        marginTop: 'auto',
        borderTop: '1px solid #e2e8f0',
        color: '#94a3b8',
        fontSize: '12px'
      }}>
        《学习报告》
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* 隐藏的海报元素（用于生成截图，不受容器宽度限制） */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        <div 
          ref={posterRef}
          style={{
            width: '1080px', // 手机宽度
            minHeight: '1920px', // 9:16 比例
            height: 'auto', // 自适应高度，确保内容完整显示
            padding: '60px',
            fontFamily: 'system-ui, "Microsoft YaHei", sans-serif',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <PosterContent />
        </div>
      </div>

      {/* 对话框 */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-4" style={{ backgroundColor: '#f9fafb' }}>
          <div>
            <h2 className="text-xl font-bold text-gray-900">学习报告海报预览</h2>
            <p className="text-sm text-gray-500">手机适配 · 高清PNG格式</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* 缩放控制 */}
            {previewUrl && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setZoom(z => Math.max(25, z - 25))}
                  disabled={zoom <= 25}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom(z => Math.min(200, z + 25))}
                  disabled={zoom >= 200}
                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(100)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="重置"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* 日期选择器 */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Calendar className="w-4 h-4 text-gray-600" />
              <label className="text-sm text-gray-600 whitespace-nowrap">报告日期</label>
              <input
                type="date"
                value={formatDateForInput(selectedDate)}
                onChange={handleDateChange}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {!previewUrl ? (
              <button
                onClick={generatePoster}
                disabled={generating}
                className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: '#2563eb' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                {generating && <Loader2 className="w-4 h-4 animate-spin" />}
                生成预览
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPreviewUrl(null); setZoom(100); }}
                  className="px-4 py-2 text-gray-700 rounded-lg transition-colors"
                  style={{ backgroundColor: '#f3f4f6' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                >
                  重新生成
                </button>
                <button
                  onClick={downloadPoster}
                  className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2"
                  style={{ backgroundColor: '#16a34a' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  <Download className="w-4 h-4" />
                  下载 PNG
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-600 rounded-lg transition-colors"
                style={{ backgroundColor: '#f3f4f6' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6' }
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-8 flex justify-center items-start" style={{ backgroundColor: '#f3f4f6' }}>
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="海报预览" 
              className="shadow-lg transition-transform duration-200"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: 'top center',
                width: 'auto', 
                height: 'auto'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">点击&ldquo;生成预览&rdquo;按钮查看海报效果</p>
              <p className="text-sm mt-2">海报将以手机屏幕比例生成，包含完整的雷达图和学习内容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
