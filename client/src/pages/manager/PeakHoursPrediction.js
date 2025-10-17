import React from 'react';
import PeakHoursChartDashboard from '../../components/Analytics/PeakHoursChartDashboard';

const PeakHoursPrediction = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <PeakHoursChartDashboard embedded={false} />
    </div>
  );
};

export default PeakHoursPrediction;
