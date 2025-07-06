/**
 * Mock Database Service - Fallback for when Supabase is not available
 * Uses localStorage to simulate database operations
 */

// Generate UUID-like IDs
const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Get current timestamp
const now = () => new Date().toISOString()

// Storage keys
const STORAGE_KEYS = {
  profiles: 'mock_profiles',
  medications: 'mock_medications',
  medical_history: 'mock_medical_history',
  patient_doctor_connections: 'mock_patient_doctor_connections',
  analysis_results: 'mock_analysis_results'
}

// Helper functions for localStorage operations
const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error)
    return []
  }
}

const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error)
    return false
  }
}

// Mock Supabase client
export const mockSupabase = {
  from: (table) => {
    return {
      // SELECT operations
      select: (columns = '*') => {
        const queryBuilder = {
          _filters: [],
          _order: null,
          _single: false,

          eq: function(column, value) {
            this._filters.push({ type: 'eq', column, value })
            return this
          },

          gte: function(column, value) {
            this._filters.push({ type: 'gte', column, value })
            return this
          },

          order: function(column, options = {}) {
            this._order = { column, options }
            return this
          },

          single: function() {
            this._single = true
            return this
          },

          then: function(callback) {
            return this._execute().then(callback)
          },

          _execute: function() {
            let data = getFromStorage(STORAGE_KEYS[table])

            // Apply filters
            this._filters.forEach(filter => {
              if (filter.type === 'eq') {
                data = data.filter(item => item[filter.column] === filter.value)
              } else if (filter.type === 'gte') {
                data = data.filter(item => new Date(item[filter.column]) >= new Date(filter.value))
              }
            })

            // Apply ordering
            if (this._order) {
              data = data.sort((a, b) => {
                const aVal = a[this._order.column]
                const bVal = b[this._order.column]

                if (this._order.options.ascending === false) {
                  return new Date(bVal) - new Date(aVal)
                }
                return new Date(aVal) - new Date(bVal)
              })
            }

            // Return single or array
            if (this._single) {
              const result = data[0] || null
              return Promise.resolve({
                data: result,
                error: result ? null : { message: 'No rows found' }
              })
            }

            return Promise.resolve({
              data: data,
              error: null
            })
          }
        }

        return queryBuilder
      },

      // INSERT operations
      insert: (records) => {
        return {
          select: () => {
            return {
              single: () => {
                const data = getFromStorage(STORAGE_KEYS[table])
                const recordsArray = Array.isArray(records) ? records : [records]
                
                const newRecords = recordsArray.map(record => ({
                  id: generateId(),
                  ...record,
                  created_at: now(),
                  updated_at: now()
                }))

                data.push(...newRecords)
                saveToStorage(STORAGE_KEYS[table], data)

                return Promise.resolve({
                  data: newRecords.length === 1 ? newRecords[0] : newRecords,
                  error: null
                })
              },
              then: (callback) => {
                const data = getFromStorage(STORAGE_KEYS[table])
                const recordsArray = Array.isArray(records) ? records : [records]
                
                const newRecords = recordsArray.map(record => ({
                  id: generateId(),
                  ...record,
                  created_at: now(),
                  updated_at: now()
                }))

                data.push(...newRecords)
                saveToStorage(STORAGE_KEYS[table], data)

                return callback({
                  data: newRecords,
                  error: null
                })
              }
            }
          },
          then: (callback) => {
            const data = getFromStorage(STORAGE_KEYS[table])
            const recordsArray = Array.isArray(records) ? records : [records]
            
            const newRecords = recordsArray.map(record => ({
              id: generateId(),
              ...record,
              created_at: now(),
              updated_at: now()
            }))

            data.push(...newRecords)
            saveToStorage(STORAGE_KEYS[table], data)

            return callback({
              data: newRecords,
              error: null
            })
          }
        }
      },

      // UPDATE operations
      update: (updates) => {
        const updateBuilder = {
          _filters: [],

          eq: function(column, value) {
            this._filters.push({ type: 'eq', column, value })
            return this
          },

          select: function() {
            return {
              single: () => {
                const data = getFromStorage(STORAGE_KEYS[table])
                let targetIndex = -1

                // Find item matching all filters
                for (let i = 0; i < data.length; i++) {
                  const item = data[i]
                  const matches = this._filters.every(filter => {
                    if (filter.type === 'eq') {
                      return item[filter.column] === filter.value
                    }
                    return false
                  })

                  if (matches) {
                    targetIndex = i
                    break
                  }
                }

                if (targetIndex !== -1) {
                  data[targetIndex] = {
                    ...data[targetIndex],
                    ...updates,
                    updated_at: now()
                  }
                  saveToStorage(STORAGE_KEYS[table], data)

                  return Promise.resolve({
                    data: data[targetIndex],
                    error: null
                  })
                }

                return Promise.resolve({
                  data: null,
                  error: { message: 'No rows found to update' }
                })
              }
            }
          }
        }

        return updateBuilder
      },

      // DELETE operations
      delete: () => {
        const deleteBuilder = {
          _filters: [],

          eq: function(column, value) {
            this._filters.push({ type: 'eq', column, value })
            return this
          },

          then: function(callback) {
            const data = getFromStorage(STORAGE_KEYS[table])

            // Filter out items that match all conditions
            const filteredData = data.filter(item => {
              return !this._filters.every(filter => {
                if (filter.type === 'eq') {
                  return item[filter.column] === filter.value
                }
                return false
              })
            })

            saveToStorage(STORAGE_KEYS[table], filteredData)

            return callback({
              data: null,
              error: null
            })
          }
        }

        return deleteBuilder
      }
    }
  }
}

// Initialize mock data if not exists
export const initializeMockData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify([]))
    }
  })
  
  console.log('🔧 Mock database initialized - using localStorage fallback')
}

// Clear all mock data
export const clearMockData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
  console.log('🗑️ Mock database cleared')
}

// Check if we should use mock database
export const shouldUseMockDatabase = async () => {
  try {
    // Try to ping the real Supabase instance
    const response = await fetch('http://127.0.0.1:54321/rest/v1/', {
      method: 'HEAD',
      timeout: 1000
    })
    return !response.ok
  } catch (error) {
    // If we can't reach Supabase, use mock
    return true
  }
}
