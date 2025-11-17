package parser

import (
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"
	"time"

	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
)

// MercadoPagoParser handles MercadoPago CSV files
type MercadoPagoParser struct{}

// NewMercadoPagoParser creates a new MercadoPago parser
func NewMercadoPagoParser() *MercadoPagoParser {
	return &MercadoPagoParser{}
}

// GetProviderName returns the provider name
func (p *MercadoPagoParser) GetProviderName() string {
	return "mercadopago"
}

// Parse parses a MercadoPago CSV file
func (p *MercadoPagoParser) Parse(reader io.Reader, accountID string) (*domain.RecordBatch, error) {
	// Read all content first to detect separator
	content, err := io.ReadAll(reader)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Detect separator (comma or semicolon)
	separator := ','
	if strings.Count(string(content), ";") > strings.Count(string(content), ",") {
		separator = ';'
	}

	// Parse CSV
	csvReader := csv.NewReader(strings.NewReader(string(content)))
	csvReader.Comma = separator
	csvReader.LazyQuotes = true
	csvReader.TrimLeadingSpace = true

	rows, err := csvReader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(rows) < 5 {
		return nil, fmt.Errorf("invalid MercadoPago file: expected at least 5 rows, got %d", len(rows))
	}

	// Skip first 3 rows, row 4 is headers, data starts at row 5
	headers := rows[3]
	dataRows := rows[4:]

	// Find column indices
	dateCol := findColumn(headers, "RELEASE_DATE")
	typeCol := findColumn(headers, "TRANSACTION_TYPE")
	refCol := findColumn(headers, "REFERENCE_ID")
	amountCol := findColumn(headers, "TRANSACTION_NET_AMOUNT")

	if dateCol == -1 || typeCol == -1 || refCol == -1 || amountCol == -1 {
		return nil, fmt.Errorf("missing required columns in MercadoPago file")
	}

	var records []domain.Record

	for i, row := range dataRows {
		// Skip empty rows
		if len(row) == 0 || (len(row) > 0 && strings.TrimSpace(row[0]) == "") {
			continue
		}

		// Ensure row has enough columns
		if len(row) <= max(dateCol, typeCol, refCol, amountCol) {
			continue
		}

		// Parse date (DD-MM-YYYY format)
		dateStr := strings.TrimSpace(row[dateCol])
		if dateStr == "" {
			continue
		}

		date, err := time.Parse("02-01-2006", dateStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse date in row %d: %w", i+5, err)
		}

		// Add 1 day (as per original Python implementation)
		date = date.AddDate(0, 0, 1)

		// Parse and clean transaction type
		transactionType := strings.TrimSpace(row[typeCol])
		transactionType = strings.TrimPrefix(transactionType, "Transferencia enviada")
		transactionType = strings.TrimPrefix(transactionType, "Transferencia recibida")
		transactionType = strings.TrimSpace(transactionType)

		// Get reference ID
		referenceID := strings.TrimSpace(row[refCol])

		// Build description
		description := transactionType
		if referenceID != "" {
			description = fmt.Sprintf("%s - %s", transactionType, referenceID)
		}

		// Skip if description is empty
		if description == "" || description == " - " {
			continue
		}

		// Parse amount (Argentine format: 1.809,09)
		amountStr := strings.TrimSpace(row[amountCol])
		amount, err := parseArgentineAmount(amountStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse amount in row %d: %w", i+5, err)
		}

		record := domain.Record{
			Date:        date,
			Description: description,
			Amount:      amount,
			Currency:    domain.CurrencyARS,
			AccountID:   accountID,
		}

		records = append(records, record)
	}

	batch := &domain.RecordBatch{
		Records:  records,
		Provider: p.GetProviderName(),
		Currency: domain.CurrencyARS,
	}

	return batch, nil
}

// parseArgentineAmount converts Argentine number format to float
// Example: "1.809,09" -> 1809 (removes decimals, as per Python implementation)
// Dots are thousands separators, commas are decimal separators
func parseArgentineAmount(amountStr string) (float64, error) {
	if amountStr == "" {
		return 0, fmt.Errorf("empty amount")
	}

	// Remove spaces
	amountStr = strings.ReplaceAll(amountStr, " ", "")

	// Handle negative sign
	isNegative := strings.HasPrefix(amountStr, "-")
	amountStr = strings.TrimPrefix(amountStr, "-")

	// Remove dots (thousands separators)
	amountStr = strings.ReplaceAll(amountStr, ".", "")

	// Remove comma and everything after it (decimal part)
	// As per Python implementation, decimals are discarded
	if idx := strings.Index(amountStr, ","); idx != -1 {
		amountStr = amountStr[:idx]
	}

	// Parse as integer
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse amount: %w", err)
	}

	if isNegative {
		amount = -amount
	}

	return amount, nil
}

// findColumn finds the index of a column by name (case-insensitive)
func findColumn(headers []string, name string) int {
	name = strings.ToUpper(strings.TrimSpace(name))
	for i, header := range headers {
		if strings.ToUpper(strings.TrimSpace(header)) == name {
			return i
		}
	}
	return -1
}

// max returns the maximum of integers
func max(nums ...int) int {
	if len(nums) == 0 {
		return 0
	}
	maxNum := nums[0]
	for _, num := range nums[1:] {
		if num > maxNum {
			maxNum = num
		}
	}
	return maxNum
}
