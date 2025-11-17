import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface FinancialRecord {
  id: number;
  date: string;
  description: string;
  amount: number;
  currency: 'ARS' | 'USD';
  accountId: string;
  category?: string;
  createdAt: string;
}

export interface DashboardSummary {
  totalSpent: number;
  totalReceived: number;
  balance: number;
  transactionCount: number;
  spendByCategory: Record<string, number>;
  spendByMonth: MonthlySpend[];
  topExpenses: FinancialRecord[];
}

export interface MonthlySpend {
  month: string;
  year: number;
  monthNum: number;
  amount: number;
}

export interface ImportResult {
  totalRecords: number;
  importedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
  errors?: string[];
}

export interface RecordFilter {
  accountId?: string;
  sortBy?: 'date' | 'description';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  currency?: 'ARS' | 'USD';
}

// API methods
export const recordsApi = {
  // Create a new record
  createRecord: async (record: Omit<FinancialRecord, 'id' | 'createdAt'>): Promise<FinancialRecord> => {
    const response = await api.post<FinancialRecord>('/api/records', record);
    return response.data;
  },

  // Get all records with optional filters
  getRecords: async (filter?: RecordFilter): Promise<FinancialRecord[]> => {
    const params = new URLSearchParams();
    if (filter?.accountId) params.append('accountId', filter.accountId);
    if (filter?.sortBy) params.append('sortBy', filter.sortBy);
    if (filter?.sortOrder) params.append('sortOrder', filter.sortOrder);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.currency) params.append('currency', filter.currency);

    const response = await api.get<FinancialRecord[]>(`/api/records?${params.toString()}`);
    return response.data;
  },

  // Export records as CSV
  exportRecords: async (filter?: RecordFilter): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filter?.accountId) params.append('accountId', filter.accountId);

    const response = await api.get(`/api/records/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Import records from a file
  importRecords: async (file: File, provider: string, accountId: string): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('provider', provider);
    formData.append('accountId', accountId);

    const response = await api.post<ImportResult>('/api/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get dashboard summary
  getDashboardSummary: async (filter?: RecordFilter): Promise<DashboardSummary> => {
    const params = new URLSearchParams();
    if (filter?.accountId) params.append('accountId', filter.accountId);
    if (filter?.startDate) params.append('startDate', filter.startDate);
    if (filter?.endDate) params.append('endDate', filter.endDate);
    if (filter?.currency) params.append('currency', filter.currency);

    const response = await api.get<DashboardSummary>(`/api/dashboard/summary?${params.toString()}`);
    return response.data;
  },

  // Delete a record
  deleteRecord: async (id: number): Promise<void> => {
    await api.delete(`/api/records/${id}`);
  },
};

export default api;
