import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-extrabold mb-2">Payment successful</h1>
      <p className="text-sleek-gray mb-6">Your credits will be available shortly. Thank you!</p>
      <div className="flex gap-3 justify-center">
        <Link href="/dashboard" className="px-4 py-2 rounded-md bg-rausch-600 text-white hover:bg-rausch-700">Go to Dashboard</Link>
        <Link href="/credits" className="px-4 py-2 rounded-md border border-sleek-border hover:bg-gray-50">Buy more credits</Link>
      </div>
    </main>
  )
}

