package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
	_ "github.com/mattn/go-sqlite3"
)

// RecordRepository is the SQLite implementation of domain.RecordRepository
type RecordRepository struct {
	db *sql.DB
}

// NewRecordRepository creates a new SQLite record repository
func NewRecordRepository(dbPath string) (*RecordRepository, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	repo := &RecordRepository{db: db}
	if err := repo.initialize(); err != nil {
		return nil, fmt.Errorf("failed to initialize database: %w", err)
	}

	return repo, nil
}

// initialize creates the necessary tables
func (r *RecordRepository) initialize() error {
	query := `
	CREATE TABLE IF NOT EXISTS records (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		date DATETIME NOT NULL,
		description TEXT NOT NULL,
		amount REAL NOT NULL,
		currency TEXT NOT NULL,
		account_id TEXT NOT NULL,
		category TEXT,
		created_at DATETIME NOT NULL,
		UNIQUE(date, description, amount)
	);

	CREATE INDEX IF NOT EXISTS idx_records_date ON records(date);
	CREATE INDEX IF NOT EXISTS idx_records_account_id ON records(account_id);
	CREATE INDEX IF NOT EXISTS idx_records_currency ON records(currency);
	`

	_, err := r.db.Exec(query)
	return err
}

// Create creates a new record
func (r *RecordRepository) Create(ctx context.Context, record *domain.Record) error {
	query := `
		INSERT INTO records (date, description, amount, currency, account_id, category, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`

	record.CreatedAt = time.Now()
	result, err := r.db.ExecContext(ctx, query,
		record.Date,
		record.Description,
		record.Amount,
		record.Currency,
		record.AccountID,
		record.Category,
		record.CreatedAt,
	)

	if err != nil {
		// Check for unique constraint violation
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			return fmt.Errorf("duplicate record: a record with the same date, description, and amount already exists")
		}
		return fmt.Errorf("failed to create record: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	record.ID = id
	return nil
}

// FindByID retrieves a record by ID
func (r *RecordRepository) FindByID(ctx context.Context, id int64) (*domain.Record, error) {
	query := `
		SELECT id, date, description, amount, currency, account_id, category, created_at
		FROM records
		WHERE id = ?
	`

	var record domain.Record
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&record.ID,
		&record.Date,
		&record.Description,
		&record.Amount,
		&record.Currency,
		&record.AccountID,
		&record.Category,
		&record.CreatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("record not found")
	}
	if err != nil {
		return nil, fmt.Errorf("failed to find record: %w", err)
	}

	return &record, nil
}

// FindAll retrieves all records with optional filters
func (r *RecordRepository) FindAll(ctx context.Context, filter domain.RecordFilter) ([]domain.Record, error) {
	query := "SELECT id, date, description, amount, currency, account_id, category, created_at FROM records WHERE 1=1"
	args := []interface{}{}

	// Apply filters
	if filter.AccountID != "" {
		query += " AND account_id = ?"
		args = append(args, filter.AccountID)
	}

	if filter.StartDate != nil {
		query += " AND date >= ?"
		args = append(args, *filter.StartDate)
	}

	if filter.EndDate != nil {
		query += " AND date <= ?"
		args = append(args, *filter.EndDate)
	}

	if filter.Currency != nil {
		query += " AND currency = ?"
		args = append(args, *filter.Currency)
	}

	// Apply sorting
	sortBy := "date"
	if filter.SortBy == "description" {
		sortBy = "description"
	}

	sortOrder := "DESC"
	if filter.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	query += fmt.Sprintf(" ORDER BY %s %s", sortBy, sortOrder)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query records: %w", err)
	}
	defer rows.Close()

	var records []domain.Record
	for rows.Next() {
		var record domain.Record
		err := rows.Scan(
			&record.ID,
			&record.Date,
			&record.Description,
			&record.Amount,
			&record.Currency,
			&record.AccountID,
			&record.Category,
			&record.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan record: %w", err)
		}
		records = append(records, record)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating records: %w", err)
	}

	return records, nil
}

