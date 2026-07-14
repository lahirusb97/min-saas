import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [contactNumber, setContactNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ contactNumber, password })
      navigate('/dashboard')
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null
      setError(message ?? 'Unable to register. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4 sm:p-8">
      <img
        src="/eye-clinic.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-black/55" />

      <Card className="relative z-10 w-full max-w-[380px] gap-0 rounded-2xl border-white/30 bg-white/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Eye className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">Eyevixa</span>
        </div>

        <div className="mb-6 space-y-1 text-center">
          <p className="text-xl font-semibold tracking-tight text-foreground">Create your account</p>
          <p className="text-sm text-muted-foreground">
            Set up your optical shop workspace.
          </p>
        </div>

        <CardContent className="p-0">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="contactNumber">Contact number</Label>
              <Input
                id="contactNumber"
                type="tel"
                autoComplete="tel"
                autoFocus
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register
