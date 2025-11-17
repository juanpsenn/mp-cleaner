'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordsApi } from '@/lib/api';

export default function CreateRecordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    currency: 'ARS' as 'ARS' | 'USD',
    accountId: '',
    category: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      setLoading(true);

      // Validate
      if (!formData.date || !formData.description || !formData.amount || !formData.accountId) {
        setError('Please fill in all required fields');
        return;
      }

      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) {
        setError('Invalid amount');
        return;
      }

      await recordsApi.createRecord({
        date: formData.date,
        description: formData.description,
        amount: amount,
        currency: formData.currency,
        accountId: formData.accountId,
        category: formData.category || undefined,
      });

      setSuccess(true);

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: '',
        currency: 'ARS',
        accountId: '',
        category: '',
      });

      // Redirect to records page after 2 seconds
      setTimeout(() => {
        router.push('/records');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Record</h1>
        <p className="mt-2 text-gray-600">Add a new financial record manually</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold">Success!</p>
          <p className="text-green-600">Record created successfully. Redirecting to records page...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="description"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="amount"
            required
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="Enter amount (negative for expenses)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Use negative values for expenses (e.g., -100) and positive for income
          </p>
        </div>

        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            id="currency"
            required
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'ARS' | 'USD' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ARS">ARS (Argentine Peso)</option>
            <option value="USD">USD (US Dollar)</option>
          </select>
        </div>

        <div>
          <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">
            Account ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="accountId"
            required
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            placeholder="Enter account ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category (Optional)
          </label>
          <input
            type="text"
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Enter category..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Record'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/records')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
