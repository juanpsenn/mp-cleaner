package parser

import (
	"fmt"
	"io"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
	"github.com/xuri/excelize/v2"
)

// SantanderParser handles Santander Excel files
type SantanderParser struct{}

// NewSantanderParser creates a new Santander parser
func NewSantanderParser() *SantanderParser {
	return &SantanderParser{}
}

// GetProviderName returns the provider name
func (p *SantanderParser) GetProviderName() string {
	return "santander"
}

// Parse parses a Santander Excel file
func (p *SantanderParser) Parse(reader io.Reader, accountID string) (*domain.RecordBatch, error) {
	// excelize requires a file, so we need to write to a temp file
	tmpFile, err := os.CreateTemp("", "santander-*.xlsx")
	if err != nil {
		return nil, fmt.Errorf("failed to create temp file: %w", err)
	}
	defer os.Remove(tmpFile.Name())
	defer tmpFile.Close()

	// Copy content to temp file
	if _, err := io.Copy(tmpFile, reader); err != nil {
		return nil, fmt.Errorf("failed to write temp file: %w", err)
	}

	// Open Excel file
	f, err := excelize.OpenFile(tmpFile.Name())
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer f.Close()

	// Get the first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets found in Excel file")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("failed to get rows: %w", err)
	}

	var records []domain.Record
	sectionPattern := regexp.MustCompile(`(?i)Pago de tarjeta y devoluciones|Tarjeta de .* terminada en`)

	i := 0
	for i < len(rows) {
		row := rows[i]

		// Check if this row starts a section
		if len(row) > 0 && sectionPattern.MatchString(row[0]) {
			// Found a section, find the header row
			headerRow := -1
			for j := i + 1; j < len(rows) && j < i+5; j++ {
				if len(rows[j]) > 0 && strings.Contains(strings.ToLower(rows[j][0]), "fecha") {
					headerRow = j
					break
				}
			}

			if headerRow != -1 {
				// Process this section
				sectionRecords, nextRow := p.parseSection(rows, headerRow+1, accountID)
				records = append(records, sectionRecords...)
				i = nextRow
				continue
			}
		}
		i++
	}

	batch := &domain.RecordBatch{
		Records:  records,
		Provider: p.GetProviderName(),
		Currency: domain.CurrencyARS, // Default, but records can have USD too
	}

	return batch, nil
}

// parseSection parses a single section of transactions
func (p *SantanderParser) parseSection(rows [][]string, startRow int, accountID string) ([]domain.Record, int) {
	var records []domain.Record
	var lastValidDate time.Time

	// Detect column offset (date might be in column A or B)
	offset := 0
	if startRow < len(rows) && len(rows[startRow]) > 1 {
		// Check if first column has date or second column
		if isDateLike(getCellValue(rows[startRow], 0)) {
			offset = 0
		} else if isDateLike(getCellValue(rows[startRow], 1)) {
			offset = 1
		}
	}

	// Column indices (adjusted by offset)
	dateCol := offset
	descCol := 1 + offset
	cuotasCol := 2 + offset
	comprobanteCol := 3 + offset
	arsCol := 4 + offset
	usdCol := 5 + offset

	sectionPattern := regexp.MustCompile(`(?i)Pago de tarjeta y devoluciones|Tarjeta de .* terminada en`)

	for i := startRow; i < len(rows); i++ {
		row := rows[i]

		// Stop if we hit another section or end of data
		if len(row) == 0 || (len(row) > 0 && sectionPattern.MatchString(row[0])) {
			return records, i
		}

		// Check if this is an empty row (stop processing)
		if isEmptyRow(row) {
			continue
		}

		// Parse date
		dateStr := getCellValue(row, dateCol)
		var date time.Time
		var err error

		if dateStr != "" {
			date, err = parseDate(dateStr)
			if err != nil {
				// Skip this row if date parsing fails
				continue
			}
			// Add 1 day (as per Python implementation)
			date = date.AddDate(0, 0, 1)
			lastValidDate = date
		} else {
			// Reuse last valid date
			if lastValidDate.IsZero() {
				continue
			}
			date = lastValidDate
		}

		// Parse description
		description := getCellValue(row, descCol)
		cuotas := getCellValue(row, cuotasCol)
		comprobante := getCellValue(row, comprobanteCol)

		// Build description
		descParts := []string{}
		if description != "" {
			descParts = append(descParts, description)
		}
		if cuotas != "" {
			descParts = append(descParts, cuotas)
		}
		if comprobante != "" {
			descParts = append(descParts, comprobante)
		}

		finalDesc := strings.Join(descParts, " - ")
		if finalDesc == "" {
			continue
		}

		// Parse ARS amount
		arsStr := getCellValue(row, arsCol)
		if arsStr != "" {
			amount, err := parseSantanderAmount(arsStr)
			if err == nil && amount != 0 {
				// Negate amount (as per Python implementation)
				amount = -amount

				record := domain.Record{
					Date:        date,
					Description: finalDesc,
					Amount:      amount,
					Currency:    domain.CurrencyARS,
					AccountID:   accountID,
				}
				records = append(records, record)
			}
		}

		// Parse USD amount
		usdStr := getCellValue(row, usdCol)
		if usdStr != "" {
			amount, err := parseSantanderAmount(usdStr)
			if err == nil && amount != 0 {
				// Negate amount (as per Python implementation)
				amount = -amount

				record := domain.Record{
					Date:        date,
					Description: finalDesc,
					Amount:      amount,
					Currency:    domain.CurrencyUSD,
					AccountID:   accountID,
				}
				records = append(records, record)
			}
		}
	}

	return records, len(rows)
}

