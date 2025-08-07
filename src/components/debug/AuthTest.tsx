import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

export const AuthTest: React.FC = () => {
  const { user, profile, session, loading } = useAuth()
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [schemaTest, setSchemaTest] = useState<any>(null)

  useEffect(() => {
    testConnection()
    testSchema()
  }, [])

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getUser()
      setConnectionTest({ 
        success: !error, 
        data: data.user ? 'User found' : 'No user', 
        error: error?.message 
      })
    } catch (err: any) {
      setConnectionTest({ 
        success: false, 
        error: err.message 
      })
    }
  }

  const testSchema = async () => {
    try {
      const { data, error } = await supabase
        .schema('bloodbank')
        .from('users')
        .select('count')
        .limit(1)
      
      setSchemaTest({ 
        success: !error, 
        data: data ? 'Schema accessible' : 'No data', 
        error: error?.message 
      })
    } catch (err: any) {
      setSchemaTest({ 
        success: false, 
        error: err.message 
      })
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456'
      })
      
      if (error) throw error
      
      console.log('Test signup successful:', data)
      alert('Test signup successful! Check console for details.')
    } catch (err: any) {
      console.error('Test signup failed:', err)
      alert(`Test signup failed: ${err.message}`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Supabase Auth Debug Panel</h1>
      
      {/* Environment Variables */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Environment Variables</h2>
        <div className="space-y-2 text-sm">
          <div>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</div>
          <div>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}</div>
        </div>
      </Card>

      {/* Connection Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Connection Test</h2>
        <div className="space-y-2">
          <div>Status: {connectionTest?.success ? '✅ Connected' : '❌ Failed'}</div>
          <div>Data: {connectionTest?.data}</div>
          {connectionTest?.error && <div className="text-red-600">Error: {connectionTest.error}</div>}
        </div>
        <Button onClick={testConnection} className="mt-2" size="sm">Retest Connection</Button>
      </Card>

      {/* Schema Test */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Schema Test</h2>
        <div className="space-y-2">
          <div>Status: {schemaTest?.success ? '✅ Schema accessible' : '❌ Schema failed'}</div>
          <div>Data: {schemaTest?.data}</div>
          {schemaTest?.error && <div className="text-red-600">Error: {schemaTest.error}</div>}
        </div>
        <Button onClick={testSchema} className="mt-2" size="sm">Retest Schema</Button>
      </Card>

      {/* Auth Context State */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Auth Context State</h2>
        <div className="space-y-2 text-sm">
          <div>Loading: {loading ? 'Yes' : 'No'}</div>
          <div>User: {user ? `${user.email} (${user.id})` : 'None'}</div>
          <div>Profile: {profile ? `${profile.name} (${profile.role})` : 'None'}</div>
          <div>Session: {session ? 'Active' : 'None'}</div>
        </div>
      </Card>

      {/* Test Actions */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Test Actions</h2>
        <div className="space-x-2">
          <Button onClick={testSignUp} size="sm">Test Signup</Button>
        </div>
      </Card>

      {/* Raw Data */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Raw Auth Data</h2>
        <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
          {JSON.stringify({ user, profile, session }, null, 2)}
        </pre>
      </Card>
    </div>
  )
}