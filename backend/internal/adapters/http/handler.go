package http

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/juanpsenn/mp-cleaner/backend/internal/application"
	"github.com/juanpsenn/mp-cleaner/backend/internal/domain"
)

// Handler handles HTTP requests
type Handler struct {
	service *application.RecordService
}

// NewHandler creates a new HTTP handler
func NewHandler(service *application.RecordService) *Handler {
	return &Handler{service: service}
}

// CreateRecord handles POST /api/records
func (h *Handler) CreateRecord(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var record domain.Record
	if err := json.NewDecoder(r.Body).Decode(&record); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.service.CreateRecord(r.Context(), &record); err != nil {
		if err.Error() == "duplicate record: a record with the same date, description, and amount already exists" {
			respondError(w, err.Error(), http.StatusConflict)
			return
		}
		respondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, record, http.StatusCreated)
}

// GetRecords handles GET /api/records
func (h *Handler) GetRecords(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	filter := domain.RecordFilter{
		AccountID: r.URL.Query().Get("accountId"),
		SortBy:    r.URL.Query().Get("sortBy"),
		SortOrder: r.URL.Query().Get("sortOrder"),
	}

	// Parse date filters
	if startDateStr := r.URL.Query().Get("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err == nil {
			filter.StartDate = &startDate
		}
	}

	if endDateStr := r.URL.Query().Get("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err == nil {
			filter.EndDate = &endDate
		}
	}

	// Parse currency filter
	if currencyStr := r.URL.Query().Get("currency"); currencyStr != "" {
		currency := domain.Currency(currencyStr)
		filter.Currency = &currency
	}

	records, err := h.service.ListRecords(r.Context(), filter)
	if err != nil {
		respondError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, records, http.StatusOK)
}

// ExportRecords handles GET /api/records/export
func (h *Handler) ExportRecords(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters (same as GetRecords)
	filter := domain.RecordFilter{
		AccountID: r.URL.Query().Get("accountId"),
		SortBy:    "date",
		SortOrder: "desc",
	}

	records, err := h.service.ListRecords(r.Context(), filter)
	if err != nil {
		respondError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set CSV headers
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=records.csv")

	// Write CSV
	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Write header
	if err := writer.Write([]string{"date", "description", "amount", "currency", "accountId", "category"}); err != nil {
		respondError(w, "Failed to write CSV header", http.StatusInternalServerError)
		return
	}

	// Write records
	for _, record := range records {
		row := []string{
			record.Date.Format("02/01/2006"),
			record.Description,
			fmt.Sprintf("%.2f", record.Amount),
			string(record.Currency),
			record.AccountID,
			record.Category,
		}
		if err := writer.Write(row); err != nil {
			respondError(w, "Failed to write CSV row", http.StatusInternalServerError)
			return
		}
	}
}

// ImportRecords handles POST /api/import
func (h *Handler) ImportRecords(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form
	if err := r.ParseMultipartForm(32 << 20); err != nil { // 32 MB max
		respondError(w, "Failed to parse form", http.StatusBadRequest)
		return
	}

	// Get file from form
	file, _, err := r.FormFile("file")
	if err != nil {
		respondError(w, "Missing file in request", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Get provider and accountId from form
	provider := r.FormValue("provider")
	accountID := r.FormValue("accountId")

	if provider == "" {
		respondError(w, "Missing provider parameter", http.StatusBadRequest)
		return
	}

	if accountID == "" {
		respondError(w, "Missing accountId parameter", http.StatusBadRequest)
		return
	}

	// Import records
	result, err := h.service.ImportRecords(r.Context(), file, provider, accountID)
	if err != nil {
		respondError(w, err.Error(), http.StatusBadRequest)
		return
	}

	respondJSON(w, result, http.StatusOK)
}

// GetDashboardSummary handles GET /api/dashboard/summary
func (h *Handler) GetDashboardSummary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	filter := domain.RecordFilter{
		AccountID: r.URL.Query().Get("accountId"),
	}

	// Parse date filters
	if startDateStr := r.URL.Query().Get("startDate"); startDateStr != "" {
		startDate, err := time.Parse(time.RFC3339, startDateStr)
		if err == nil {
			filter.StartDate = &startDate
		}
	}

	if endDateStr := r.URL.Query().Get("endDate"); endDateStr != "" {
		endDate, err := time.Parse(time.RFC3339, endDateStr)
		if err == nil {
			filter.EndDate = &endDate
		}
	}

	// Parse currency filter
	if currencyStr := r.URL.Query().Get("currency"); currencyStr != "" {
		currency := domain.Currency(currencyStr)
		filter.Currency = &currency
	}

	summary, err := h.service.GetDashboardSummary(r.Context(), filter)
	if err != nil {
		respondError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, summary, http.StatusOK)
}

// DeleteRecord handles DELETE /api/records/{id}
func (h *Handler) DeleteRecord(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from path
	idStr := r.URL.Path[len("/api/records/"):]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		respondError(w, "Invalid record ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteRecord(r.Context(), id); err != nil {
		respondError(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// respondJSON sends a JSON response
func respondJSON(w http.ResponseWriter, data interface{}, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// respondError sends an error response
func respondError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
