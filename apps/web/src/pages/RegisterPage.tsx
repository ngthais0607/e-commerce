import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, Phone, ShieldCheck, UserIcon } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character'),
})

type RegisterValues = z.infer<typeof registerSchema>

const strengthSteps = [
  { label: 'Weak', minScore: 0, className: 'bg-red-500' },
  { label: 'Fair', minScore: 1, className: 'bg-orange-500' },
  { label: 'Good', minScore: 3, className: 'bg-yellow-500' },
  { label: 'Strong', minScore: 4, className: 'bg-emerald-500' },
]

const getPasswordScore = (password: string) => {
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return Math.min(score, strengthSteps.length - 1)
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuthStore()
  const [serverError, setServerError] = useState('')
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  })

  const passwordValue = form.watch('password')
  const passwordScore = useMemo(() => getPasswordScore(passwordValue), [passwordValue])
  const strengthMeta = strengthSteps[passwordScore] ?? strengthSteps[0]

  const onSubmit = async (values: RegisterValues) => {
    setServerError('')
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('auth-storage')
      await registerUser(values.email, values.password, values.name, values.phone)
      navigate('/')
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || 'Registration failed'
      setServerError(message)
      console.error('Registration error:', err)
    }
  }

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-semibold tracking-tight">Create your account</CardTitle>
          <CardDescription className="text-base">
            One account for cart, wishlist, orders and access to the admin dashboard (if approved).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {serverError && (
            <Alert variant="destructive">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email sign up</TabsTrigger>
              <TabsTrigger value="social" disabled>
                Social (coming soon)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="Jane Doe" {...field} className="pl-10" />
                            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="email" placeholder="you@example.com" {...field} className="pl-10" />
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="tel" placeholder="+84 987 654 321" {...field} className="pl-10" />
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>Optional. Helps us confirm COD orders faster.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type="password" placeholder="••••••••" {...field} className="pl-10" />
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Must contain 6+ characters, upper & lowercase letters, a number and a symbol.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                      <span>Password strength</span>
                      <span className="font-semibold text-foreground">{strengthMeta.label}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${strengthMeta.className}`}
                        style={{ width: `${((passwordScore + 1) / strengthSteps.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-md border p-3 text-sm text-muted-foreground">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    We protect your data with encrypted storage & JWT-based sessions.
                  </div>

                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                      Log in
                    </Link>
                  </p>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="social">
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Social sign in is on the roadmap. For now, sign up via email and password.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
