import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MedicationInputForm from '../components/MedicationInputForm';
import AlertDisplay from '../components/AlertDisplay';

const MedCheckerPage = ({ selectedPatient, onAnalysisComplete, analysisResults, isPatientView = false }) => {
  const navigate = useNavigate();
  const medicationResults = analysisResults?.filter(result => result.type === 'medication') || [];

  return (
    <div className={`${isPatientView ? 'min-h-screen bg-gray-50 p-4' : ''}`}>
      {isPatientView && (
        <div className="max-w-7xl mx-auto">
          {/* Patient View Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Medication Safety Checker</h1>
              <p className="text-gray-600">
                Check your medications for interactions, allergies, and safety concerns using AI-powered analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${isPatientView ? 'max-w-7xl mx-auto' : ''} space-y-6`}>
        {!isPatientView && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Medication Safety Checker</h1>
            <p className="text-gray-600">
              Analyze medication interactions, allergy contraindications, and safety concerns using AI-powered algorithms.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Form */}
          <div>
            <MedicationInputForm
              selectedPatient={selectedPatient}
              onAnalysisComplete={onAnalysisComplete}
              isPatientView={isPatientView}
            />
          </div>

          {/* Results Display */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
            <AlertDisplay analysisResults={medicationResults} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedCheckerPage;
