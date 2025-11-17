import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    totalSpending: 336.78,
    totalIncome: 3700.00,
    balance: 3363.22,
    categories: [
      { name: 'Shopping', amount: 45.99 },
      { name: 'Utilities', amount: 120.50 },
      { name: 'Transportation', amount: 55.00 },
      { name: 'Dining', amount: 65.30 },
      { name: 'Health', amount: 49.99 },
    ],
    accounts: [
      { name: 'Checking', balance: 3000.00 },
      { name: 'Credit Card', balance: -170.30 },
      { name: 'Savings', balance: 500.00 },
    ],
    trends: [
      { date: '2024-01-01', spending: 200.00 },
      { date: '2024-01-02', spending: 49.99 },
      { date: '2024-01-03', spending: 0 },
      { date: '2024-01-05', spending: 0 },
      { date: '2024-01-08', spending: 65.30 },
      { date: '2024-01-10', spending: 55.00 },
      { date: '2024-01-12', spending: 120.50 },
      { date: '2024-01-15', spending: 45.99 },
    ],
  })
}
