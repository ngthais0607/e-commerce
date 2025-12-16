import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, Phone, ShieldCheck, UserIcon, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 animate-gradient">
      {/* Animated gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200/70 dark:bg-indigo-500/25 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-200/70 dark:bg-violet-500/25 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-fuchsia-200/60 dark:bg-fuchsia-500/15 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-rose-200/60 dark:bg-rose-400/10 rounded-full blur-3xl animate-float"></div>
        
        {/* Floating particles */}
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-gradient-to-r from-indigo-400/70 via-violet-400/70 to-fuchsia-400/70 dark:from-indigo-300/40 dark:via-violet-300/40 dark:to-fuchsia-300/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${4 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <Card className="w-full max-w-2xl relative z-10 shadow-2xl border border-indigo-200/60 dark:border-white/10 bg-white dark:bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-2xl transform transition-all duration-500 hover:scale-110 hover:rotate-6 glow-effect relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <ShieldCheck className="h-10 w-10 relative z-10 drop-shadow-lg" />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 via-fuchsia-600 to-rose-600 dark:from-indigo-300 dark:via-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent animate-shimmer">
              Create your account
            </CardTitle>
            <CardDescription className="text-base text-foreground/70 dark:text-white/70">
              One account for cart, orders and access to the admin dashboard (if approved).
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-14 bg-indigo-100/60 dark:bg-white/5 backdrop-blur-sm border border-indigo-300/60 dark:border-white/10 rounded-xl p-1">
              <TabsTrigger 
                value="email" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:via-violet-500 data-[state=active]:to-fuchsia-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-lg font-semibold text-foreground/70 dark:text-white/40"
              >
                Email sign up
              </TabsTrigger>
              <TabsTrigger value="social" disabled className="opacity-50 cursor-not-allowed text-muted-foreground dark:text-white/40">
                Social (coming soon)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="space-y-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Full name</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              placeholder="Jane Doe" 
                              {...field} 
                              className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                            />
                            <UserIcon className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
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
                        <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type="email" 
                              placeholder="you@example.com" 
                              {...field} 
                              className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                            />
                            <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
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
                        <FormLabel className="text-sm font-medium text-foreground">Phone number</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type="tel" 
                              placeholder="+84 987 654 321" 
                              {...field} 
                              className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                            />
                            <Phone className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          Optional. Helps us confirm COD orders faster.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input 
                              type="password" 
                              placeholder="••••••••" 
                              {...field} 
                              className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                            />
                            <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
                          </div>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground">
                          Must contain 6+ characters, upper & lowercase letters, a number and a symbol.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2 p-5 rounded-xl bg-indigo-100/60 dark:bg-white/5 backdrop-blur-sm border border-indigo-300/60 dark:border-white/10">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-foreground/70 dark:text-white/70 mb-3">
                      <span>Password strength</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-300">{strengthMeta.label}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${strengthMeta.className} shadow-lg relative overflow-hidden`}
                        style={{ width: `${((passwordScore + 1) / strengthSteps.length) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border-2 border-indigo-300 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-100 via-violet-100 to-fuchsia-100 dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-fuchsia-500/10 backdrop-blur-sm p-4 text-sm">
                    <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-300 flex-shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-foreground/70 dark:text-white/70">
                      We protect your data with encrypted storage & JWT-based sessions.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-bold bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 hover:from-indigo-600 hover:via-violet-600 hover:to-fuchsia-600 text-white shadow-2xl hover:shadow-indigo-500/50 transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-0.5 relative overflow-hidden group glow-effect" 
                    disabled={form.formState.isSubmitting}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin relative z-10" />
                        <span className="relative z-10">Creating account...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 relative z-10 animate-pulse" />
                        <span className="relative z-10">Create account</span>
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-indigo-300/60 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/90 dark:bg-card/80 backdrop-blur-sm px-2 text-foreground/70 dark:text-foreground font-medium">Already registered?</span>
                    </div>
                  </div>

                  <p className="text-center text-sm">
                    <span className="text-foreground/70 dark:text-white/90">Already have an account? </span>
                    <Link 
                      to="/login" 
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-violet-400 font-bold hover:underline transition-all duration-300 inline-flex items-center gap-1 group"
                    >
                      Log in
                      <span className="text-fuchsia-600 dark:text-fuchsia-400 group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                  </p>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="social">
              <div className="rounded-xl border-2 border-dashed border-indigo-400/60 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 dark:from-indigo-500/5 dark:via-violet-500/5 dark:to-fuchsia-500/5 backdrop-blur-sm p-8 text-center">
                <div className="space-y-3">
                  <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-200 via-violet-200 to-fuchsia-200 dark:from-indigo-500/20 dark:via-violet-500/20 dark:to-fuchsia-500/20 border border-indigo-400/60 dark:border-indigo-500/30">
                    <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80 dark:text-foreground">
                    Social sign in is on the roadmap
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For now, sign up via email and password to get started.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
