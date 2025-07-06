-- Create patients table
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    email TEXT,
    phone TEXT,
    address TEXT,
    medical_record_number TEXT UNIQUE,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    allergies TEXT[],
    chronic_conditions TEXT[],
    current_medications JSONB,
    insurance_provider TEXT,
    insurance_policy_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create diagnosis_sessions table
CREATE TABLE diagnosis_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    symptoms TEXT NOT NULL,
    diagnostic_notes TEXT,
    icd_10_codes TEXT[],
    risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    recommendations TEXT,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication_sessions table
CREATE TABLE medication_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    medications JSONB NOT NULL,
    interactions_found JSONB,
    severity_level TEXT CHECK (severity_level IN ('none', 'minor', 'moderate', 'major', 'severe')),
    recommendations TEXT,
    session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_medical_record_number ON patients(medical_record_number);
CREATE INDEX idx_diagnosis_sessions_patient_id ON diagnosis_sessions(patient_id);
CREATE INDEX idx_diagnosis_sessions_user_id ON diagnosis_sessions(user_id);
CREATE INDEX idx_medication_sessions_patient_id ON medication_sessions(patient_id);
CREATE INDEX idx_medication_sessions_user_id ON medication_sessions(user_id);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for patients table
CREATE POLICY "Users can view their own patients" ON patients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patients" ON patients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patients" ON patients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own patients" ON patients
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for diagnosis_sessions table
CREATE POLICY "Users can view their own diagnosis sessions" ON diagnosis_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnosis sessions" ON diagnosis_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnosis sessions" ON diagnosis_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diagnosis sessions" ON diagnosis_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create policies for medication_sessions table
CREATE POLICY "Users can view their own medication sessions" ON medication_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication sessions" ON medication_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication sessions" ON medication_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication sessions" ON medication_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
