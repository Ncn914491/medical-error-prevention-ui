// Enhanced Medication Checking Service
// Real-time drug interaction and allergy checking

// Comprehensive drug interaction database
export const drugInteractionDatabase = {
  // Cardiovascular medications
  'warfarin': {
    interactions: [
      { drug: 'aspirin', severity: 'high', description: 'Increased bleeding risk' },
      { drug: 'ibuprofen', severity: 'high', description: 'Increased bleeding risk' },
      { drug: 'sertraline', severity: 'moderate', description: 'May increase warfarin effect' },
      { drug: 'simvastatin', severity: 'moderate', description: 'Possible interaction with bleeding' }
    ],
    contraindications: ['active bleeding', 'recent surgery'],
    monitoring: ['INR', 'bleeding signs']
  },
  
  // Antidepressants
  'sertraline': {
    interactions: [
      { drug: 'warfarin', severity: 'moderate', description: 'May increase anticoagulant effect' },
      { drug: 'ibuprofen', severity: 'moderate', description: 'Increased bleeding risk' },
      { drug: 'tramadol', severity: 'high', description: 'Serotonin syndrome risk' }
    ],
    contraindications: ['MAOI use within 14 days'],
    monitoring: ['mood changes', 'suicidal ideation']
  },
  
  // Pain medications
  'ibuprofen': {
    interactions: [
      { drug: 'warfarin', severity: 'high', description: 'Increased bleeding risk' },
      { drug: 'lisinopril', severity: 'moderate', description: 'Reduced antihypertensive effect' },
      { drug: 'sertraline', severity: 'moderate', description: 'Increased bleeding risk' }
    ],
    contraindications: ['active peptic ulcer', 'severe heart failure'],
    monitoring: ['GI symptoms', 'kidney function']
  },
  
  // ACE inhibitors
  'lisinopril': {
    interactions: [
      { drug: 'ibuprofen', severity: 'moderate', description: 'Reduced antihypertensive effect' },
      { drug: 'spironolactone', severity: 'moderate', description: 'Hyperkalemia risk' }
    ],
    contraindications: ['pregnancy', 'angioedema history'],
    monitoring: ['kidney function', 'potassium levels', 'dry cough']
  },
  
  // Statins
  'simvastatin': {
    interactions: [
      { drug: 'warfarin', severity: 'moderate', description: 'May enhance anticoagulant effect' },
      { drug: 'diltiazem', severity: 'high', description: 'Increased statin toxicity risk' }
    ],
    contraindications: ['active liver disease', 'pregnancy'],
    monitoring: ['liver enzymes', 'muscle pain']
  },
  
  // Diabetes medications
  'metformin': {
    interactions: [
      { drug: 'contrast dye', severity: 'high', description: 'Lactic acidosis risk' },
      { drug: 'alcohol', severity: 'moderate', description: 'Increased lactic acidosis risk' }
    ],
    contraindications: ['severe kidney disease', 'metabolic acidosis'],
    monitoring: ['kidney function', 'lactic acid levels']
  },
  
  // Respiratory medications
  'albuterol': {
    interactions: [
      { drug: 'propranolol', severity: 'high', description: 'Beta-blocker may block bronchodilation' },
      { drug: 'digoxin', severity: 'moderate', description: 'May increase digoxin levels' }
    ],
    contraindications: ['tachyarrhythmias'],
    monitoring: ['heart rate', 'tremor']
  }
};

// Allergy cross-reactivity database
export const allergyDatabase = {
  'penicillin': {
    crossReactive: ['amoxicillin', 'ampicillin', 'piperacillin'],
    severity: 'high',
    description: 'Beta-lactam antibiotics cross-reactivity'
  },
  'sulfa': {
    crossReactive: ['sulfamethoxazole', 'furosemide', 'hydrochlorothiazide'],
    severity: 'moderate',
    description: 'Sulfonamide cross-reactivity'
  },
  'aspirin': {
    crossReactive: ['ibuprofen', 'naproxen', 'celecoxib'],
    severity: 'moderate',
    description: 'NSAID cross-reactivity'
  },
  'iodine': {
    crossReactive: ['contrast dye', 'iodinated solutions'],
    severity: 'high',
    description: 'Iodine-containing compounds'
  },
  'codeine': {
    crossReactive: ['morphine', 'hydrocodone', 'oxycodone'],
    severity: 'moderate',
    description: 'Opioid cross-reactivity'
  },
  'latex': {
    crossReactive: ['banana', 'avocado', 'kiwi'],
    severity: 'low',
    description: 'Latex-fruit syndrome'
  }
};

