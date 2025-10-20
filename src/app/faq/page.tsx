
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Search } from "lucide-react";

export default function FAQPage() {
  return (
    <div className="container mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Can't find the answer you're looking for? Reach out to our support team.
        </p>
      </header>

      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 text-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
        />
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              What is the Lightning Network?
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none dark:prose-invert">
            <p>
              The Lightning Network is a "Layer 2" payment protocol layered on top of Bitcoin. It enables fast, low-cost transactions by creating a network of payment channels between users.
            </p>
            <p>
              Think of it like a bar tab. Instead of settling every single drink purchase on your credit card (which would be slow and expensive), you open a tab and settle the entire bill at the end of the night. The Lightning Network works in a similar way, allowing for a large number of transactions to happen "off-chain" with only the final balance being recorded on the main Bitcoin blockchain.
            </p>
            <h4 className="text-xl font-semibold">Key Benefits:</h4>
            <ul>
              <li><strong>Instant Payments:</strong> Transactions are confirmed in seconds, not minutes.</li>
              <li><strong>Low Fees:</strong> Fees are typically a fraction of a cent, making it ideal for micropayments.</li>
              <li><strong>Scalability:</strong> It helps to scale the Bitcoin network, allowing for a much higher volume of transactions.</li>
            </ul>
            <p>
              By integrating the Lightning Network, OrangeCat will be able to offer a faster and cheaper way to support the projects you care about.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
