import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const clauses = [
  {
    title: '1. Acceptance of terms',
    body: 'By using our website, creating an account, or placing an order you agree to these Terms of Service and to comply with all applicable laws.',
  },
  {
    title: '2. Orders & payments',
    body: 'All orders are subject to acceptance. We reserve the right to cancel suspicious or fraudulent transactions. Prices are shown in USD unless stated otherwise.',
  },
  {
    title: '3. Shipping & returns',
    body: 'Delivery timelines depend on the shipping method selected. You may request a return within 30 days of delivery provided the product is unused and in original packaging.',
  },
  {
    title: '4. User accounts',
    body: 'You are responsible for keeping your login credentials confidential. Inform us immediately of any unauthorized access or security breach.',
  },
  {
    title: '5. Limitation of liability',
    body: 'To the extent permitted by law we are not liable for indirect or incidental damages resulting from the use of our services.',
  },
]

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary">Legal</p>
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">Please read these terms carefully before using the E-Commerce platform.</p>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {clauses.map((clause) => (
            <section key={clause.title} className="space-y-2">
              <h2 className="text-xl font-semibold">{clause.title}</h2>
              <p className="text-muted-foreground">{clause.body}</p>
            </section>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

