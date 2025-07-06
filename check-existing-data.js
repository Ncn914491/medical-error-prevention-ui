import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Load environment variables
const envContent = fs.readFileSync('.env', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY)

async function checkExistingData() {
  console.log('📊 Checking existing data in database...\n')
  
  // Check profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
  
  if (!profilesError) {
    console.log(`👥 Profiles: ${profiles.length} records`)
    profiles.forEach(p => console.log(`   - ${p.full_name} (${p.role}) - ${p.email}`))
  }
  
  // Check medications
  const { data: medications, error: medicationsError } = await supabase
    .from('medications')
    .select('*')
  
  if (!medicationsError) {
    console.log(`\n💊 Medications: ${medications.length} records`)
    medications.forEach(m => console.log(`   - ${m.medication_name} (${m.dosage}) for ${m.patient_firebase_uid.slice(-8)}`))
  }
  
  // Check connections
  const { data: connections, error: connectionsError } = await supabase
    .from('patient_doctor_connections')
    .select('*')
  
  if (!connectionsError) {
    console.log(`\n🔗 Patient-Doctor Connections: ${connections.length} records`)
    connections.forEach(c => console.log(`   - Token: ${c.access_token} (Active: ${c.is_active})`))
  }
  
  // Check medical history
  const { data: history, error: historyError } = await supabase
    .from('medical_history')
    .select('*')
  
  if (!historyError) {
    console.log(`\n📋 Medical History: ${history.length} records`)
    history.forEach(h => console.log(`   - ${h.condition_name} (${h.status}) for ${h.patient_firebase_uid.slice(-8)}`))
  }
}

checkExistingData().catch(console.error)
