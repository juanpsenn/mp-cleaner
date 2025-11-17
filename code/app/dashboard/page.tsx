'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Sidebar } from '@/components/sidebar'

interface DashboardSummary {
  totalSpending: number
  averageTransaction: number
  byCategory: Array<{ name: string; value: number }>
  byMonth: Array<{ month: string; amount: number }>
  topAccounts: Array<{ name: string; total: number }>
}

const COLORS = ['#c084fc', '#60a5fa', '#34d399', '#fbbf24', '#f87171']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/summary')
        if (!response.ok) throw new Error('Failed to fetch dashboard data')
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-destructive">Error: {error}</div>
  if (!data) return <div className="p-8">No data available</div>

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="/dashboard" />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-6 w-full">
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${data.totalSpending.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">${data.averageTransaction.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Monthly Spending */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend</CardTitle>
                <CardDescription>Monthly spending over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ amount: { label: 'Amount', color: 'hsl(var(--chart-1))' } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="amount" stroke={COLORS[0]} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Spending by Category */}
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
                <CardDescription>Distribution of spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ value: { label: 'Amount', color: 'hsl(var(--chart-1))' } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {data.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Accounts */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Top Accounts</CardTitle>
                <CardDescription>Accounts with highest spending</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ total: { label: 'Total', color: 'hsl(var(--chart-2))' } }} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.topAccounts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="total" fill={COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
