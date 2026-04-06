import { useState } from 'preact/hooks'
import { User, X, AlertCircle, Mail, Lock, LogOut } from 'lucide-preact'

export default function AuthPanel({ user, onSignIn, onSignUp, onSignOut, onResetPassword, onClose }) {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    try {
      if (mode === 'reset') {
        const { error } = await onResetPassword(email)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email for a password reset link.')
        }
      } else if (mode === 'signup') {
        const { error } = await onSignUp(email, password)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Check your email to confirm your account.')
        }
      } else {
        const { error } = await onSignIn(email, password)
        if (error) {
          setError(error.message)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(newMode) {
    setMode(newMode)
    setError(null)
    setMessage(null)
  }

  if (user) {
    return (
      <div className="sync-panel">
        <div className="sync-panel-header">
          <User size={18} />
          <span>Account</span>
          <button className="detail-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
            <X size={16} />
          </button>
        </div>
        <div className="sync-panel-body">
          <div className="sync-status-row">
            <div className="sync-status-dot connected" />
            <span>Signed in</span>
          </div>
          <div className="sync-field">
            <label>Email</label>
            <div className="sync-value">{user.email}</div>
          </div>
          <button className="sync-btn-danger" onClick={onSignOut} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="sync-panel">
      <div className="sync-panel-header">
        <User size={18} />
        <span>{mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</span>
        <button className="detail-close" onClick={onClose} style={{ marginLeft: 'auto' }}>
          <X size={16} />
        </button>
      </div>
      <div className="sync-panel-body">
        <p className="sync-description">
          {mode === 'reset'
            ? 'Enter your email to receive a password reset link.'
            : 'Sign in to sync your tasks across devices.'}
        </p>

        {error && (
          <div className="sync-error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {message && (
          <div className="auth-success">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="sync-field">
            <label><Mail size={13} style={{ verticalAlign: -2 }} /> Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div className="sync-field">
              <label><Lock size={13} style={{ verticalAlign: -2 }} /> Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? 'Choose a password' : 'Your password'}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          )}

          <button
            type="submit"
            className="sync-btn-primary"
            disabled={submitting}
          >
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-links">
          {mode === 'signin' && (
            <>
              <button className="auth-link" onClick={() => switchMode('signup')}>
                Create an account
              </button>
              <button className="auth-link" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <button className="auth-link" onClick={() => switchMode('signin')}>
              Already have an account? Sign in
            </button>
          )}
          {mode === 'reset' && (
            <button className="auth-link" onClick={() => switchMode('signin')}>
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
