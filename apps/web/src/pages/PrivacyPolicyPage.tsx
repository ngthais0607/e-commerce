import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const sections = [
  {
    title: 'Information we collect',
    body: [
      'Account data such as name, email, phone number, and shipping addresses.',
      'Order history, payment identifiers, and invoice details for compliance.',
      'Usage data including device info, pages visited, and product interests to personalize the experience.',
    ],
  },
  {
    title: 'How we use your information',
    body: [
      'Process orders, payments, and refunds, and deliver products.',
      'Send order updates, marketing campaigns (when opted in), and important policy changes.',
      'Improve our storefront through analytics, A/B testing, and fraud prevention.',
    ],
  },
  {
    title: 'Your rights & choices',
    body: [
      'Request a copy of the personal data we hold about you.',
      'Ask us to correct or delete your data (unless we must retain it for legal reasons).',
      'Opt out of marketing emails anytime via the unsubscribe link.',
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-widest text-primary">Legal</p>
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()} — We respect your privacy and are committed to protecting your
          personal data.
        </p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                {section.body.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>Email: privacy@ecommerce.dev</p>
            <p>Address: 123 Commerce Street, District 1, Ho Chi Minh City</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

