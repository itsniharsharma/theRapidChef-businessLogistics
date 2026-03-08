import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import FormInput from '../components/FormInput'
import Button from '../components/Button'
import { authService } from '../services/authService'

export default function RegisterPage() {
  const [step, setStep] = useState('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [gstin, setGstin] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const { initiateRegistration, verifyRegistration } = useAuth()
  const navigate = useNavigate()

  const onSubmitDetails = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      const response = await initiateRegistration({
        name,
        email,
        password,
        restaurantName,
        gstin: gstin.trim().toUpperCase().replace(/\s+/g, ''),
        address,
        phone,
      })
      setStep('verify')
      setInfo(response?.message || 'Verification code sent to your email')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const onVerifyCode = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      await verifyRegistration({
        email,
        code: verificationCode.trim(),
      })
      navigate('/plans', { replace: true })
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const onResendCode = async () => {
    setResendLoading(true)
    setError('')
    setInfo('')
    try {
      const response = await authService.resendRegistrationCode({ email })
      setInfo(response?.message || 'A new verification code has been sent')
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to resend code')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <form className="card w-full max-w-md p-6" onSubmit={step === 'details' ? onSubmitDetails : onVerifyCode}>
        <Link to="/" className="mb-4 inline-block text-sm font-semibold text-slate-600 hover:text-[var(--primary)]">
          ← Back to Landing
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{step === 'details' ? 'Create account' : 'Verify your email'}</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          {step === 'details'
            ? "Start with Chef's Bud today"
            : 'Enter the 6-digit code sent to your email before plan payment'}
        </p>
        {error && <p className="mb-3 text-sm text-[var(--primary)]">{error}</p>}
        {info && <p className="mb-3 text-sm text-emerald-700">{info}</p>}

        {step === 'details' ? (
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
        ) : (
          <div className="space-y-3">
            <FormInput label="Email" type="email" value={email} disabled required />
            <FormInput
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter 6-digit code"
              required
            />
            <button
              type="button"
              className="text-sm font-semibold text-slate-700 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onResendCode}
              disabled={resendLoading}
            >
              {resendLoading ? 'Resending code...' : 'Resend code'}
            </button>
          </div>
        )}

        <Button className="mt-5 w-full" type="submit" disabled={loading || (step === 'verify' && verificationCode.length < 6)}>
          {loading ? (step === 'details' ? 'Sending code...' : 'Verifying...') : step === 'details' ? 'Send verification code' : 'Verify and continue'}
        </Button>

        {step === 'verify' ? (
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-slate-600 hover:text-[var(--primary)]"
            onClick={() => {
              setStep('details')
              setVerificationCode('')
              setError('')
              setInfo('')
            }}
          >
            Edit registration details
          </button>
        ) : null}

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
