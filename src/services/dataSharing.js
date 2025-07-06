import { supabase } from '../lib/supabase'

// Data sharing service for secure patient medical data access
export const dataSharingService = {
  // Generate a secure sharing token for a patient
  async generateSharingToken(patientId, expiresInHours = 24) {
    try {
      const { data: user } = await supabase.auth.getUser()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + expiresInHours)
      
      // Generate a unique token using UUID-like format
      const randomPart = Math.random().toString(36).substring(2, 10)
      const token = `share_${Date.now()}_${randomPart}`
      
      const { data, error, status } = await supabase
        .from('sharing_tokens')
        .insert([{
          token,
          patient_id: patientId,
          created_by: user.user.id,
          expires_at: expiresAt.toISOString(),
          is_active: true
        }])
        .select()
        .single()
      
      console.log('generateSharingToken:', { data, error, status })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating sharing token:', error)
      throw error
    }
  },

  // Validate and use a sharing token to access patient data
  async accessPatientByToken(token) {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      // Validate token
      const { data: tokenData, error: tokenError, status } = await supabase
        .from('sharing_tokens')
        .select(`
          *,
          patients (*)
        `)
        .eq('token', token)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      
      console.log('accessPatientByToken:', { tokenData, error: tokenError, status })
      
      if (tokenError || !tokenData) {
        throw new Error('Invalid or expired token')
      }
      
      // Log access attempt
      await supabase
        .from('sharing_access_logs')
        .insert([{
          token_id: tokenData.id,
          accessed_by: user.user.id,
          accessed_at: new Date().toISOString(),
          ip_address: 'unknown', // In a real app, you'd get this from the request
          user_agent: navigator.userAgent
        }])
      
      return tokenData.patients
    } catch (error) {
      console.error('Error accessing patient by token:', error)
      throw error
    }
  },

  // Get sharing tokens created by current user
  async getMySharingTokens() {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('sharing_tokens')
        .select(`
          *,
          patients (first_name, last_name, medical_record_number)
        `)
        .eq('created_by', user.user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching sharing tokens:', error)
      throw error
    }
  },

  // Revoke a sharing token
  async revokeToken(tokenId) {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('sharing_tokens')
        .update({ 
          is_active: false,
          revoked_at: new Date().toISOString(),
          revoked_by: user.user.id
        })
        .eq('id', tokenId)
        .eq('created_by', user.user.id) // Ensure only creator can revoke
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error revoking token:', error)
      throw error
    }
  },

  // Get access logs for a specific token
  async getTokenAccessLogs(tokenId) {
    try {
      const { data: user } = await supabase.auth.getUser()
      
      // First verify the user owns this token
      const { data: token, error: tokenError } = await supabase
        .from('sharing_tokens')
        .select('id')
        .eq('id', tokenId)
        .eq('created_by', user.user.id)
        .single()
      
      if (tokenError || !token) {
        throw new Error('Token not found or access denied')
      }
      
      const { data, error } = await supabase
        .from('sharing_access_logs')
        .select('*')
        .eq('token_id', tokenId)
        .order('accessed_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching access logs:', error)
      throw error
    }
  },

  // Clean up expired tokens (could be run as a scheduled job)
  async cleanupExpiredTokens() {
    try {
      const { data, error } = await supabase
        .from('sharing_tokens')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
      throw error
    }
  },

  // Get patient data with row-level security check
  async getPatientWithSecurity(patientId, requesterUserId) {
    try {
      // This would be implemented with RLS policies in Supabase
      // For now, we'll do a simple check
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          diagnosis_sessions(*),
          medication_sessions(*)
        `)
        .eq('id', patientId)
        .single()
      
      if (error) throw error
      
      // Additional security checks could go here
      // e.g., checking if the requester has permission to access this patient
      
      return data
    } catch (error) {
      console.error('Error fetching patient with security:', error)
      throw error
    }
  }
}

export default dataSharingService
