import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  TrendingUp,
  Brain,
  Pill,
  FileText,
  Clock
} from 'lucide-react';

const AlertDisplay = ({ analysisResults }) => {
  if (!analysisResults || analysisResults.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
          <p className="text-gray-500">
            Select a patient and run analysis to see AI-powered insights here.
          </p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'severe':
        return 'red';
      case 'moderate':
      case 'medium':
        return 'yellow';
      case 'low':
      case 'mild':
        return 'green';
      default:
        return 'blue';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
      case 'severe':
        return XCircle;
      case 'moderate':
      case 'medium':
        return AlertTriangle;
      case 'low':
      case 'mild':
        return AlertCircle;
      default:
        return CheckCircle;
    }
  };

  const getAnalysisTypeIcon = (type) => {
    switch (type) {
      case 'medication':
        return Pill;
      case 'diagnosis':
        return Brain;
      case 'ehr_audit':
        return FileText;
      default:
        return TrendingUp;
    }
  };

  const getAnalysisTypeName = (type) => {
    switch (type) {
      case 'medication':
        return 'Medication Safety Analysis';
      case 'diagnosis':
        return 'AI Diagnosis Analysis';
      case 'ehr_audit':
        return 'Clinical Notes Audit';
      default:
        return 'Analysis';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderMedicationResults = (data) => {
    const interactions = data.medication_analysis?.drug_interactions || [];
    const contraindications = data.allergy_analysis?.contraindications || [];
    const recommendations = data.recommendations || [];

    return (
      <div className="space-y-4">
        {/* Overall Risk Assessment */}
        <div className={`p-4 rounded-lg border ${
          data.overall_risk_assessment === 'high' 
            ? 'bg-red-50 border-red-200' 
            : data.overall_risk_assessment === 'moderate'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              data.overall_risk_assessment === 'high' 
                ? 'bg-red-500' 
                : data.overall_risk_assessment === 'moderate'
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}></div>
            <span className="font-medium">Overall Risk: {data.overall_risk_assessment?.toUpperCase()}</span>
          </div>
        </div>

        {/* Drug Interactions */}
        {interactions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Drug Interactions ({interactions.length})</h4>
            <div className="space-y-2">
              {interactions.map((interaction, index) => {
                const color = getSeverityColor(interaction.severity);
                const Icon = getSeverityIcon(interaction.severity);
                
                return (
                  <div key={index} className={`p-3 rounded-md border bg-${color}-50 border-${color}-200`}>
                    <div className="flex items-start space-x-2">
                      <Icon className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {interaction.drug1} ↔ {interaction.drug2}
                        </div>
                        <div className={`text-sm text-${color}-700`}>
                          Severity: {interaction.severity} | {interaction.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Allergy Contraindications */}
        {contraindications.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Allergy Contraindications ({contraindications.length})</h4>
            <div className="space-y-2">
              {contraindications.map((contra, index) => (
                <div key={index} className="p-3 rounded-md border bg-red-50 border-red-200">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {contra.medication} - Allergic to {contra.allergy}
                      </div>
                      <div className="text-sm text-red-700">{contra.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Clinical Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderDiagnosisResults = (data) => {
    const inconsistencies = data.inconsistencies || [];
    const recommendations = data.recommendations || [];

    return (
      <div className="space-y-4">
        {/* AI Analysis Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Analysis Method</div>
            <div className="font-medium text-blue-900">{data.analysis_method || 'AI Analysis'}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-600">Consistency Level</div>
            <div className="font-medium text-purple-900">{data.overall_consistency?.toUpperCase() || 'N/A'}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600">AI Confidence</div>
            <div className="font-medium text-green-900">
              {data.confidence_score ? `${Math.round(data.confidence_score * 100)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Inconsistencies */}
        {inconsistencies.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Identified Issues ({inconsistencies.length})</h4>
            <div className="space-y-3">
              {inconsistencies.map((issue, index) => {
                const color = getSeverityColor(issue.severity);
                const Icon = getSeverityIcon(issue.severity);
                
                return (
                  <div key={index} className={`p-4 rounded-md border bg-${color}-50 border-${color}-200`}>
                    <div className="flex items-start space-x-2">
                      <Icon className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {issue.type?.replace('_', ' ').toUpperCase()}: {issue.diagnosis}
                        </div>
                        <div className={`text-sm text-${color}-700 mb-2`}>
                          {issue.issue}
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded border">
                          <strong>Recommendation:</strong> {issue.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">AI Clinical Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderEHRAuditResults = (data) => {
    const summary = data.audit_summary || {};
    const recommendations = data.recommendations || [];
    const contradictions = data.detailed_findings?.contradictions?.contradictions || [];
    const missingElements = data.detailed_findings?.completeness?.missing_elements || [];
    const monitoringIssues = data.detailed_findings?.monitoring?.medication_monitoring || [];

    return (
      <div className="space-y-4">
        {/* Audit Summary Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-600">Completeness</div>
            <div className="font-medium text-blue-900">
              {Math.round((summary.completeness_score || 0) * 100)}%
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-600">Quality Score</div>
            <div className="font-medium text-green-900">
              {Math.round((summary.quality_score || 0) * 100)}%
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-600">Monitoring</div>
            <div className="font-medium text-yellow-900">
              {Math.round((summary.monitoring_compliance || 0) * 100)}%
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="text-sm text-purple-600">Contradictions</div>
            <div className="font-medium text-purple-900">
              {summary.contradictions_found || 0}
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className={`p-4 rounded-lg border ${
          data.overall_assessment === 'excellent' 
            ? 'bg-green-50 border-green-200' 
            : data.overall_assessment === 'good'
            ? 'bg-blue-50 border-blue-200'
            : data.overall_assessment === 'fair'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            <CheckCircle className={`w-5 h-5 ${
              data.overall_assessment === 'excellent' 
                ? 'text-green-600' 
                : data.overall_assessment === 'good'
                ? 'text-blue-600'
                : data.overall_assessment === 'fair'
                ? 'text-yellow-600'
                : 'text-red-600'
            }`} />
            <span className="font-medium">
              Overall Assessment: {data.overall_assessment?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Audit Recommendations</h4>
            <ul className="space-y-1">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {analysisResults.map((result, index) => {
        const TypeIcon = getAnalysisTypeIcon(result.type);
        
        return (
          <div key={index} className="card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <TypeIcon className="w-5 h-5 text-medical-primary" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {getAnalysisTypeName(result.type)}
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{formatTimestamp(result.timestamp)}</span>
              </div>
            </div>

            {/* Patient Info */}
            {result.data.patient_name && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm">
                  <span className="text-gray-600">Patient:</span>
                  <span className="ml-2 font-medium">{result.data.patient_name}</span>
                  <span className="ml-4 text-gray-600">ID:</span>
                  <span className="ml-1 font-mono text-xs">{result.data.patient_id?.slice(0, 8)}...</span>
                </div>
              </div>
            )}

            {/* Results Content */}
            {result.type === 'medication' && renderMedicationResults(result.data)}
            {result.type === 'diagnosis' && renderDiagnosisResults(result.data)}
            {result.type === 'ehr_audit' && renderEHRAuditResults(result.data)}
          </div>
        );
      })}
    </div>
  );
};

export default AlertDisplay;
