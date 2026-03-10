import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import Button from '../components/Button'

function toTimestamp(value) {
  const ts = value ? new Date(value).getTime() : NaN
  return Number.isFinite(ts) ? ts : 0
}

function hasBillingAccess(billing) {
  if (!billing) {
    return false
  }

  if (billing.status === 'active') {
    return true
  }

  const now = Date.now()
  const graceWindowEnds = Math.max(toTimestamp(billing.graceEndsAt), toTimestamp(billing.currentPeriodEnd))
  return ['grace_period', 'past_due'].includes(billing.status) && graceWindowEnds > now
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({ email, password })
      if (!hasBillingAccess(result?.user?.billing)) {
        navigate('/plans', { replace: true })
        return
      }

      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form className="card w-full max-w-md p-6" onSubmit={onSubmit}>
        <Link to="/" className="mb-4 inline-block text-sm font-semibold text-slate-600 hover:text-[var(--primary)]">
          ← Back to Landing
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Login to Chef's Bud</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Restaurant Revenue OS for owners</p>
        {error && <p className="mb-3 text-sm text-[var(--primary)]">{error}</p>}
        <div className="space-y-3">
          <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button className="mt-5 w-full" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </Button>
        <p className="mt-4 text-sm text-slate-600">
          New here?{' '}
          <Link to="/register" className="font-semibold text-[var(--primary)]">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  )
}