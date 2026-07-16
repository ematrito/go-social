import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as api from '../api'

export function ConfirmationPage() {
  const { token = '' } = useParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No activation token provided.')
      return
    }

    let cancelled = false

    async function activate() {
      try {
        await api.activateUser(token)
        if (!cancelled) {
          setStatus('success')
          setMessage('Account activated! You can now log in.')
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error')
          setMessage(err instanceof Error ? err.message : 'Activation failed.')
        }
      }
    }

    activate()
    return () => { cancelled = true }
  }, [token])

  return (
    <div className="form-page">
      <h1>Account Activation</h1>

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
          <button onClick={() => { setStatus('loading'); window.location.reload() }}>
            Try Again
          </button>
        </>
      )}
    </div>
  )
}
