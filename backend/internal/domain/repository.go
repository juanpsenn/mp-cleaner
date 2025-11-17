package domain

import (
	"context"
	"time"
)

// RecordRepository defines the interface for record persistence
type RecordRepository interface {
	// Create creates a new record
	Create(ctx context.Context, record *Record) error

	// FindByID retrieves a record by ID
	FindByID(ctx context.Context, id int64) (*Record, error)

	// FindAll retrieves all records with optional filters
	FindAll(ctx context.Context, filter RecordFilter) ([]Record, error)

	// Exists checks if a record with the same date, description, and amount exists
	Exists(ctx context.Context, date time.Time, description string, amount float64) (bool, error)

	// Delete deletes a record by ID
	Delete(ctx context.Context, id int64) error

	// GetDashboardSummary retrieves aggregated data for the dashboard
	GetDashboardSummary(ctx context.Context, filter RecordFilter) (*DashboardSummary, error)
}

// RecordFilter defines filter options for querying records
type RecordFilter struct {
	AccountID   string
	SortBy      string // "date" or "description"
	SortOrder   string // "asc" or "desc"
	StartDate   *time.Time
	EndDate     *time.Time
	Currency    *Currency
}

// DashboardSummary contains aggregated data for the dashboard
type DashboardSummary struct {
	TotalSpent       float64                `json:"totalSpent"`
	TotalReceived    float64                `json:"totalReceived"`
	Balance          float64                `json:"balance"`
	TransactionCount int                    `json:"transactionCount"`
	SpendByCategory  map[string]float64     `json:"spendByCategory"`
	SpendByMonth     []MonthlySpend         `json:"spendByMonth"`
	TopExpenses      []Record               `json:"topExpenses"`
}

// MonthlySpend represents spending data for a specific month
type MonthlySpend struct {
	Month   string  `json:"month"`   // Format: "2024-01"
	Year    int     `json:"year"`
	MonthNum int    `json:"monthNum"`
	Amount  float64 `json:"amount"`
}
