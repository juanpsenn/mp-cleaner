'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recordsApi, ImportResult } from '@/lib/api';

export default function ImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState<'mercadopago' | 'santander'>('mercadopago');
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!accountId) {
      setError('Please enter an account ID');
      return;
    }

    try {
      setLoading(true);
      const importResult = await recordsApi.importRecords(file, provider, accountId);
      setResult(importResult);

      // Clear file input after successful import
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to import records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import Records</h1>
        <p className="mt-2 text-gray-600">Upload bank files to import transactions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <p className="text-green-800 font-semibold">Import Complete!</p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">Total Records</div>
              <div className="text-2xl font-bold text-gray-900">{result.totalRecords}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">Imported</div>
              <div className="text-2xl font-bold text-green-600">{result.importedRecords}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">Duplicates</div>
              <div className="text-2xl font-bold text-yellow-600">{result.duplicateRecords}</div>
            </div>
            <div className="bg-white rounded p-3">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-2xl font-bold text-red-600">{result.failedRecords}</div>
            </div>
          </div>
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-red-800">Errors:</p>
              <ul className="mt-2 space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">• {error}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => router.push('/records')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            View Records
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">
            Bank Provider <span className="text-red-500">*</span>
          </label>
          <select
            id="provider"
            required
            value={provider}
            onChange={(e) => setProvider(e.target.value as 'mercadopago' | 'santander')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mercadopago">MercadoPago (CSV)</option>
            <option value="santander">Santander (Excel)</option>
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
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Enter your account ID..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            This will be used to identify records from this import
          </p>
        </div>

        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-1">
            File <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-input"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-input"
                    name="file-input"
                    type="file"
                    className="sr-only"
                    accept={provider === 'mercadopago' ? '.csv' : '.xlsx,.xls'}
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {provider === 'mercadopago' ? 'CSV files only' : 'Excel files (.xlsx, .xls)'}
              </p>
              {file && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">File Format Guidelines</h3>
          <div className="text-sm text-blue-800 space-y-1">
            {provider === 'mercadopago' ? (
              <>
                <p>• MercadoPago CSV files should contain transaction history</p>
                <p>• Expected columns: RELEASE_DATE, TRANSACTION_TYPE, REFERENCE_ID, TRANSACTION_NET_AMOUNT</p>
                <p>• First 3 rows are metadata (will be skipped)</p>
              </>
            ) : (
              <>
                <p>• Santander Excel files should contain credit card statements</p>
                <p>• Expected columns: Fecha, Descripción, Cuotas, Comprobante, $ (ARS), U$D (USD)</p>
                <p>• Supports multiple card sections in one file</p>
              </>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Importing...' : 'Import Records'}
        </button>
      </form>
    </div>
  );
}
