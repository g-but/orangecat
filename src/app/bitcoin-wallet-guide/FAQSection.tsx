import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const FAQ_ITEMS = [
  {
    question: 'Is it safe to use a Bitcoin wallet?',
    answer:
      'Yes, when used properly. Bitcoin wallets use strong cryptography. The key is to choose a reputable wallet, keep your recovery phrase secure, and never share your private keys with anyone.',
  },
  {
    question: 'Do I need to pay to create a wallet?',
    answer:
      'No, creating a Bitcoin wallet is free. You only pay network fees when sending Bitcoin transactions. Receiving Bitcoin is always free.',
  },
  {
    question: 'What if I lose my recovery phrase?',
    answer:
      "If you lose your recovery phrase and can't access your wallet, your Bitcoin will be permanently lost. This is why it's crucial to write it down and store it safely offline.",
  },
  {
    question: 'Can I use the same address multiple times?',
    answer:
      "Yes, you can reuse Bitcoin addresses, but it's better for privacy to generate a new address for each transaction. Most modern wallets do this automatically.",
  },
];

export function FAQSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-16"
    >
      <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
        Frequently Asked Questions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {FAQ_ITEMS.map(({ question, answer }) => (
          <Card key={question}>
            <CardHeader>
              <CardTitle className="text-lg">{question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">{answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
