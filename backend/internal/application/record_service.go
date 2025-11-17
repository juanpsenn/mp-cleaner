package application

import (
	"context"
	"fmt"
	"io"

	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
)

// RecordService handles business logic for records
type RecordService struct {
	repo    domain.RecordRepository
	parsers map[string]domain.Parser
}

// NewRecordService creates a new record service
func NewRecordService(repo domain.RecordRepository, parsers map[string]domain.Parser) *RecordService {
	return &RecordService{
		repo:    repo,
		parsers: parsers,
	}
}

// CreateRecord creates a new record with duplicate prevention
func (s *RecordService) CreateRecord(ctx context.Context, record *domain.Record) error {
	// Validate the record
	if err := record.Validate(); err != nil {
		return fmt.Errorf("invalid record: %w", err)
	}

	// Check for duplicates
	exists, err := s.repo.Exists(ctx, record.Date, record.Description, record.Amount)
	if err != nil {
		return fmt.Errorf("failed to check for duplicates: %w", err)
	}

	if exists {
		return fmt.Errorf("duplicate record: a record with the same date, description, and amount already exists")
	}

	// Create the record
	if err := s.repo.Create(ctx, record); err != nil {
		return fmt.Errorf("failed to create record: %w", err)
	}

	return nil
}

// GetRecord retrieves a record by ID
func (s *RecordService) GetRecord(ctx context.Context, id int64) (*domain.Record, error) {
	return s.repo.FindByID(ctx, id)
}

// ListRecords retrieves all records with optional filters
func (s *RecordService) ListRecords(ctx context.Context, filter domain.RecordFilter) ([]domain.Record, error) {
	return s.repo.FindAll(ctx, filter)
}

// DeleteRecord deletes a record by ID
func (s *RecordService) DeleteRecord(ctx context.Context, id int64) error {
	return s.repo.Delete(ctx, id)
}

// ImportRecords imports records from a file
func (s *RecordService) ImportRecords(ctx context.Context, reader io.Reader, provider string, accountID string) (*ImportResult, error) {
	// Get the appropriate parser
	parser, ok := s.parsers[provider]
	if !ok {
		return nil, fmt.Errorf("unknown provider: %s", provider)
	}

	// Parse the file
	batch, err := parser.Parse(reader, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to parse file: %w", err)
	}

	result := &ImportResult{
		TotalRecords:      len(batch.Records),
		ImportedRecords:   0,
		DuplicateRecords:  0,
		FailedRecords:     0,
		Errors:            []string{},
	}

	// Import each record
	for _, record := range batch.Records {
		// Check for duplicates
		exists, err := s.repo.Exists(ctx, record.Date, record.Description, record.Amount)
		if err != nil {
			result.FailedRecords++
			result.Errors = append(result.Errors, fmt.Sprintf("Failed to check duplicate for record: %v", err))
			continue
		}

		if exists {
			result.DuplicateRecords++
			continue
		}

		// Create the record
		if err := s.repo.Create(ctx, &record); err != nil {
			result.FailedRecords++
			result.Errors = append(result.Errors, fmt.Sprintf("Failed to create record: %v", err))
			continue
		}

		result.ImportedRecords++
	}

	return result, nil
}

// GetDashboardSummary retrieves dashboard summary data
func (s *RecordService) GetDashboardSummary(ctx context.Context, filter domain.RecordFilter) (*domain.DashboardSummary, error) {
	return s.repo.GetDashboardSummary(ctx, filter)
}

// ImportResult contains the result of an import operation
type ImportResult struct {
	TotalRecords     int      `json:"totalRecords"`
	ImportedRecords  int      `json:"importedRecords"`
	DuplicateRecords int      `json:"duplicateRecords"`
	FailedRecords    int      `json:"failedRecords"`
	Errors           []string `json:"errors,omitempty"`
}
