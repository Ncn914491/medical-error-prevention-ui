import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DiagnosisForm from '../components/DiagnosisForm';
import EHRUploadSection from '../components/EHRUploadSection';
import AlertDisplay from '../components/AlertDisplay';

const DiagnosisReviewPage = ({ selectedPatient, onAnalysisComplete, analysisResults, isPatientView = false, currentUser = null }) => {
  const navigate = useNavigate();
  const diagnosisResults = analysisResults?.filter(result =>
    result.type === 'diagnosis' || result.type === 'ehr_audit'
  ) || [];

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">My Diagnosis Review</h1>
              <p className="text-gray-600">
                Review your medical diagnoses and clinical notes for consistency and potential concerns using AI analysis.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`${isPatientView ? 'max-w-7xl mx-auto' : ''} space-y-6`}>
        {!isPatientView && (
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Diagnosis Review</h1>
            <p className="text-gray-600">
              Analyze diagnosis consistency, clinical notes quality, and identify potential medical errors using advanced AI.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Input Forms */}
          <div className="space-y-6">
            <DiagnosisForm
              selectedPatient={selectedPatient}
              onAnalysisComplete={onAnalysisComplete}
              isPatientView={isPatientView}
              currentUser={currentUser}
            />

            <EHRUploadSection
              selectedPatient={selectedPatient}
              onAnalysisComplete={onAnalysisComplete}
              isPatientView={isPatientView}
            />
          </div>

          {/* Results Display */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
            <AlertDisplay analysisResults={diagnosisResults} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisReviewPage;