// parseSantanderAmount parses amounts like "$28.640,00" or "U$D4,82" or "US$-29,34"
func parseSantanderAmount(amountStr string) (float64, error) {
	if amountStr == "" {
		return 0, fmt.Errorf("empty amount")
	}

	// Remove currency symbols and spaces
	amountStr = strings.ReplaceAll(amountStr, "$", "")
	amountStr = strings.ReplaceAll(amountStr, "U", "")
	amountStr = strings.ReplaceAll(amountStr, "D", "")
	amountStr = strings.ReplaceAll(amountStr, "S", "")
	amountStr = strings.ReplaceAll(amountStr, " ", "")
	amountStr = strings.TrimSpace(amountStr)

	if amountStr == "" {
		return 0, fmt.Errorf("empty amount after cleaning")
	}

	// Handle negative sign
	isNegative := strings.HasPrefix(amountStr, "-")
	amountStr = strings.TrimPrefix(amountStr, "-")

	// Remove dots (thousands separators)
	amountStr = strings.ReplaceAll(amountStr, ".", "")

	// Replace comma with dot (decimal separator)
	amountStr = strings.ReplaceAll(amountStr, ",", ".")

	// Parse as float
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse amount: %w", err)
	}

	if isNegative {
		amount = -amount
	}

	return amount, nil
}

// parseDate parses date in DD/MM/YYYY format or Excel date number
func parseDate(dateStr string) (time.Time, error) {
	// Try DD/MM/YYYY format first
	if strings.Contains(dateStr, "/") {
		date, err := time.Parse("02/01/2006", dateStr)
		if err == nil {
			return date, nil
		}
	}

	// Try Excel date number (days since 1899-12-30)
	if excelDate, err := strconv.ParseFloat(dateStr, 64); err == nil {
		// Excel epoch is December 30, 1899
		excelEpoch := time.Date(1899, 12, 30, 0, 0, 0, 0, time.UTC)
		return excelEpoch.AddDate(0, 0, int(excelDate)), nil
	}

	return time.Time{}, fmt.Errorf("failed to parse date: %s", dateStr)
}

// getCellValue safely gets a cell value from a row
func getCellValue(row []string, col int) string {
	if col < 0 || col >= len(row) {
		return ""
	}
	return strings.TrimSpace(row[col])
}

// isEmptyRow checks if a row is empty
func isEmptyRow(row []string) bool {
	for _, cell := range row {
		if strings.TrimSpace(cell) != "" {
			return false
		}
	}
	return true
}

// isDateLike checks if a string looks like a date
func isDateLike(s string) bool {
	// Check for DD/MM/YYYY pattern or numeric (Excel date)
	if matched, _ := regexp.MatchString(`^\d{1,2}/\d{1,2}/\d{4}$`, s); matched {
		return true
	}
	if _, err := strconv.ParseFloat(s, 64); err == nil {
		// Could be an Excel date number
		return true
	}
	return false
}
