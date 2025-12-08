import { Metadata } from 'next';
import { FAQContent } from './faq-content';

export const metadata: Metadata = {
  title: 'FAQ | Vibe Olympics',
  description: 'Frequently asked questions about Vibe Olympics - digital marketplace for VIBE coding products',
  keywords: ['FAQ', 'help', 'support', 'questions', 'VIBE coding', 'marketplace'],
};

export default function FAQPage() {
  return <FAQContent />;
}
