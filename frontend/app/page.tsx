'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sidebar } from '@/components/sidebar'

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="/" />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            <h1 className="text-3xl font-bold text-foreground">Financial Tracker</h1>
            <p className="text-muted-foreground mt-1">Manage and track your spending</p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard')}>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>View spending analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Track your spending habits with charts and summaries</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/records')}>
              <CardHeader>
                <CardTitle>Records</CardTitle>
                <CardDescription>Manage transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View, sort, and filter all your financial records</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/import')}>
              <CardHeader>
                <CardTitle>Import</CardTitle>
                <CardDescription>Upload bank files</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Bulk import transactions from bank exports</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/create')}>
              <CardHeader>
                <CardTitle>Create Record</CardTitle>
                <CardDescription>Add manual entry</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Manually add a single financial record</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