// Real-time medication checking function
export const checkMedicationSafety = (medications, allergies) => {
  const results = {
    interactions: [],
    allergyContraindications: [],
    monitoringAlerts: [],
    overallRisk: 'low',
    recommendations: []
  };

  // Check drug-drug interactions
  for (let i = 0; i < medications.length; i++) {
    for (let j = i + 1; j < medications.length; j++) {
      const med1 = medications[i].name.toLowerCase();
      const med2 = medications[j].name.toLowerCase();
      
      // Check if med1 interacts with med2
      if (drugInteractionDatabase[med1]) {
        const interaction = drugInteractionDatabase[med1].interactions.find(
          int => int.drug === med2
        );
        if (interaction) {
          results.interactions.push({
            drug1: medications[i].name,
            drug2: medications[j].name,
            severity: interaction.severity,
            description: interaction.description,
            recommendation: getInteractionRecommendation(interaction.severity)
          });
        }
      }
      
      // Check if med2 interacts with med1
      if (drugInteractionDatabase[med2]) {
        const interaction = drugInteractionDatabase[med2].interactions.find(
          int => int.drug === med1
        );
        if (interaction) {
          // Avoid duplicate interactions
          const isDuplicate = results.interactions.some(
            existing => 
              (existing.drug1 === medications[j].name && existing.drug2 === medications[i].name) ||
              (existing.drug1 === medications[i].name && existing.drug2 === medications[j].name)
          );
          if (!isDuplicate) {
            results.interactions.push({
              drug1: medications[j].name,
              drug2: medications[i].name,
              severity: interaction.severity,
              description: interaction.description,
              recommendation: getInteractionRecommendation(interaction.severity)
            });
          }
        }
      }
    }
  }

  // Check allergy contraindications
  medications.forEach(medication => {
    const medName = medication.name.toLowerCase();
    
    allergies.forEach(allergy => {
      const allergyName = allergy.toLowerCase();
      
      // Direct allergy match
      if (medName.includes(allergyName) || allergyName.includes(medName)) {
        results.allergyContraindications.push({
          medication: medication.name,
          allergy: allergy,
          severity: 'high',
          description: `Patient is allergic to ${allergy}`,
          recommendation: 'Discontinue medication immediately and substitute with alternative'
        });
      }
      
      // Cross-reactivity check
      if (allergyDatabase[allergyName]) {
        const crossReactive = allergyDatabase[allergyName].crossReactive.some(
          crossMed => medName.includes(crossMed.toLowerCase())
        );
        if (crossReactive) {
          results.allergyContraindications.push({
            medication: medication.name,
            allergy: allergy,
            severity: allergyDatabase[allergyName].severity,
            description: `Cross-reactivity risk: ${allergyDatabase[allergyName].description}`,
            recommendation: 'Consider alternative medication and monitor closely'
          });
        }
      }
    });
  });

  // Generate monitoring alerts
  medications.forEach(medication => {
    const medName = medication.name.toLowerCase();
    if (drugInteractionDatabase[medName] && drugInteractionDatabase[medName].monitoring) {
      results.monitoringAlerts.push({
        medication: medication.name,
        monitoring: drugInteractionDatabase[medName].monitoring,
        recommendation: `Monitor ${drugInteractionDatabase[medName].monitoring.join(', ')} regularly`
      });
    }
  });

  // Calculate overall risk
  const highSeverityCount = [
    ...results.interactions.filter(i => i.severity === 'high'),
    ...results.allergyContraindications.filter(a => a.severity === 'high')
  ].length;

  const moderateSeverityCount = [
    ...results.interactions.filter(i => i.severity === 'moderate'),
    ...results.allergyContraindications.filter(a => a.severity === 'moderate')
  ].length;

  if (highSeverityCount > 0) {
    results.overallRisk = 'high';
  } else if (moderateSeverityCount > 1) {
    results.overallRisk = 'moderate';
  } else if (moderateSeverityCount > 0 || results.interactions.length > 0) {
    results.overallRisk = 'moderate';
  }

  // Generate recommendations
  if (results.allergyContraindications.length > 0) {
    results.recommendations.push('URGENT: Review allergy contraindications immediately');
  }
  if (highSeverityCount > 0) {
    results.recommendations.push('HIGH PRIORITY: Address severe drug interactions');
  }
  if (results.monitoringAlerts.length > 0) {
    results.recommendations.push('Implement enhanced monitoring protocols');
  }
  if (results.interactions.length === 0 && results.allergyContraindications.length === 0) {
    results.recommendations.push('Current medication regimen appears safe');
    results.recommendations.push('Continue routine monitoring');
  }

  return results;
};

// Helper function to get interaction recommendations
const getInteractionRecommendation = (severity) => {
  switch (severity) {
    case 'high':
      return 'Consider alternative medications or adjust dosing with close monitoring';
    case 'moderate':
      return 'Monitor closely and consider dose adjustments if needed';
    case 'low':
      return 'Routine monitoring recommended';
    default:
      return 'Consult clinical pharmacist for guidance';
  }
};

// Function to get severity color for UI
export const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 'red';
    case 'moderate':
      return 'yellow';
    case 'low':
      return 'green';
    default:
      return 'gray';
  }
};

// Function to get severity priority score
export const getSeverityScore = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'high':
      return 3;
    case 'moderate':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
};
