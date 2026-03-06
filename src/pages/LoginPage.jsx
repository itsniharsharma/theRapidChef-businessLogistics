import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import Button from '../components/Button'

export default function LoginPage() {
  const [email, setEmail] = useState('owner@chefsbud.com')
  const [password, setPassword] = useState('password123')
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
      await login({ email, password })
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
          No account?{' '}
          <Link to="/register" className="font-semibold text-[var(--primary)]">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}
