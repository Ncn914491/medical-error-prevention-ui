// Base API configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Adjust based on your backend server
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''; // Get API key from environment variable

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  return response.json();
};

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Patient-related API calls
export const getPatients = async () => {
  return await apiCall('/patients');
};

export const getPatientById = async (patientId) => {
  return await apiCall(`/patients/${patientId}`);
};

// Medication checking API calls
export const checkMedications = async (payload) => {
  return await apiCall('/check_medications', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getMedicationReport = async (patientId) => {
  return await apiCall(`/medication_report/${patientId}`);
};

// Real Groq API integration for diagnosis analysis
export const analyzeDignosisWithGroq = async (diagnosis, clinicalNotes, patientData) => {
  const prompt = `Analyze the following clinical data and identify potential diagnosis errors or mismatches:

Diagnosis: ${diagnosis}
Notes: ${clinicalNotes}

Patient Context:
- Age: ${patientData.age}, Gender: ${patientData.gender}
- Allergies: ${patientData.allergies?.join(', ') || 'None'}
- Current Medications: ${patientData.current_medications?.map(med => med.name).join(', ') || 'None'}

Please provide:
1. Consistency analysis between diagnosis and clinical notes
2. Potential diagnostic errors or inconsistencies
3. Risk assessment (low/moderate/high)
4. Clinical recommendations

Respond in JSON format with: {"consistency": "high/moderate/low", "issues": [{"type": "error_type", "severity": "low/moderate/high", "description": "issue description", "recommendation": "specific recommendation"}], "overall_risk": "low/moderate/high", "recommendations": ["rec1", "rec2"]}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert medical AI assistant specializing in clinical diagnosis analysis and error prevention. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Try to parse JSON response
    try {
      const jsonResponse = JSON.parse(aiResponse);
      return {
        success: true,
        analysis_method: 'groq_llama_3.3_70b',
        data: jsonResponse,
        raw_response: aiResponse,
        tokens_used: data.usage?.total_tokens || 0
      };
    } catch (parseError) {
      // If JSON parsing fails, return structured response
      return {
        success: true,
        analysis_method: 'groq_llama_3.3_70b',
        data: {
          consistency: 'moderate',
          issues: [{
            type: 'analysis_response',
            severity: 'low',
            description: 'AI provided detailed analysis in text format',
            recommendation: 'Review AI response for clinical insights'
          }],
          overall_risk: 'moderate',
          recommendations: ['Review AI analysis carefully', 'Consider additional clinical evaluation']
        },
        raw_response: aiResponse,
        tokens_used: data.usage?.total_tokens || 0
      };
    }
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Failed to analyze diagnosis: ${error.message}`);
  }
};

// Fallback diagnosis analysis API calls
export const analyzeDiagnosis = async (payload) => {
  return await apiCall('/analyze_diagnosis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const checkDiagnosisAlignment = async (patientId) => {
  return await apiCall(`/diagnosis_alignment/${patientId}`);
};

// EHR auditing API calls
export const auditEHR = async (payload) => {
  return await apiCall('/audit_ehr', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getEHRAuditReport = async (patientId) => {
  return await apiCall(`/ehr_audit/${patientId}`);
};

// Mock data functions for development (when backend is not available)
export const getMockPatients = () => {
  return Promise.resolve([
    {
      patient_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      name: 'John Smith',
      age: 65,
      gender: 'Male',
      known_allergies: ['penicillin', 'sulfa drugs', 'iodine'],
      current_medications: [
        { name: 'warfarin', dosage: '5mg', frequency: 'once daily' },
        { name: 'metformin', dosage: '500mg', frequency: 'twice daily' },
        { name: 'lisinopril', dosage: '10mg', frequency: 'once daily' }
      ]
    },
    {
      patient_id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
      name: 'Maria Rodriguez',
      age: 42,
      gender: 'Female',
      known_allergies: ['codeine', 'latex'],
      current_medications: [
        { name: 'sertraline', dosage: '100mg', frequency: 'once daily' },
        { name: 'ibuprofen', dosage: '400mg', frequency: 'as needed' }
      ]
    }
  ]);
};

export const getMockMedicationReport = () => {
  return Promise.resolve({
    patient_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    patient_name: 'John Smith',
    medication_analysis: {
      total_medications: 3,
      drug_interactions: [
        {
          drug1: 'metformin',
          drug2: 'lisinopril',
          severity: 'mild',
          description: 'Potential interaction between metformin and lisinopril'
        }
      ],
      interaction_severity: { mild: 1, moderate: 0, severe: 0 },
      interaction_risk_level: 'low'
    },
    allergy_analysis: {
      total_allergies: 3,
      contraindications: [],
      allergy_risk_level: 'low'
    },
    overall_risk_assessment: 'low',
    recommendations: [
      'Continue monitoring medications',
      'Regular follow-up recommended'
    ]
  });
};

export const getMockDiagnosisAnalysis = () => {
  return Promise.resolve({
    patient_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    analysis_method: 'groq_llama_3.3_70b',
    inconsistencies: [
      {
        type: 'missing_documentation',
        diagnosis: 'I25.10 - Atherosclerotic heart disease',
        issue: 'Lack of detailed documentation regarding lipid profile',
        severity: 'moderate',
        recommendation: 'Update patient record with current lipid profile'
      }
    ],
    total_inconsistencies: 1,
    overall_consistency: 'moderate',
    confidence_score: 0.8,
    recommendations: [
      'Consider ordering lipid profile',
      'Schedule regular follow-up appointments'
    ]
  });
};

export const getMockEHRAudit = () => {
  return Promise.resolve({
    patient_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    patient_name: 'John Smith',
    audit_summary: {
      contradictions_found: 0,
      completeness_score: 0.75,
      monitoring_compliance: 0.60,
      quality_score: 0.85
    },
    overall_assessment: 'good',
    recommendations: [
      'Improve medication monitoring documentation',
      'Add missing clinical data points'
    ]
  });
};
