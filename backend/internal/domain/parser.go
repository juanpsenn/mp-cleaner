package domain

import "io"

// Parser defines the interface for parsing bank files
type Parser interface {
	// Parse parses a file and returns a batch of records
	Parse(reader io.Reader, accountID string) (*RecordBatch, error)

	// GetProviderName returns the name of the provider
	GetProviderName() string
}
