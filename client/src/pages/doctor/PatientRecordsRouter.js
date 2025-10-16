import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PatientRecordsList from './PatientRecordsList';
import PatientRecords from './PatientRecords';

const PatientRecordsRouter = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  // If patientId is provided, show individual patient records
  if (patientId) {
    return <PatientRecords />;
  }

  // Otherwise, show the patient records list
  return <PatientRecordsList />;
};

export default PatientRecordsRouter;