// Exists checks if a record with the same date, description, and amount exists
func (r *RecordRepository) Exists(ctx context.Context, date time.Time, description string, amount float64) (bool, error) {
	query := `
		SELECT COUNT(*) FROM records
		WHERE date = ? AND description = ? AND amount = ?
	`

	var count int
	err := r.db.QueryRowContext(ctx, query, date, description, amount).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("failed to check record existence: %w", err)
	}

	return count > 0, nil
}

// Delete deletes a record by ID
func (r *RecordRepository) Delete(ctx context.Context, id int64) error {
	query := "DELETE FROM records WHERE id = ?"

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete record: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("record not found")
	}

	return nil
}

// GetDashboardSummary retrieves aggregated data for the dashboard
func (r *RecordRepository) GetDashboardSummary(ctx context.Context, filter domain.RecordFilter) (*domain.DashboardSummary, error) {
	summary := &domain.DashboardSummary{
		SpendByCategory: make(map[string]float64),
		SpendByMonth:    []domain.MonthlySpend{},
		TopExpenses:     []domain.Record{},
	}

	// Build base query with filters
	whereClause := "WHERE 1=1"
	args := []interface{}{}

	if filter.AccountID != "" {
		whereClause += " AND account_id = ?"
		args = append(args, filter.AccountID)
	}

	if filter.StartDate != nil {
		whereClause += " AND date >= ?"
		args = append(args, *filter.StartDate)
	}

	if filter.EndDate != nil {
		whereClause += " AND date <= ?"
		args = append(args, *filter.EndDate)
	}

	if filter.Currency != nil {
		whereClause += " AND currency = ?"
		args = append(args, *filter.Currency)
	}

	// Total spent and received
	query := fmt.Sprintf(`
		SELECT
			COALESCE(SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END), 0) as total_spent,
			COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as total_received,
			COUNT(*) as transaction_count
		FROM records
		%s
	`, whereClause)

	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&summary.TotalSpent,
		&summary.TotalReceived,
		&summary.TransactionCount,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get totals: %w", err)
	}

	summary.Balance = summary.TotalReceived - summary.TotalSpent

	// Spend by category
	categoryQuery := fmt.Sprintf(`
		SELECT
			COALESCE(category, 'Uncategorized') as category,
			SUM(ABS(amount)) as total
		FROM records
		%s AND amount < 0
		GROUP BY category
		ORDER BY total DESC
	`, whereClause)

	rows, err := r.db.QueryContext(ctx, categoryQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get category summary: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var category string
		var total float64
		if err := rows.Scan(&category, &total); err != nil {
			return nil, fmt.Errorf("failed to scan category: %w", err)
		}
		summary.SpendByCategory[category] = total
	}

	// Spend by month
	monthQuery := fmt.Sprintf(`
		SELECT
			strftime('%%Y-%%m', date) as month,
			CAST(strftime('%%Y', date) AS INTEGER) as year,
			CAST(strftime('%%m', date) AS INTEGER) as month_num,
			SUM(ABS(amount)) as total
		FROM records
		%s AND amount < 0
		GROUP BY month, year, month_num
		ORDER BY year, month_num
	`, whereClause)

	rows, err = r.db.QueryContext(ctx, monthQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly summary: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var spend domain.MonthlySpend
		if err := rows.Scan(&spend.Month, &spend.Year, &spend.MonthNum, &spend.Amount); err != nil {
			return nil, fmt.Errorf("failed to scan monthly spend: %w", err)
		}
		summary.SpendByMonth = append(summary.SpendByMonth, spend)
	}

	// Top expenses (largest debits)
	topExpensesQuery := fmt.Sprintf(`
		SELECT id, date, description, amount, currency, account_id, category, created_at
		FROM records
		%s AND amount < 0
		ORDER BY amount ASC
		LIMIT 10
	`, whereClause)

	rows, err = r.db.QueryContext(ctx, topExpensesQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get top expenses: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var record domain.Record
		err := rows.Scan(
			&record.ID,
			&record.Date,
			&record.Description,
			&record.Amount,
			&record.Currency,
			&record.AccountID,
			&record.Category,
			&record.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan top expense: %w", err)
		}
		summary.TopExpenses = append(summary.TopExpenses, record)
	}

	return summary, nil
}

// Close closes the database connection
func (r *RecordRepository) Close() error {
	return r.db.Close()
}
