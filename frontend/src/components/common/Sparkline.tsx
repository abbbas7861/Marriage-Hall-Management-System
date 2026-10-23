import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { SparklinePoint } from '../../types';

interface SparklineProps {
  data: SparklinePoint[];
  color?: string;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  color = '#00685f',
  height = 36,
}) => {
  return (
    <div style={{ width: '100%', height }} className="relative mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="index" hide />
          <YAxis hide domain={[0, 100]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* When data is empty, ensure the empty grid lines and baseline are distinct */}
      {(!data || data.length === 0) && (
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-1">
          <div className="w-full h-px border-b border-dashed border-slate-200"></div>
          <div className="w-full h-px border-b border-dashed border-slate-200"></div>
          <div className="w-full h-px border-b border-slate-300"></div>
        </div>
      )}
    </div>
  );
};
