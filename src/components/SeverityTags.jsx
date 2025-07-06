import React from 'react';
import { AlertTriangle, XCircle, AlertCircle, CheckCircle, Zap } from 'lucide-react';

const SeverityTags = ({ severity, confidence = null, aiPowered = false, className = "" }) => {
  const getSeverityConfig = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'high':
      case 'severe':
        return {
          bg: 'bg-red-100',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: XCircle,
          label: 'HIGH RISK'
        };
      case 'moderate':
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          label: 'MODERATE'
        };
      case 'low':
      case 'mild':
        return {
          bg: 'bg-green-100',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: AlertCircle,
          label: 'LOW RISK'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: CheckCircle,
          label: 'UNKNOWN'
        };
    }
  };

  const config = getSeverityConfig(severity);
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {/* Main Severity Tag */}
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.border} ${config.text} border`}>
        <Icon className="w-3 h-3 mr-1" />
        <span>{config.label}</span>
      </div>

      {/* AI Confidence Badge */}
      {confidence !== null && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <span>{Math.round(confidence * 100)}% confident</span>
        </div>
      )}

      {/* AI Powered Indicator */}
      {aiPowered && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Zap className="w-3 h-3 mr-1" />
          <span>AI</span>
        </div>
      )}
    </div>
  );
};

export default SeverityTags;
