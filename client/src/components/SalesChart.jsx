import React, { useMemo } from 'react';

const SalesChart = ({ data = [] }) => {
  // Find the maximum sales value to scale the chart bars dynamically
  const maxVal = useMemo(() => {
    const values = data.map((d) => d.sales);
    const max = Math.max(...values, 1000); // Default minimum scale of 1000
    return Math.ceil(max / 500) * 500; // Round up to nearest 500 for clean Y-axis ticks
  }, [data]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxVal / 4;
    for (let i = 0; i <= 4; i++) {
      ticks.push(Math.round(step * i));
    }
    return ticks;
  }, [maxVal]);

  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted">No monthly sales data available</div>;
  }

  // Chart layout dimensions
  const svgHeight = 240;
  const paddingBottom = 30;
  const paddingTop = 20;
  const paddingLeft = 60;
  const paddingRight = 20;

  const chartHeight = svgHeight - paddingTop - paddingBottom;

  return (
    <div className="w-100 position-relative">
      <div className="table-responsive border-0 shadow-none bg-transparent">
        <svg
          viewBox={`0 0 600 ${svgHeight}`}
          width="100%"
          height="100%"
          className="overflow-visible"
          style={{ minWidth: '450px' }}
        >
          <defs>
            {/* Vibrant gradient fill for the bars */}
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3f51b5" />
              <stop offset="100%" stopColor="#2196f3" />
            </linearGradient>
            {/* Subtle glow filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#3f51b5" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Grid lines and Y-axis Ticks */}
          {yTicks.map((tick, index) => {
            const ratio = tick / maxVal;
            const y = svgHeight - paddingBottom - ratio * chartHeight;
            return (
              <g key={tick}>
                {/* Grid Line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={600 - paddingRight}
                  y2={y}
                  stroke="#e9ecef"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                {/* Y-axis Text Label */}
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill="#6c757d"
                  fontSize="11"
                  textAnchor="end"
                  fontWeight="500"
                >
                  ${tick}
                </text>
              </g>
            );
          })}

          {/* Draw Bars and X-axis Labels */}
          {data.map((item, index) => {
            const barCount = data.length;
            const totalWidth = 600 - paddingLeft - paddingRight;
            const stepWidth = totalWidth / barCount;
            const barWidth = Math.min(stepWidth * 0.5, 40); // Cap max bar width for aesthetics
            
            const x = paddingLeft + index * stepWidth + (stepWidth - barWidth) / 2;
            const barHeight = (item.sales / maxVal) * chartHeight;
            const y = svgHeight - paddingBottom - barHeight;

            return (
              <g key={item.month} className="chart-bar-group">
                {/* Bar Chart Rect */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 3)} // Ensure small value is visible
                  rx="6"
                  ry="6"
                  fill="url(#barGradient)"
                  filter="url(#glow)"
                  style={{
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transformOrigin: `${x + barWidth / 2}px ${svgHeight - paddingBottom}px`,
                  }}
                />

                {/* Sales value display above bar */}
                {item.sales > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 6}
                    fill="#3f51b5"
                    fontSize="10.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ${Math.round(item.sales)}
                  </text>
                )}

                {/* X-axis text label (Month) */}
                <text
                  x={x + barWidth / 2}
                  y={svgHeight - 10}
                  fill="#495057"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {item.month}
                </text>
              </g>
            );
          })}

          {/* Base X-axis Line */}
          <line
            x1={paddingLeft}
            y1={svgHeight - paddingBottom}
            x2={600 - paddingRight}
            y2={svgHeight - paddingBottom}
            stroke="#ced4da"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};

export default SalesChart;
