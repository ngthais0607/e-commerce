import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, Headphones } from 'lucide-react'

import { useAuthStore } from '@/store/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const serverError = form.formState.errors.root?.message

  const onSubmit = async (values: LoginValues) => {
    form.clearErrors('root')
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('auth-storage')
      await login(values.email, values.password)
      navigate('/')
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      const message = err?.response?.data?.error || err?.message || 'Login failed'
      form.setError('root', { message })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 md:py-20 relative overflow-hidden bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200 dark:from-sky-950 dark:via-sky-900 dark:to-sky-950 animate-gradient">
      {/* Animated pastel green background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-sky-200/70 dark:bg-sky-500/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-sky-100/80 dark:bg-sky-700/30 rounded-full blur-3xl animate-float-delayed"></div>
      </div>

      <Card className="w-full max-w-5xl relative z-10 shadow-2xl border border-sky-100/80 dark:border-sky-900/60 bg-white/95 dark:bg-card/95 backdrop-blur-xl overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: form */}
          <div className="px-6 sm:px-10 py-8 sm:py-10 flex flex-col">
            <CardHeader className="space-y-4 text-left pb-6 px-0">
              <div className="space-y-3">
                <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                  Sign in to your account
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                  Track your orders, save your wishlist and unlock member-only deals.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
              <AlertTitle>Unable to sign in</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-label="Login form">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Input 
                          type="email" 
                          autoComplete="email"
                          placeholder="you@example.com" 
                          className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                          {...field} 
                        />
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
                      </div>
                    </FormControl>
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
                          autoComplete="current-password"
                          placeholder="••••••••" 
                          className="pl-11 h-14 border-2 border-border dark:border-white/20 bg-background/50 dark:bg-white/10 backdrop-blur-sm transition-all duration-300 focus:border-indigo-400 dark:focus:border-indigo-400/60 focus:bg-background dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/30 group-hover:border-violet-400/40 dark:group-hover:border-violet-400/40 group-hover:bg-background/80 dark:group-hover:bg-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60" 
                          {...field} 
                        />
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground dark:text-white/60 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-300 transition-all duration-300 group-focus-within:scale-110" />
                        <div className="absolute inset-0 rounded-md bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/0 group-focus-within:from-indigo-500/15 group-focus-within:via-violet-500/15 group-focus-within:to-fuchsia-500/15 transition-all duration-500 pointer-events-none opacity-0 group-focus-within:opacity-100"></div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-end text-sm">
                <p className="text-foreground/80 dark:text-white/70">
                  <Link
                    to="/forgot-password"
                    className="text-teal-600 dark:text-teal-300 hover:text-sky-600 dark:hover:text-sky-300 hover:underline transition-colors font-medium"
                  >
                    Forgot password?
                  </Link>
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 md:h-13 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg hover:shadow-sky-400/70 transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-0.5 rounded-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </Button>
            </form>
          </Form>

          {/* Sign up hint removed to avoid duplicate Sign Up buttons */}
            </CardContent>
          </div>

          {/* Right: product highlight panel with pastel blue background */}
          <div className="relative hidden md:block bg-gradient-to-br from-sky-50 via-sky-100 to-sky-200">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8)_0,transparent_55%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.25)_0,transparent_60%)]" />
            <div className="relative h-full w-full flex flex-col justify-center p-10 gap-10 text-slate-900">
              <div className="max-w-md">
                <p className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur-sm text-sky-700">
                  Modern shopping experience
                </p>
                <h2 className="mt-4 text-3xl md:text-4xl font-semibold leading-snug text-slate-900">
                  Your account is the <br /> center of every order.
                </h2>
                <p className="mt-3 text-sm text-slate-700">
                  Save shipping details, view your purchase history and receive promotions instantly.
                </p>
              </div>
              {/* product card with pastel styling */}
              <div className="mt-4 self-start rounded-3xl bg-white text-slate-900 backdrop-blur-md p-4 border border-sky-100 shadow-xl max-w-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
                  Featured product
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-sky-400 to-sky-300 shadow-md text-white">
                      <Headphones className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">Stay Pro Wireless Headphones</p>
                      <p className="text-xs text-slate-600">
                        Immersive sound, active noise cancelling and all-day comfort.
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center justify-center rounded-full bg-sky-500 text-white px-3 py-1 text-xs font-semibold shadow-sm whitespace-nowrap">
                    New arrival
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
