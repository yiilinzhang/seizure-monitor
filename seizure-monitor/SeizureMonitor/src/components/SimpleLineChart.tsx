import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';

interface SimpleLineChartProps {
  data: number[];
  width: number;
  height: number;
  yMin: number;
  yMax: number;
  color: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  width,
  height,
  yMin,
  yMax,
  color,
}) => {
  if (data.length === 0) {
    return (
      <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#8A8A8A' }}>No data</Text>
      </View>
    );
  }

  const padding = { top: 10, right: 10, bottom: 10, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate points
  const xStep = chartWidth / Math.max(data.length - 1, 1);
  const yRange = yMax - yMin;

  const points = data.map((value, index) => {
    const x = padding.left + index * xStep;
    const y = padding.top + chartHeight - ((value - yMin) / yRange) * chartHeight;
    return { x, y };
  });

  // Create path string
  let pathData = '';
  points.forEach((point, index) => {
    if (index === 0) {
      pathData += `M ${point.x} ${point.y}`;
    } else {
      pathData += ` L ${point.x} ${point.y}`;
    }
  });

  // Calculate Y-axis labels
  const numLabels = 5;
  const yLabels = [];
  for (let i = 0; i < numLabels; i++) {
    const value = yMax - (i * (yMax - yMin)) / (numLabels - 1);
    const y = padding.top + (i * chartHeight) / (numLabels - 1);
    yLabels.push({ value: value.toFixed(1), y });
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yLabels.map((label, index) => (
          <Line
            key={index}
            x1={padding.left}
            y1={label.y}
            x2={width - padding.right}
            y2={label.y}
            stroke="#F0F0F0"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, index) => (
          <SvgText
            key={index}
            x={5}
            y={label.y + 4}
            fontSize="10"
            fill="#8A8A8A"
          >
            {label.value}
          </SvgText>
        ))}

        {/* Data line */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
