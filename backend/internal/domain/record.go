package domain

import (
	"fmt"
	"time"
)

// Currency represents the currency type
type Currency string

const (
	CurrencyARS Currency = "ARS"
	CurrencyUSD Currency = "USD"
)

// Record represents a financial transaction record
type Record struct {
	ID          int64     `json:"id"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	Amount      float64   `json:"amount"` // Negative for debits, positive for credits
	Currency    Currency  `json:"currency"`
	AccountID   string    `json:"accountId"`
	Category    string    `json:"category,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Validate checks if the record is valid
func (r *Record) Validate() error {
	if r.Date.IsZero() {
		return fmt.Errorf("date is required")
	}
	if r.Description == "" {
		return fmt.Errorf("description is required")
	}
	if r.Amount == 0 {
		return fmt.Errorf("amount cannot be zero")
	}
	if r.Currency != CurrencyARS && r.Currency != CurrencyUSD {
		return fmt.Errorf("invalid currency: %s", r.Currency)
	}
	return nil
}

// RecordBatch represents a batch of records from an import
type RecordBatch struct {
	Records  []Record
	Provider string
	Currency Currency
}
