import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

/**
 * Gauge Chart Component
 * Displays a single metric as a radial gauge (semicircle or full circle)
 */
export default function GaugeChart({ 
  value, 
  max = 100, 
  label, 
  color = '#00d4aa',
  size = 200,
  showPercentage = true,
  fullCircle = false 
}) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const data = [
    {
      name: label,
      value: percentage,
      fill: color
    }
  ];

  const startAngle = fullCircle ? 90 : 180;
  const endAngle = fullCircle ? 450 : 0;

  return (
    <div className="relative" style={{ width: '100%', height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius={fullCircle ? "60%" : "70%"}
          outerRadius={fullCircle ? "80%" : "100%"}
          data={data}
          startAngle={startAngle}
          endAngle={endAngle}
          barSize={fullCircle ? 20 : 24}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: '#1a1f2e' }}
            dataKey="value"
            cornerRadius={10}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {showPercentage ? (
            <>
              <p className="text-3xl font-bold text-white">
                {percentage.toFixed(1)}%
              </p>
              {label && (
                <p className="text-sm text-gray-400 mt-1">{label}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-white">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {max.toLocaleString()}
              </p>
              {label && (
                <p className="text-sm text-gray-400 mt-1">{label}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Gauge Chart Grid - displays multiple gauges in a grid
 */
export function GaugeChartGrid({ gauges }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {gauges.map((gauge, index) => (
        <div key={index} className="bg-dark-card border border-dark-border rounded-lg p-6">
          <GaugeChart {...gauge} />
        </div>
      ))}
    </div>
  );
}
