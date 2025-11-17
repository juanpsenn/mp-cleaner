'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Download, ChevronDown } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'

interface Record {
  id: string
  date: string
  description: string
  amount: number
  account: string
  category?: string
}

export default function RecordsPage() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'description'>('date')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [accounts, setAccounts] = useState<string[]>([])

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('/api/records')
        if (!response.ok) throw new Error('Failed to fetch records')
        const result = await response.json()
        setRecords(result)
        
        const uniqueAccounts = Array.from(new Set(result.map((r: Record) => r.account)))
        setAccounts(uniqueAccounts as string[])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [])

  const handleExport = async () => {
    try {
      const response = await fetch('/api/records/export')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `records-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      alert('Failed to export records')
    }
  }

  let filteredRecords = records
  if (filterAccount !== 'all') {
    filteredRecords = filteredRecords.filter(r => r.account === filterAccount)
  }

  filteredRecords.sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    } else {
      return a.description.localeCompare(b.description)
    }
  })

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-destructive">Error: {error}</div>

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="/records" />

      <main className="flex-1 flex flex-col">
        <header className="border-b border-border sticky top-0 bg-card z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold">Records</h1>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </header>

        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 w-full flex flex-col sm:flex-row gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between">
                  <span>Sort: {sortBy}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'description')}>
                  <DropdownMenuRadioItem value="date">Date</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="description">Description</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto justify-between">
                  <span>Account: {filterAccount === 'all' ? 'All' : filterAccount}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Filter by Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={filterAccount} onValueChange={setFilterAccount}>
                  <DropdownMenuRadioItem value="all">All Accounts</DropdownMenuRadioItem>
                  {accounts.map(account => (
                    <DropdownMenuRadioItem key={account} value={account}>{account}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 w-full">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 sticky top-0">
                    <tr>
                      <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm">Date</th>
                      <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm">Description</th>
                      <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm hidden md:table-cell">Account</th>
                      <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm hidden lg:table-cell">Category</th>
                      <th className="p-3 md:p-4 text-right font-semibold text-xs md:text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground py-8">
                          No records found
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map(record => (
                        <tr key={record.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-3 md:p-4 text-xs md:text-sm">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="p-3 md:p-4 text-xs md:text-sm font-medium">{record.description}</td>
                          <td className="p-3 md:p-4 text-xs md:text-sm hidden md:table-cell text-muted-foreground">{record.account}</td>
                          <td className="p-3 md:p-4 text-xs md:text-sm hidden lg:table-cell text-muted-foreground">{record.category || '-'}</td>
                          <td className="p-3 md:p-4 text-right font-semibold text-xs md:text-sm text-destructive">${Math.abs(record.amount).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
