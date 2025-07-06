import React, { useState } from 'react';
import { FileText, Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { getMockEHRAudit } from '../services/api';

const EHRUploadSection = ({ selectedPatient, onAnalysisComplete, isPatientView = false }) => {
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient && !isPatientView) {
      setError('Please select a patient first');
      return;
    }

    if (!clinicalNotes.trim()) {
      setError('Please enter clinical notes to audit');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare payload
      const payload = {
        patient_id: selectedPatient.patient_id,
        clinical_notes: clinicalNotes.trim(),
        patient_data: {
          name: selectedPatient.name,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          allergies: selectedPatient.known_allergies,
          current_medications: selectedPatient.current_medications
        }
      };

      // Call API - using mock for now
      const result = await getMockEHRAudit();
      
      // Pass result to parent component
      onAnalysisComplete({
        type: 'ehr_audit',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      setError('Failed to audit EHR: ' + err.message);
      console.error('EHR audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleNotes = () => {
    setClinicalNotes(`Chief Complaint: Follow-up for coronary artery disease and diabetes

History of Present Illness:
65-year-old male with history of CAD s/p MI in 2020, well-controlled T2DM, and hypertension. Patient reports occasional chest discomfort with exertion, rated 3/10, lasting 2-3 minutes and resolving with rest. No associated shortness of breath, nausea, or diaphoresis. Patient denies any recent bleeding episodes.

Physical Examination:
Vitals: BP 130/80, HR 72, regular rhythm, afebrile
General: Well-appearing male in no acute distress
Cardiovascular: Regular rate and rhythm, no murmurs
Respiratory: Clear to auscultation bilaterally
Extremities: No edema

Current Medications:
1. Warfarin 5mg daily for anticoagulation
2. Metformin 500mg twice daily for diabetes management  
3. Lisinopril 10mg daily for blood pressure control

Assessment and Plan:
1. Coronary Artery Disease: Stable angina symptoms. Continue current cardiac medications. Patient counseled on activity modification.
2. Type 2 Diabetes: Well controlled on current regimen. Continue metformin.
3. Hypertension: Blood pressure well controlled on lisinopril.

Follow-up in 3 months or sooner if symptoms worsen.`);
  };

  const auditFeatures = [
    'Internal contradiction detection',
    'Documentation completeness assessment',
    'Medication monitoring compliance',
    'Clinical quality scoring',
    'Missing data identification',
    'Recommendation generation'
  ];

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <FileText className="w-5 h-5 text-medical-primary" />
        <h3 className="text-lg font-semibold text-gray-900">EHR Clinical Notes Auditor</h3>
      </div>

      {!selectedPatient && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 text-yellow-800">
            <AlertTriangle className="w-5 h-5" />
            <span>Please select a patient to audit clinical notes</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Clinical Notes Input */}
        <div>
          <label className="form-label">
            Clinical Notes
            <span className="text-red-500 ml-1">*</span>
          </label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Paste or type clinical notes here for comprehensive auditing..."
            className="form-input min-h-[300px] resize-y font-mono text-sm"
            disabled={loading}
            required
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-gray-500">
              Character count: {clinicalNotes.length} | Word count: {clinicalNotes.trim().split(/\s+/).filter(word => word.length > 0).length}
            </p>
            <button
              type="button"
              onClick={loadSampleNotes}
              disabled={loading}
              className="text-medical-primary hover:text-medical-primary/80 text-sm disabled:opacity-50"
            >
              Load Sample Notes
            </button>
          </div>
        </div>

        {/* Audit Features */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3 flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" />
            Audit Analysis Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {auditFeatures.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm text-green-700">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Metrics Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Quality Assessment Criteria</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <div className="font-medium mb-1">Documentation Standards:</div>
              <ul className="space-y-1 ml-4">
                <li>• Completeness of required elements</li>
                <li>• Medication monitoring compliance</li>
                <li>• Consistency with patient history</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Quality Metrics:</div>
              <ul className="space-y-1 ml-4">
                <li>• Objective data presence</li>
                <li>• Assessment and plan clarity</li>
                <li>• Medical terminology usage</li>
              </ul>
            </div>
          </div>
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
            disabled={!selectedPatient || !clinicalNotes.trim() || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin -ml-1 mr-3 h-4 w-4 border border-white border-t-transparent rounded-full"></div>
                Auditing Notes...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Audit Clinical Notes
              </>
            )}
          </button>
        </div>
      </form>

      {/* File Upload Alternative */}
      <div className="mt-6 p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <FileText className="mx-auto h-8 w-8 text-gray-400" />
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              Future Feature: Drag and drop clinical note files
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: PDF, DOC, TXT (Coming Soon)
            </p>
          </div>
        </div>
      </div>

      {/* Patient Context for Auditing */}
      {selectedPatient && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Patient Context for Audit</h4>
          <div className="text-sm text-gray-600">
            <p>
              The audit will cross-reference the clinical notes against {selectedPatient.name}'s 
              medical profile including {selectedPatient.known_allergies?.length || 0} known allergies 
              and {selectedPatient.current_medications?.length || 0} current medications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EHRUploadSection;
