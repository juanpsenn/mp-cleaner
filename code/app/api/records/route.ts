import { NextResponse } from 'next/server'

// Mock data for development
const mockRecords = [
  { id: '1', date: '2024-01-15', description: 'Amazon Purchase', amount: -45.99, account: 'Checking', category: 'Shopping' },
  { id: '2', date: '2024-01-14', description: 'Salary Deposit', amount: 3500.00, account: 'Checking', category: 'Income' },
  { id: '3', date: '2024-01-12', description: 'Electric Bill', amount: -120.50, account: 'Checking', category: 'Utilities' },
  { id: '4', date: '2024-01-10', description: 'Gas Station', amount: -55.00, account: 'Credit Card', category: 'Transportation' },
  { id: '5', date: '2024-01-08', description: 'Restaurant', amount: -65.30, account: 'Credit Card', category: 'Dining' },
  { id: '6', date: '2024-01-05', description: 'Transfer In', amount: 500.00, account: 'Savings', category: 'Transfer' },
  { id: '7', date: '2024-01-03', description: 'Gym Membership', amount: -49.99, account: 'Credit Card', category: 'Health' },
  { id: '8', date: '2024-01-01', description: 'New Year Bonus', amount: 200.00, account: 'Checking', category: 'Income' },
]

export async function GET() {
  return NextResponse.json(mockRecords)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newRecord = {
      id: Date.now().toString(),
      ...body,
      date: new Date().toISOString().split('T')[0],
    }
    return NextResponse.json(newRecord, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
