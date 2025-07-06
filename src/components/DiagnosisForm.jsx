import React, { useState } from 'react';
import { FileSearch, Brain, AlertTriangle, Loader2, Zap } from 'lucide-react';
import { analyzeDignosisWithGroq, getMockDiagnosisAnalysis } from '../services/api';

const DiagnosisForm = ({ selectedPatient, onAnalysisComplete, isPatientView = false, currentUser = null }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // For patient view, use current user; for doctor view, require selected patient
    const patientToUse = isPatientView ? currentUser : selectedPatient;

    if (!patientToUse) {
      setError(isPatientView ? 'Patient data not available' : 'Please select a patient first');
      return;
    }

    if (!diagnosis.trim()) {
      setError('Please enter a diagnosis to analyze');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare patient data for Groq API
      const patientData = {
        age: patientToUse.age,
        gender: patientToUse.gender,
        allergies: patientToUse.known_allergies,
        current_medications: patientToUse.current_medications
      };

      // Call real Groq API
      const result = await analyzeDignosisWithGroq(
        diagnosis.trim(),
        clinicalNotes.trim() || '',
        patientData
      );
      
      // Transform result for consistent display
      const transformedResult = {
        patient_id: patientToUse.patient_id || patientToUse.id || patientToUse.firebase_uid,
        patient_name: patientToUse.name || patientToUse.full_name,
        analysis_method: result.analysis_method,
        inconsistencies: result.data.issues || [],
        total_inconsistencies: result.data.issues?.length || 0,
        overall_consistency: result.data.consistency || 'moderate',
        overall_risk: result.data.overall_risk || 'moderate',
        confidence_score: 0.8, // Default confidence
        recommendations: result.data.recommendations || [],
        tokens_used: result.tokens_used,
        raw_ai_response: result.raw_response
      };
      
      // Pass result to parent component
      onAnalysisComplete({
        type: 'diagnosis',
        data: transformedResult,
        timestamp: new Date().toISOString(),
        source: 'groq_api'
      });

    } catch (err) {
      console.error('Groq API analysis error:', err);
      setError('Failed to analyze diagnosis: ' + err.message);
      
      // Fallback to mock data on error
      try {
        const fallbackResult = await getMockDiagnosisAnalysis();
        onAnalysisComplete({
          type: 'diagnosis',
          data: { ...fallbackResult, fallback: true },
          timestamp: new Date().toISOString(),
          source: 'fallback_mock'
        });
        setError('Using offline analysis due to API error');
      } catch (fallbackErr) {
        setError('Analysis failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleDiagnosis = () => {
    setDiagnosis('I25.10 - Atherosclerotic heart disease of native coronary artery without angina pectoris');
    setClinicalNotes('65-year-old male with history of myocardial infarction in 2020. Patient reports occasional chest discomfort with exertion. Current medications include beta-blocker and statin therapy. Recent stress test shows mild ischemia. Patient denies shortness of breath at rest.');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center space-x-2 mb-6">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI-Powered Diagnosis Analysis</h3>
      </div>

      {!selectedPatient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Please select a patient to analyze diagnosis</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diagnosis Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Diagnosis
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Enter the primary diagnosis (ICD-10 code and description recommended)..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px] resize-y"
            disabled={loading}
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Include ICD-10 codes when available for better analysis accuracy
          </p>
        </div>

        {/* Clinical Notes Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Supporting Clinical Notes
            <span className="text-gray-400 ml-1">(Optional)</span>
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Enter relevant clinical notes, symptoms, examination findings, or additional context..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[150px] resize-y"
            disabled={loading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Additional clinical context helps improve AI analysis accuracy
          </p>
        </div>

        {/* AI Analysis Features */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">AI Analysis Features</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Consistency check between diagnosis and clinical presentation</li>
            <li>• Medication-diagnosis alignment verification</li>
            <li>• Identification of potential missing diagnoses</li>
            <li>• Risk assessment with confidence scoring</li>
            <li>• Clinical recommendations based on current evidence</li>
          </ul>
        </div>

        {/* Sample Data Button */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={loadSampleDiagnosis}
            disabled={loading}
            className="text-blue-600 hover:text-blue-500 text-sm disabled:opacity-50"
          >
            Load Sample Diagnosis
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
            disabled={!selectedPatient || !diagnosis.trim() || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                Analyzing with Groq AI...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze with AI
              </>
            )}
          </button>
        </div>
        
        {/* AI Power Indicator */}
        <div className="text-center mt-2">
          <div className="inline-flex items-center text-xs text-gray-500">
            <Zap className="w-3 h-3 mr-1" />
            <span>Powered by Groq LLaMA 3.3 70B</span>
          </div>
        </div>
      </form>

      {/* Patient Context Display */}
      {selectedPatient && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Patient Context for Analysis</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Age/Gender:</span>
              <span className="ml-2 font-medium">{selectedPatient.age}y {selectedPatient.gender}</span>
            </div>
            <div>
              <span className="text-gray-600">Known Allergies:</span>
              <span className="ml-2 font-medium">
                {selectedPatient.known_allergies?.length > 0 
                  ? selectedPatient.known_allergies.join(', ')
                  : 'None'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Current Medications:</span>
              <span className="ml-2 font-medium">
                {selectedPatient.current_medications?.length > 0
                  ? selectedPatient.current_medications.map(med => med.name).join(', ')
                  : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisForm;
