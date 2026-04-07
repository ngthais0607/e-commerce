import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, ShieldCheck, Lock, ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react'
import api from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ─── Schemas ─────────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})

const passwordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type EmailValues = z.infer<typeof emailSchema>
type PasswordValues = z.infer<typeof passwordSchema>

type Step = 'email' | 'otp' | 'password' | 'done'

// ─── OTP Input Component ──────────────────────────────────────────────────────

function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  const update = (index: number, char: string) => {
    const arr = [...digits]
    arr[index] = char
    onChange(arr.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        update(index, '')
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus()
        update(index - 1, '')
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) return
    // Handle paste of multiple digits
    if (raw.length > 1) {
      const pasted = raw.slice(0, 6)
      onChange(pasted.padEnd(6, ' ').slice(0, 6).trimEnd())
      inputRefs.current[Math.min(pasted.length, 5)]?.focus()
      return
    }
    update(index, raw[0])
    if (index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const raw = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (raw) {
      onChange(raw)
      inputRefs.current[Math.min(raw.length, 5)]?.focus()
    }
  }

  return (
    <div className="flex gap-2 sm:gap-3 justify-center">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleInput(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={[
            'w-11 h-14 sm:w-12 sm:h-14 rounded-xl border-2 text-center text-xl font-bold transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500',
            'bg-white dark:bg-white/10 text-slate-900 dark:text-white',
            digit
              ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/20'
              : 'border-border dark:border-white/20',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [resendCooldown])

  // ── Step 1: Email form ────────────────────────────────────────────────────
  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })

  const onEmailSubmit = async (values: EmailValues) => {
    emailForm.clearErrors('root')
    try {
      await api.post('/auth/forgot-password', { email: values.email })
      setEmail(values.email)
      setStep('otp')
      setResendCooldown(60)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      emailForm.setError('root', {
        message: e?.response?.data?.error || e?.message || 'Failed to send OTP',
      })
    }
  }

  // ── Step 2: OTP verification ──────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter all 6 digits')
      return
    }
    setOtpError('')
    setIsVerifying(true)
    try {
      const res = await api.post('/auth/verify-otp', { email, otp })
      setResetToken(res.data.resetToken)
      setStep('password')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      setOtpError(e?.response?.data?.error || 'Invalid OTP. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return
    setIsResending(true)
    setOtpError('')
    setOtp('')
    try {
      await api.post('/auth/forgot-password', { email })
      setResendCooldown(60)
    } catch {
      setOtpError('Failed to resend OTP. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  // ── Step 3: New password form ─────────────────────────────────────────────
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onPasswordSubmit = async (values: PasswordValues) => {
    passwordForm.clearErrors('root')
    try {
      await api.post('/auth/reset-password', { resetToken, password: values.password })
      setStep('done')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string }
      passwordForm.setError('root', {
        message: e?.response?.data?.error || 'Failed to reset password. Please try again.',
      })
    }
  }

  // ─── Shared layout wrapper ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 dark:from-sky-950 dark:via-sky-900 dark:to-sky-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-200/70 dark:bg-sky-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-100/80 dark:bg-sky-700/30 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-sky-100/80 dark:border-sky-900/60 bg-white/95 dark:bg-card/95 backdrop-blur-xl overflow-hidden">
        <div className="px-6 sm:px-10 py-8 sm:py-10">

          {/* ── Step: Email ──────────────────────────────────────── */}
          {step === 'email' && (
            <>
              <CardHeader className="px-0 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
                    <Lock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Forgot your password?
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Enter your registered email and we&apos;ll send you a one-time code.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0 pb-0 space-y-5">
                {emailForm.formState.errors.root && (
                  <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{emailForm.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-sky-400 dark:focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                                {...field}
                              />
                              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-sky-500 transition-colors" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/50 transition-all duration-300 rounded-full"
                      disabled={emailForm.formState.isSubmitting}
                    >
                      {emailForm.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending OTP...</>
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Remember your password?{' '}
                  <Link to="/login" className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </>
          )}

          {/* ── Step: OTP ────────────────────────────────────────── */}
          {step === 'otp' && (
            <>
              <CardHeader className="px-0 pb-6">
                <button
                  onClick={() => { setStep('email'); setOtp(''); setOtpError('') }}
                  className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors mb-3 -ml-0.5"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
                    <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Enter verification code
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                  We sent a 6-digit code to{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0 pb-0 space-y-6">
                {otpError && (
                  <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}

                <OtpInput value={otp} onChange={setOtp} disabled={isVerifying} />

                <Button
                  onClick={handleVerifyOtp}
                  className="w-full h-12 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/50 transition-all duration-300 rounded-full"
                  disabled={isVerifying || otp.length !== 6}
                >
                  {isVerifying ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Didn&apos;t receive the code?
                  </p>
                  <button
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : isResending ? 'Sending...' : 'Resend OTP'}
                  </button>
                </div>
              </CardContent>
            </>
          )}

          {/* ── Step: New Password ───────────────────────────────── */}
          {step === 'password' && (
            <>
              <CardHeader className="px-0 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/50">
                    <Lock className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Set new password
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Choose a strong password for your account.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-0 pb-0 space-y-5">
                {passwordForm.formState.errors.root && (
                  <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{passwordForm.formState.errors.root.message}</AlertDescription>
                  </Alert>
                )}

                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium text-foreground">New password</FormLabel>
                            <span className={`text-xs tabular-nums ${(field.value?.length ?? 0) >= 6 ? 'text-green-500' : 'text-muted-foreground'}`}>
                              {field.value?.length ?? 0} / 6+ chars
                            </span>
                          </div>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-sky-400 dark:focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                                {...field}
                              />
                              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-sky-500 transition-colors" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-foreground">Confirm password</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Input
                                type="password"
                                autoComplete="new-password"
                                placeholder="••••••••"
                                className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-sky-400 dark:focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                                {...field}
                              />
                              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-sky-500 transition-colors" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-1">
                      <li>• At least 6 characters</li>
                      <li>• At least one uppercase letter</li>
                      <li>• At least one number</li>
                    </ul>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/50 transition-all duration-300 rounded-full"
                      disabled={passwordForm.formState.isSubmitting}
                    >
                      {passwordForm.formState.isSubmitting ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </>
          )}

          {/* ── Step: Done ───────────────────────────────────────── */}
          {step === 'done' && (
            <>
              <CardHeader className="px-0 pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/50">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Password reset!
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Your password has been updated successfully. You can now sign in.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full h-12 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/50 transition-all duration-300 rounded-full"
                >
                  Go to Sign In
                </Button>
              </CardContent>
            </>
          )}

        </div>
      </Card>
    </div>
  )
}
