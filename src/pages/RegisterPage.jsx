import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import Button from '../components/Button'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [gstin, setGstin] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await register({
        name,
        email,
        password,
        restaurantName,
        gstin: gstin.trim().toUpperCase().replace(/\s+/g, ''),
        address,
        phone,
      })
      navigate('/pricing', { replace: true })
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Registration failed')
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
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">Start with Chef's Bud today</p>
        {error && <p className="mb-3 text-sm text-[var(--primary)]">{error}</p>}
        <div className="space-y-3">
          <FormInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <FormInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FormInput
            label="Restaurant Name"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            required
          />
          <FormInput
            label="GSTIN"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            placeholder="22AAAAA0000A1Z5"
            required
          />
          <FormInput label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <FormInput label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Button className="mt-5 w-full" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Register'}
        </Button>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--primary)]">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
