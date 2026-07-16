import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../api'

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.register(username, email, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="form-page">
        <h1>Check your email</h1>
        <p>We sent an activation link to <strong>{email}</strong>.</p>
        <p>Click the link to activate your account, then <Link to="/login">log in</Link>.</p>
      </div>
    )
  }

  return (
    <div className="form-page">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-msg">{error}</div>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 3 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={3}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
