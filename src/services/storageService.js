// Data Persistence Service using localStorage
// Manages patient data, medications, allergies, and analysis history

const STORAGE_KEYS = {
  PATIENTS: 'medsafe_patients',
  ANALYSIS_HISTORY: 'medsafe_analysis_history',
  APP_SETTINGS: 'medsafe_settings'
};

// Patient Data Management
export const savePatientData = (patients) => {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    return true;
  } catch (error) {
    console.error('Failed to save patient data:', error);
    return false;
  }
};

export const loadPatientData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load patient data:', error);
    return [];
  }
};

export const updatePatient = (patientId, updatedData) => {
  try {
    const patients = loadPatientData();
    const patientIndex = patients.findIndex(p => p.patient_id === patientId);
    
    if (patientIndex !== -1) {
      patients[patientIndex] = { ...patients[patientIndex], ...updatedData };
      return savePatientData(patients);
    }
    return false;
  } catch (error) {
    console.error('Failed to update patient:', error);
    return false;
  }
};

export const addPatient = (patientData) => {
  try {
    const patients = loadPatientData();
    const newPatient = {
      ...patientData,
      patient_id: patientData.patient_id || generatePatientId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    patients.push(newPatient);
    return savePatientData(patients) ? newPatient : null;
  } catch (error) {
    console.error('Failed to add patient:', error);
    return null;
  }
};

// Medication Management
export const updatePatientMedications = (patientId, medications) => {
  return updatePatient(patientId, { 
    current_medications: medications,
    updated_at: new Date().toISOString()
  });
};

export const addMedicationToPatient = (patientId, medication) => {
  try {
    const patients = loadPatientData();
    const patient = patients.find(p => p.patient_id === patientId);
    
    if (patient) {
      if (!patient.current_medications) {
        patient.current_medications = [];
      }
      patient.current_medications.push(medication);
      patient.updated_at = new Date().toISOString();
      return savePatientData(patients);
    }
    return false;
  } catch (error) {
    console.error('Failed to add medication:', error);
    return false;
  }
};

export const removeMedicationFromPatient = (patientId, medicationIndex) => {
  try {
    const patients = loadPatientData();
    const patient = patients.find(p => p.patient_id === patientId);
    
    if (patient && patient.current_medications) {
      patient.current_medications.splice(medicationIndex, 1);
      patient.updated_at = new Date().toISOString();
      return savePatientData(patients);
    }
    return false;
  } catch (error) {
    console.error('Failed to remove medication:', error);
    return false;
  }
};

// Allergy Management
export const updatePatientAllergies = (patientId, allergies) => {
  return updatePatient(patientId, { 
    known_allergies: allergies,
    updated_at: new Date().toISOString()
  });
};

export const addAllergyToPatient = (patientId, allergy) => {
  try {
    const patients = loadPatientData();
    const patient = patients.find(p => p.patient_id === patientId);
    
    if (patient) {
      if (!patient.known_allergies) {
        patient.known_allergies = [];
      }
      if (!patient.known_allergies.includes(allergy)) {
        patient.known_allergies.push(allergy);
        patient.updated_at = new Date().toISOString();
        return savePatientData(patients);
      }
    }
    return false;
  } catch (error) {
    console.error('Failed to add allergy:', error);
    return false;
  }
};

// Analysis History Management
export const saveAnalysisResult = (analysisResult) => {
  try {
    const history = loadAnalysisHistory();
    const newResult = {
      ...analysisResult,
      id: generateAnalysisId(),
      saved_at: new Date().toISOString()
    };
    
    history.unshift(newResult); // Add to beginning of array
    
    // Keep only last 100 analyses to prevent storage bloat
    if (history.length > 100) {
      history.splice(100);
    }
    
    localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(history));
    return newResult;
  } catch (error) {
    console.error('Failed to save analysis result:', error);
    return null;
  }
};

export const loadAnalysisHistory = (patientId = null) => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ANALYSIS_HISTORY);
    const history = data ? JSON.parse(data) : [];
    
    if (patientId) {
      return history.filter(analysis => 
        analysis.data?.patient_id === patientId || 
        analysis.data?.patient_name
      );
    }
    
    return history;
  } catch (error) {
    console.error('Failed to load analysis history:', error);
    return [];
  }
};

export const clearAnalysisHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANALYSIS_HISTORY);
    return true;
  } catch (error) {
    console.error('Failed to clear analysis history:', error);
    return false;
  }
};

// App Settings Management
export const saveAppSettings = (settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save app settings:', error);
    return false;
  }
};

export const loadAppSettings = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS);
    return data ? JSON.parse(data) : getDefaultSettings();
  } catch (error) {
    console.error('Failed to load app settings:', error);
    return getDefaultSettings();
  }
};

// Utility Functions
const generatePatientId = () => {
  return 'pat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateAnalysisId = () => {
  return 'ana_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const getDefaultSettings = () => ({
  theme: 'light',
  notifications: true,
  autoSave: true,
  analysisRetention: 30, // days
  created_at: new Date().toISOString()
});

// Data Import/Export
export const exportPatientData = () => {
  try {
    const patients = loadPatientData();
    const analysisHistory = loadAnalysisHistory();
    const settings = loadAppSettings();
    
    const exportData = {
      patients,
      analysisHistory,
      settings,
      exported_at: new Date().toISOString(),
      version: '1.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export data:', error);
    return null;
  }
};

export const importPatientData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.patients) {
      savePatientData(data.patients);
    }
    
    if (data.analysisHistory) {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(data.analysisHistory));
    }
    
    if (data.settings) {
      saveAppSettings(data.settings);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// Storage Size Management
export const getStorageUsage = () => {
  try {
    let totalSize = 0;
    const sizes = {};
    
    for (const key of Object.values(STORAGE_KEYS)) {
      const data = localStorage.getItem(key);
      const size = data ? new Blob([data]).size : 0;
      sizes[key] = size;
      totalSize += size;
    }
    
    return {
      total: totalSize,
      breakdown: sizes,
      formatted: {
        total: formatBytes(totalSize),
        breakdown: Object.fromEntries(
          Object.entries(sizes).map(([key, size]) => [key, formatBytes(size)])
        )
      }
    };
  } catch (error) {
    console.error('Failed to calculate storage usage:', error);
    return null;
  }
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Auto-save functionality
export const enableAutoSave = (callback, interval = 30000) => {
  return setInterval(callback, interval);
};

export const disableAutoSave = (intervalId) => {
  if (intervalId) {
    clearInterval(intervalId);
  }
};

// Data validation
export const validatePatientData = (patientData) => {
  const required = ['name', 'age', 'gender'];
  const missing = required.filter(field => !patientData[field]);
  
  if (missing.length > 0) {
    return { valid: false, errors: [`Missing required fields: ${missing.join(', ')}`] };
  }
  
  if (patientData.age && (patientData.age < 0 || patientData.age > 150)) {
    return { valid: false, errors: ['Age must be between 0 and 150'] };
  }
  
  return { valid: true, errors: [] };
};
