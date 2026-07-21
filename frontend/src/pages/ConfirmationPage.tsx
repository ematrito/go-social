import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '../api'

export function ConfirmationPage() {
  const { token = '' } = useParams()
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  
  async function handleActivate() {
    if (!token) {
      setStatus('error')
      setMessage('No activation token provided.')
      return
    }
    
    setStatus('loading')
    try {
      await api.activateUser(token)
      setStatus('success')
      setMessage('Account activated! You can now log in.')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Activation failed.')
    }
  }



  if (!token) {
    return (
      <div className="form-page">
        <h1>Account Activation</h1>
        <p className="error-msg">No activation token provided.</p>
      </div>
    )
  }
  return (
    <div className="form-page">
      <h1>Account Activation</h1>

      {status === 'idle' && (
        <form onSubmit={(e) => { e.preventDefault(); handleActivate() }}>
          <button type="submit">Activate Account</button>
        </form>
      )}

      {status === 'loading' && <p>Activating your account...</p>}

      {status === 'success' && (
        <>
          <p className="success-msg">{message}</p>
          <Link to="/login">Go to Login</Link>
        </>
      )}

      {status === 'error' && (
        <>
          <p className="error-msg">{message}</p>
          <form onSubmit={(e) => { e.preventDefault(); handleActivate() }}>
            <button type="submit">Try Again</button>
          </form>
        </>
      )}
    </div>
  )

  }
