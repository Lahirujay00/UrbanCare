import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ChartComponent = ({ type, data, config = {} }) => {
  const {
    width = '100%',
    height = 300,
    colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    showLegend = true,
    showGrid = true,
    showTooltip = true
  } = config;

  // Color palette for consistent styling
  const COLORS = colors;

  const renderLineChart = () => (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="hour" />
        <YAxis />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="totalVisits" 
          stroke={COLORS[0]} 
          strokeWidth={2}
          name="Total Visits"
          dot={{ fill: COLORS[0] }}
        />
        <Line 
          type="monotone" 
          dataKey="avgWaitMin" 
          stroke={COLORS[1]} 
          strokeWidth={2}
          name="Avg Wait (min)"
          dot={{ fill: COLORS[1] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderBarChart = () => (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="hour" />
        <YAxis />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar dataKey="totalVisits" fill={COLORS[0]} name="Total Visits" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderComboChart = () => (
    <ResponsiveContainer width={width} height={height}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="hour" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar yAxisId="left" dataKey="patientLoad" fill={COLORS[0]} name="Patient Load" />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="staffOnDuty" 
          stroke={COLORS[2]} 
          strokeWidth={3}
          name="Staff on Duty"
          dot={{ fill: COLORS[2] }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width={width} height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        {showTooltip && <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />}
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );

  const renderWeeklyChart = () => (
    <ResponsiveContainer width={width} height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="day" />
        <YAxis />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar dataKey="totalVisits" fill={COLORS[0]} name="Total Visits" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderFinancialTrend = () => (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
        <XAxis dataKey="month" />
        <YAxis />
        {showTooltip && <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} />}
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke={COLORS[1]} 
          strokeWidth={2}
          name="Revenue"
          dot={{ fill: COLORS[1] }}
        />
        <Line 
          type="monotone" 
          dataKey="costs" 
          stroke={COLORS[3]} 
          strokeWidth={2}
          name="Costs"
          dot={{ fill: COLORS[3] }}
        />
        <Line 
          type="monotone" 
          dataKey="margin" 
          stroke={COLORS[0]} 
          strokeWidth={2}
          name="Margin"
          dot={{ fill: COLORS[0] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Chart type selector
  switch (type) {
    case 'line':
      return renderLineChart();
    case 'bar':
      return renderBarChart();
    case 'combo':
      return renderComboChart();
    case 'pie':
      return renderPieChart();
    case 'weekly':
      return renderWeeklyChart();
    case 'financial':
      return renderFinancialTrend();
    default:
      return renderBarChart();
  }
};

export default ChartComponent;