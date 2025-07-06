import React, { useEffect, useState } from 'react';
import { AlertTriangle, XCircle, AlertCircle, Shield, Eye } from 'lucide-react';
import { checkMedicationSafety, getSeverityColor } from '../services/medicationService';

const MedicationAlerts = ({ medications, allergies, className = "" }) => {
  const [safetyResults, setSafetyResults] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (medications && medications.length > 0) {
      const validMedications = medications.filter(med => 
        med.name && med.name.trim()
      );
      
      if (validMedications.length > 0) {
        const results = checkMedicationSafety(validMedications, allergies || []);
        setSafetyResults(results);
      } else {
        setSafetyResults(null);
      }
    } else {
      setSafetyResults(null);
    }
  }, [medications, allergies]);

  if (!safetyResults) {
    return null;
  }

  const getSeverityIcon = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return XCircle;
      case 'moderate':
        return AlertTriangle;
      case 'low':
        return AlertCircle;
      default:
        return Shield;
    }
  };

  const getRiskBadgeClass = (risk) => {
    const color = getSeverityColor(risk);
    return `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`;
  };

  const totalIssues = safetyResults.interactions.length + safetyResults.allergyContraindications.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Risk Summary */}
      <div className={`p-4 rounded-lg border ${
        safetyResults.overallRisk === 'high' 
          ? 'bg-red-50 border-red-200' 
          : safetyResults.overallRisk === 'moderate'
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className={`w-5 h-5 ${
              safetyResults.overallRisk === 'high' 
                ? 'text-red-600' 
                : safetyResults.overallRisk === 'moderate'
                ? 'text-yellow-600'
                : 'text-green-600'
            }`} />
            <span className="font-medium">
              Safety Status: {safetyResults.overallRisk.toUpperCase()}
            </span>
            <span className={getRiskBadgeClass(safetyResults.overallRisk)}>
              {totalIssues} {totalIssues === 1 ? 'Issue' : 'Issues'} Found
            </span>
          </div>
          {totalIssues > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
            >
              <Eye className="w-4 h-4" />
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Critical Allergy Alerts */}
      {safetyResults.allergyContraindications.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-red-900">CRITICAL: Allergy Contraindications</h4>
          </div>
          <div className="space-y-2">
            {safetyResults.allergyContraindications.map((contra, index) => {
              const SeverityIcon = getSeverityIcon(contra.severity);
              const color = getSeverityColor(contra.severity);
              
              return (
                <div key={index} className={`p-3 rounded-md border bg-${color}-50 border-${color}-200`}>
                  <div className="flex items-start space-x-2">
                    <SeverityIcon className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {contra.medication} - Allergic to {contra.allergy}
                      </div>
                      <div className={`text-sm text-${color}-700 mt-1`}>
                        {contra.description}
                      </div>
                      <div className="text-sm text-gray-600 bg-white p-2 rounded border mt-2">
                        <strong>Action Required:</strong> {contra.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drug Interaction Alerts */}
      {safetyResults.interactions.length > 0 && showDetails && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h4 className="font-medium text-yellow-900">Drug Interactions Detected</h4>
          </div>
          <div className="space-y-2">
            {safetyResults.interactions.map((interaction, index) => {
              const SeverityIcon = getSeverityIcon(interaction.severity);
              const color = getSeverityColor(interaction.severity);
              
              return (
                <div key={index} className={`p-3 rounded-md border bg-${color}-50 border-${color}-200`}>
                  <div className="flex items-start space-x-2">
                    <SeverityIcon className={`w-4 h-4 text-${color}-600 mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {interaction.drug1} ↔ {interaction.drug2}
                      </div>
                      <div className={`text-sm text-${color}-700 mt-1`}>
                        {interaction.description}
                      </div>
                      <div className="text-sm text-gray-600 bg-white p-2 rounded border mt-2">
                        <strong>Recommendation:</strong> {interaction.recommendation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monitoring Alerts */}
      {safetyResults.monitoringAlerts.length > 0 && showDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Enhanced Monitoring Required</h4>
          </div>
          <div className="space-y-2">
            {safetyResults.monitoringAlerts.map((alert, index) => (
              <div key={index} className="p-3 rounded-md border bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-2">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {alert.medication}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Monitor: {alert.monitoring.join(', ')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {safetyResults.recommendations.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Clinical Recommendations</h4>
          <ul className="space-y-1">
            {safetyResults.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start space-x-2 text-sm">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span className={rec.includes('URGENT') || rec.includes('CRITICAL') ? 'font-medium text-red-700' : ''}>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No Issues Found */}
      {totalIssues === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">No Safety Issues Detected</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Current medication regimen appears safe with no known interactions or contraindications.
          </p>
        </div>
      )}
    </div>
  );
};

export default MedicationAlerts;
