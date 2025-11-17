package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/juanpsenn/mp-cleaner/backend/internal/adapters/parser"
	httpAdapter "github.com/juanpsenn/mp-cleaner/backend/internal/adapters/http"
	"github.com/juanpsenn/mp-cleaner/backend/internal/adapters/repository/sqlite"
	"github.com/juanpsenn/mp-cleaner/backend/internal/application"
	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
)

func main() {
	// Get configuration from environment variables
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./records.db"
	}

	// Initialize repository
	repo, err := sqlite.NewRecordRepository(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize repository: %v", err)
	}

	// Initialize parsers
	parsers := map[string]domain.Parser{
		"mercadopago": parser.NewMercadoPagoParser(),
		"santander":   parser.NewSantanderParser(),
	}

	// Initialize service
	service := application.NewRecordService(repo, parsers)

	// Initialize HTTP handler
	handler := httpAdapter.NewHandler(service)

	// Create router
	router := httpAdapter.NewRouter(handler)

	// Start server
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server starting on %s", addr)
	log.Printf("Database: %s", dbPath)

	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
