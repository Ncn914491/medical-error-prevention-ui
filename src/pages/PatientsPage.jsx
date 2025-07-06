import React from 'react';
import PatientSelector from '../components/PatientSelector';

const PatientsPage = ({ selectedPatient, onPatientSelect }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Management</h1>
        <p className="text-gray-600">
          Select a patient to view their medical information and perform safety analyses.
        </p>
      </div>
      
      <PatientSelector 
        selectedPatient={selectedPatient}
        onPatientSelect={onPatientSelect}
      />
    </div>
  );
};

export default PatientsPage;
