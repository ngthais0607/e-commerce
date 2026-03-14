import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, MessageSquare, Phone, MapPin } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

const contactSchema = z.object({
  name: z.string().min(2, 'Please tell us your name'),
  email: z.string().email('Enter a valid email'),
  subject: z.string().min(3, 'Subject too short'),
  message: z.string().min(10, 'Message must contain at least 10 characters'),
})

type ContactValues = z.infer<typeof contactSchema>

const contactChannels = [
  {
    title: 'Live chat',
    description: 'Average response time under 5 minutes during business hours.',
    icon: MessageSquare,
    action: 'Start chat',
  },
  {
    title: 'Email support',
    description: 'Send us details and we will follow up within 24 hours.',
    icon: Mail,
    action: 'support@ecommerce.dev',
  },
  {
    title: 'Phone',
    description: 'Mon – Fri, 8am – 6pm GMT+7',
    icon: Phone,
    action: '+84 1900 636 999',
  },
]

export default function ContactPage() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  const onSubmit = (values: ContactValues) => {
    console.table(values)
    form.reset()
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <p className="text-sm uppercase tracking-widest text-primary">Customer service</p>
        <h1 className="text-4xl font-semibold tracking-tight">We are here to help 24/7</h1>
        <p className="text-muted-foreground">
          Reach out via chat, email, or phone. Our support specialists usually respond in less than a day.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {contactChannels.map((channel) => (
          <Card key={channel.title} className="h-full">
            <CardHeader className="space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <channel.icon className="h-5 w-5" />
              </div>
              <CardTitle>{channel.title}</CardTitle>
              <CardDescription>{channel.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="ghost" className="px-0 text-primary">
                {channel.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Complete the form and we will respond within 12–24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Doe" {...field} />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Order #12345 - shipping status" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="How can we help you?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full sm:w-auto" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Sending...' : 'Send message'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle>Visit our showroom</CardTitle>
            <CardDescription>Experience products in person. Walk-ins welcome.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="mt-1 h-5 w-5 text-primary" />
              <p>
                123 Commerce Street
                <br />
                District 1, Ho Chi Minh City
              </p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Mon – Fri: 8:00 – 20:00</p>
              <p>Sat – Sun: 9:00 – 18:00</p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-background">
              <iframe
                title="Showroom location map"
                className="h-56 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.openstreetmap.org/export/embed.html?bbox=106.695%2C10.770%2C106.705%2C10.780&layer=mapnik&marker=10.775%2C106.700"
              />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                window.open(
                  'https://www.google.com/maps/search/?api=1&query=123%20Commerce%20Street%2C%20District%201%2C%20Ho%20Chi%20Minh%20City',
                  '_blank',
                  'noreferrer'
                )
              }
            >
              Open in Google Maps
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

