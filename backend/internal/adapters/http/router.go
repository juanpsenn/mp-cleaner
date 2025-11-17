package http

import (
	"net/http"
	"strings"
)

// NewRouter creates a new HTTP router with CORS support
func NewRouter(handler *Handler) http.Handler {
	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("/api/records", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handler.CreateRecord(w, r)
		} else {
			handler.GetRecords(w, r)
		}
	})
	mux.HandleFunc("/api/records/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/records" {
			if r.Method == http.MethodPost {
				handler.CreateRecord(w, r)
			} else {
				handler.GetRecords(w, r)
			}
			return
		}
		if r.URL.Path == "/api/records/export" {
			handler.ExportRecords(w, r)
			return
		}
		if strings.HasPrefix(r.URL.Path, "/api/records/") && r.Method == http.MethodDelete {
			handler.DeleteRecord(w, r)
			return
		}
		http.NotFound(w, r)
	})

	mux.HandleFunc("/api/import", handler.ImportRecords)
	mux.HandleFunc("/api/dashboard/summary", handler.GetDashboardSummary)

	// Health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Wrap with CORS middleware
	return corsMiddleware(mux)
}

// corsMiddleware adds CORS headers to all responses
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
