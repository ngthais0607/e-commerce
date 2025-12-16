import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, Mail, Shield, Sparkles } from 'lucide-react'

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
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'Login failed'
      form.setError('root', { message })
      console.error('Login error:', error)
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
        {[...Array(20)].map((_, i) => (
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

      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-indigo-200/60 dark:border-white/10 bg-white dark:bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-2xl transform transition-all duration-500 hover:scale-110 hover:rotate-6 glow-effect relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <Shield className="h-10 w-10 relative z-10 drop-shadow-lg" />
          </div>
          <div className="space-y-3">
            <CardTitle className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 via-fuchsia-600 to-rose-600 dark:from-indigo-300 dark:via-violet-300 dark:via-fuchsia-300 dark:to-rose-300 bg-clip-text text-transparent animate-shimmer">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base text-foreground/70 dark:text-white/70">
              Sign in to track orders and access exclusive deals.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          {serverError && (
            <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-2">
              <AlertTitle>Unable to sign in</AlertTitle>
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                  Forgot password?{' '}
                  <span className="text-indigo-600 dark:text-indigo-300 hover:text-violet-600 dark:hover:text-violet-300 hover:underline cursor-pointer transition-colors font-medium">Contact support</span>
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
                    <span className="relative z-10">Logging in...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 relative z-10 animate-pulse" />
                    <span className="relative z-10">Login</span>
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-indigo-300/60 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/90 dark:bg-card/80 backdrop-blur-sm px-2 text-foreground/70 dark:text-foreground font-medium">New here?</span>
            </div>
          </div>

          <p className="text-center text-sm">
            <span className="text-foreground/70 dark:text-white/90">Don&apos;t have an account? </span>
            <Link 
              to="/register" 
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-violet-400 font-bold hover:underline transition-all duration-300 inline-flex items-center gap-1 group"
            >
              Sign up
              <span className="text-fuchsia-600 dark:text-fuchsia-400 group-hover:translate-x-1 transition-transform inline-block">→</span>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
