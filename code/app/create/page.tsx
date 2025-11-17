'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'

export default function CreateRecordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date'),
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount') as string),
      account: formData.get('account'),
      category: formData.get('category'),
    }

    try {
      const response = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create record')
      }

      setMessage({ type: 'success', text: 'Record created successfully' })
      if (formRef.current) {
        formRef.current.reset()
      }
      
      setTimeout(() => {
        router.push('/records')
      }, 1500)
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for navigation */}
      <Sidebar currentPage="/create" />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-6 w-full">
            <h1 className="text-3xl font-bold">Create Record</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
          <Card>
            <CardHeader>
              <CardTitle>New Transaction</CardTitle>
              <CardDescription>Add a single transaction record</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Message */}
                {message && (
                  <div className={`flex gap-3 p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-900 dark:bg-green-900/20'
                      : 'bg-red-50 text-red-900 dark:bg-red-900/20'
                  }`}>
                    {message.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p>{message.text}</p>
                  </div>
                )}

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Date</label>
                  <Input
                    type="date"
                    name="date"
                    required
                    className="w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Description</label>
                  <Input
                    type="text"
                    name="description"
                    placeholder="e.g., Grocery shopping"
                    required
                    className="w-full"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Amount</label>
                  <Input
                    type="number"
                    name="amount"
                    step="0.01"
                    placeholder="0.00"
                    required
                    className="w-full"
                  />
                </div>

                {/* Account */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Account</label>
                  <Input
                    type="text"
                    name="account"
                    placeholder="e.g., Checking, Savings"
                    required
                    className="w-full"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Category (Optional)</label>
                  <Input
                    type="text"
                    name="category"
                    placeholder="e.g., Food, Transportation"
                    className="w-full"
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? 'Creating...' : 'Create Record'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
