import React, { useState, useEffect } from 'react';
import { User, Calendar, AlertTriangle, Pill } from 'lucide-react';
import { patientService } from '../services/database';

const PatientSelector = ({ selectedPatient, onPatientSelect }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const patientsData = await patientService.getPatients();
      setPatients(patientsData);
    } catch (err) {
      setError('Failed to load patients');
      console.error('Error loading patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientChange = (event) => {
    const patientId = event.target.value;
    if (patientId) {
      const patient = patients.find(p => p.id === patientId);
      onPatientSelect(patient);
    } else {
      onPatientSelect(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <User className="inline w-4 h-4 mr-2" />
          Select Patient
        </label>
        <select
          value={selectedPatient?.id || ''}
          onChange={handlePatientChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Choose a patient...</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.first_name} {patient.last_name} ({patient.age}y, {patient.gender})
            </option>
          ))}
        </select>
      </div>

      {/* Patient Summary */}
      {selectedPatient && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Basic Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age:</span>
                  <span className="font-medium">{selectedPatient.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gender:</span>
                  <span className="font-medium">{selectedPatient.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Medical Record:</span>
                  <span className="font-mono text-xs">{selectedPatient.medical_record_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                Known Allergies
              </h4>
              <div className="space-y-1">
                {selectedPatient.allergies ? (
                  selectedPatient.allergies.split(',').map((allergy, index) => (
                    <div
                      key={index}
                      className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2 mb-1"
                    >
                      {allergy.trim()}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No known allergies</span>
                )}
              </div>
            </div>
          </div>

          {/* Current Medications */}
          {selectedPatient.current_medications && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Pill className="w-4 h-4 mr-2 text-blue-500" />
                Current Medications
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">{selectedPatient.current_medications}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSelector;
