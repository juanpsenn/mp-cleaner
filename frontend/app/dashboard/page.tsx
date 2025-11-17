'use client'

import { useEffect, useState } from 'react'
import { recordsApi, DashboardSummary } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'

const COLORS = ['#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f87171']

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await recordsApi.getDashboardSummary()
      setSummary(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar currentPage="/dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar currentPage="/dashboard" />
        <main className="flex-1 flex items-center justify-center p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadDashboard}>Retry</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar currentPage="/dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">No data available</p>
        </main>
      </div>
    )
  }

  // Prepare data for charts
  const categoryData = Object.entries(summary.spendByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  const monthlyData = summary.spendByMonth.map((item) => ({
    month: item.month,
    amount: item.amount,
  }))

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="/dashboard" />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your financial activity</p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-destructive">${summary.totalSpent.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Received</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">${summary.totalReceived.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  ${summary.balance.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{summary.transactionCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-8 lg:grid-cols-2 mb-8">
            {/* Monthly Spending */}
            {monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trend</CardTitle>
                  <CardDescription>Monthly spending over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ amount: { label: 'Amount', color: 'hsl(var(--chart-1))' } }} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="amount" stroke={COLORS[0]} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Spending by Category */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>By Category</CardTitle>
                  <CardDescription>Distribution of spending</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={{ value: { label: 'Amount', color: 'hsl(var(--chart-1))' } }} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Top Expenses */}
          {summary.topExpenses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top Expenses</CardTitle>
                <CardDescription>Largest expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Currency
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {summary.topExpenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-destructive">
                            ${Math.abs(expense.amount).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {expense.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
