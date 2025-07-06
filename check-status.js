// Simple status check script to verify app functionality
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkComponentStatus() {
  const components = [
    'src/components/PatientSelector.jsx',
    'src/components/DiagnosisForm.jsx', 
    'src/components/MedicationInputForm.jsx',
    'src/components/TestingUtils.jsx',
    'src/pages/PatientDashboard.jsx',
    'src/pages/DoctorDashboard.jsx',
    'src/pages/ComponentTest.jsx',
    'src/services/database.js',
    'src/services/dataSharing.js'
  ];

  console.log('🔍 Checking Component Status...\n');

  for (const component of components) {
    const exists = await checkFileExists(join(__dirname, component));
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${component}`);
  }

  // Check package.json dependencies
  console.log('\n📦 Checking Dependencies...');
  
  try {
    const packageJson = await fs.readFile(join(__dirname, 'package.json'), 'utf8');
    const pkg = JSON.parse(packageJson);
    
    const requiredDeps = [
      '@supabase/supabase-js',
      'react',
      'react-dom', 
      'react-router-dom',
      'lucide-react',
      'jspdf',
      'jspdf-autotable'
    ];
    
    for (const dep of requiredDeps) {
      const exists = pkg.dependencies[dep] || pkg.devDependencies[dep];
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${dep} ${exists ? `(${exists})` : ''}`);
    }
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }

  console.log('\n🚀 Status Check Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Navigate to http://localhost:5173/test to test components');
  console.log('2. Check browser console for any runtime errors');
  console.log('3. Test authentication flow at /login');
  console.log('4. Verify database connections and Supabase setup');
}

checkComponentStatus().catch(console.error);
