import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: 'How long does shipping take?',
    answer:
      'Orders ship within 24 hours. Standard shipping takes 3-5 business days while express shipping arrives within 1-2 days in major cities.',
  },
  {
    question: 'Can I return or exchange an item?',
    answer:
      'Yes, you can request a return or exchange within 30 days of delivery. Items must be unused and in original packaging. Start the process from your Orders page.',
  },
  {
    question: 'Do you offer international shipping?',
    answer:
      'We currently ship to most ASEAN countries, Australia, and the US. Duties and taxes are calculated at checkout to avoid surprises.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'All payments are processed via PCI-compliant gateways with 3D Secure. We never store raw card numbers on our servers.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'You will receive tracking details by email once your package ships. You can also track it anytime from the Orders section in your account.',
  },
]

export default function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-sm uppercase tracking-widest text-primary">Help center</p>
        <h1 className="text-4xl font-semibold tracking-tight">Frequently asked questions</h1>
        <p className="text-muted-foreground">
          Answers to common questions about orders, shipping, and account management. Need more help? Contact our support
          team anytime.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General questions</CardTitle>
          <CardDescription>Click a question to reveal the answer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((item, index) => (
              <AccordionItem key={item.question} value={`faq-${index}`}>
                <AccordionTrigger className="text-base">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

