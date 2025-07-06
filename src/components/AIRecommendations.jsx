import React, { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Lightbulb, Brain, Stethoscope, AlertTriangle } from 'lucide-react';

const AIRecommendations = ({ analysisData, analysisType, className = "" }) => {
  const [feedback, setFeedback] = useState({});

  // Load saved feedback from localStorage
  useEffect(() => {
    const savedFeedback = localStorage.getItem('medsafe_ai_feedback');
    if (savedFeedback) {
      try {
        setFeedback(JSON.parse(savedFeedback));
      } catch (error) {
        console.error('Failed to load feedback:', error);
      }
    }
  }, []);

  // Save feedback to localStorage
  const saveFeedback = (newFeedback) => {
    try {
      localStorage.setItem('medsafe_ai_feedback', JSON.stringify(newFeedback));
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  const handleFeedback = (recommendationId, isUseful) => {
    const newFeedback = {
      ...feedback,
      [recommendationId]: {
        useful: isUseful,
        timestamp: new Date().toISOString()
      }
    };
    setFeedback(newFeedback);
    saveFeedback(newFeedback);
  };

  const generateSmartRecommendations = () => {
    const recommendations = [];

    if (analysisType === 'diagnosis' && analysisData) {
      // AI-powered diagnosis recommendations
      const issues = analysisData.inconsistencies || [];
      const riskLevel = analysisData.overall_risk || 'moderate';

      if (issues.length > 0) {
        recommendations.push({
          id: `diag_${Date.now()}_1`,
          icon: Brain,
          type: 'diagnostic',
          severity: riskLevel,
          title: 'Enhanced Diagnostic Review',
          description: `AI detected ${issues.length} potential issue${issues.length > 1 ? 's' : ''} requiring clinical attention.`,
          action: 'Review AI findings and consider additional diagnostic workup',
          confidence: analysisData.confidence_score || 0.8
        });

        if (riskLevel === 'high') {
          recommendations.push({
            id: `diag_${Date.now()}_2`,
            icon: AlertTriangle,
            type: 'urgent',
            severity: 'high',
            title: 'Urgent Clinical Consultation',
            description: 'High-risk inconsistencies detected that may affect patient safety.',
            action: 'Consult attending physician or specialist immediately',
            confidence: 0.9
          });
        }
      }

      // Suggest lab tests based on diagnosis
      if (analysisData.patient_name) {
        recommendations.push({
          id: `diag_${Date.now()}_3`,
          icon: Stethoscope,
          type: 'laboratory',
          severity: 'moderate',
          title: 'Recommended Laboratory Tests',
          description: 'AI suggests additional tests to support or rule out current diagnosis.',
          action: 'Consider CBC, CMP, lipid panel, and HbA1c based on patient profile',
          confidence: 0.75
        });
      }
    }

    if (analysisType === 'medication' && analysisData) {
      // Medication safety recommendations
      const interactions = analysisData.medication_analysis?.drug_interactions || [];
      const contraindications = analysisData.allergy_analysis?.contraindications || [];

      if (interactions.length > 0) {
        recommendations.push({
          id: `med_${Date.now()}_1`,
          icon: AlertTriangle,
          type: 'safety',
          severity: 'high',
          title: 'Medication Interaction Management',
          description: `${interactions.length} drug interaction${interactions.length > 1 ? 's' : ''} detected requiring immediate attention.`,
          action: 'Review medication timing, consider alternatives, or implement enhanced monitoring',
          confidence: 0.95
        });
      }

      if (contraindications.length > 0) {
        recommendations.push({
          id: `med_${Date.now()}_2`,
          icon: AlertTriangle,
          type: 'critical',
          severity: 'high',
          title: 'Critical Allergy Alert',
          description: 'Patient prescribed medication(s) that conflict with known allergies.',
          action: 'STOP medication immediately and substitute with non-allergenic alternative',
          confidence: 0.99
        });
      }

      if (interactions.length === 0 && contraindications.length === 0) {
        recommendations.push({
          id: `med_${Date.now()}_3`,
          icon: Lightbulb,
          type: 'optimization',
          severity: 'low',
          title: 'Medication Optimization',
          description: 'Current regimen appears safe. Consider optimizing for cost-effectiveness.',
          action: 'Review for generic alternatives and dose optimization opportunities',
          confidence: 0.7
        });
      }
    }

    if (analysisType === 'ehr_audit' && analysisData) {
      // EHR audit recommendations
      const overallAssessment = analysisData.overall_assessment || 'good';
      const completeness = analysisData.audit_summary?.completeness_score || 0;

      if (completeness < 0.7) {
        recommendations.push({
          id: `ehr_${Date.now()}_1`,
          icon: Stethoscope,
          type: 'documentation',
          severity: 'moderate',
          title: 'Improve Documentation Completeness',
          description: `Clinical documentation is ${Math.round(completeness * 100)}% complete.`,
          action: 'Add missing vital signs, lab values, and assessment details',
          confidence: 0.85
        });
      }

      if (overallAssessment === 'poor' || overallAssessment === 'fair') {
        recommendations.push({
          id: `ehr_${Date.now()}_2`,
          icon: Brain,
          type: 'quality',
          severity: 'moderate',
          title: 'Enhance Clinical Documentation',
          description: 'AI detected opportunities to improve documentation quality and consistency.',
          action: 'Include more specific clinical details and structured assessment',
          confidence: 0.8
        });
      }
    }

    return recommendations;
  };

  const recommendations = generateSmartRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Brain className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">AI Clinical Recommendations</h3>
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <span>{recommendations.length} suggestions</span>
        </div>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const Icon = rec.icon;
          const severityColor = rec.severity === 'high' ? 'red' : rec.severity === 'moderate' ? 'yellow' : 'green';
          const userFeedback = feedback[rec.id];

          return (
            <div key={rec.id} className={`p-4 rounded-lg border bg-${severityColor}-50 border-${severityColor}-200`}>
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 text-${severityColor}-600 mt-0.5 flex-shrink-0`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <div className="flex items-center space-x-2">
                      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {Math.round(rec.confidence * 100)}% confidence
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${severityColor}-100 text-${severityColor}-800 border border-${severityColor}-200`}>
                        {rec.severity.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <p className={`text-sm text-${severityColor}-700 mb-2`}>{rec.description}</p>
                  
                  <div className="bg-white p-3 rounded border mb-3">
                    <div className="text-sm font-medium text-gray-900 mb-1">Recommended Action:</div>
                    <div className="text-sm text-gray-700">{rec.action}</div>
                  </div>

                  {/* Feedback Section */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Was this recommendation useful?
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleFeedback(rec.id, true)}
                        className={`p-1 rounded ${
                          userFeedback?.useful === true
                            ? 'bg-green-100 text-green-600'
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title="Useful"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(rec.id, false)}
                        className={`p-1 rounded ${
                          userFeedback?.useful === false
                            ? 'bg-red-100 text-red-600'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                        }`}
                        title="Not useful"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Summary */}
      <div className="text-xs text-gray-500 text-center">
        Your feedback helps improve AI recommendations for better clinical decision support.
      </div>
    </div>
  );
};

export default AIRecommendations;
