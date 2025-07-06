import React, { useState } from 'react';
import { Pill, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getMockMedicationReport } from '../services/api';
import MedicationAlerts from './MedicationAlerts';

const MedicationInputForm = ({ selectedPatient, onAnalysisComplete, isPatientView = false }) => {
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }]);
  };

  const removeMedication = (index) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index, field, value) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('Please select a patient first');
      return;
    }

    // Validate medications
    const validMedications = medications.filter(med => 
      med.name.trim() && med.dosage.trim() && med.frequency.trim()
    );

    if (validMedications.length === 0) {
      setError('Please add at least one complete medication');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare payload
      const payload = {
        patient_id: selectedPatient.patient_id,
        medications: validMedications
      };

      // Call API - using mock for now
      const result = await getMockMedicationReport();
      
      // Pass result to parent component
      onAnalysisComplete({
        type: 'medication',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      setError('Failed to analyze medications: ' + err.message);
      console.error('Medication analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasValidMedications = medications.some(med => 
    med.name.trim() && med.dosage.trim() && med.frequency.trim()
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center space-x-2 mb-6">
        <Pill className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Medication Safety Checker</h3>
      </div>

      {!selectedPatient && !isPatientView && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Please select a patient to check medications</span>
          </div>
        </div>
      )}

      {isPatientView && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-blue-800">
            <Pill className="w-5 h-5" />
            <span>Enter your current medications to check for interactions and safety concerns</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Medications List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Medications to Check</label>
          <div className="space-y-4">
            {medications.map((medication, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    value={medication.name}
                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                    placeholder="e.g., Lisinopril"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={medication.dosage}
                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                    placeholder="e.g., 10mg"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={medication.frequency}
                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                    placeholder="e.g., once daily"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeMedication(index)}
                    disabled={medications.length === 1 || loading}
                    className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Medication Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={addMedication}
            disabled={loading}
            className="flex items-center space-x-2 text-green-600 hover:text-green-500 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Medication</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedPatient || !hasValidMedications || loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border border-white border-t-transparent rounded-full"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Pill className="w-4 h-4 mr-2" />
                Check Medication Safety
              </>
            )}
          </button>
        </div>
      </form>

      {/* Real-time Medication Safety Alerts */}
      <MedicationAlerts 
        medications={medications}
        allergies={selectedPatient?.known_allergies || []}
        className="mt-6"
      />

      {/* Quick Load Patient Medications */}
      {selectedPatient?.current_medications?.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Patient's Current Medications</h4>
          <p className="text-sm text-blue-700 mb-3">
            Load the patient's existing medications for analysis
          </p>
          <button
            type="button"
            onClick={() => {
              setMedications(selectedPatient.current_medications.map(med => ({
                name: med.name,
                dosage: med.dosage,
                frequency: med.frequency
              })));
            }}
            disabled={loading}
            className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Load Current Medications ({selectedPatient.current_medications.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default MedicationInputForm;
