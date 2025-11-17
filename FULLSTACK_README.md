# Financial Record Tracker - Full-Stack Application

A modern full-stack web application for tracking financial records, importing bank transactions, and visualizing spending habits.

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 15 (React 18) with TypeScript
- **Backend**: Go 1.21+ with Hexagonal Architecture
- **Database**: SQLite
- **Charts**: Recharts
- **Styling**: Tailwind CSS

### Project Structure

```
mp-cleaner/
├── backend/                  # Go backend
│   ├── cmd/
│   │   └── api/
│   │       └── main.go      # Application entry point
│   └── internal/
│       ├── domain/          # Core business logic & interfaces
│       │   ├── record.go
│       │   ├── repository.go
│       │   └── parser.go
│       ├── application/     # Use cases & services
│       │   └── record_service.go
│       └── adapters/        # Infrastructure implementations
│           ├── repository/
│           │   └── sqlite/
│           │       └── record_repository.go
│           ├── parser/
│           │   ├── mercadopago.go
│           │   └── santander.go
│           └── http/
│               ├── handler.go
│               └── router.go
├── frontend/                # Next.js frontend
│   ├── app/
│   │   ├── page.tsx        # Dashboard
│   │   ├── records/        # Records list
│   │   ├── create/         # Create record form
│   │   └── import/         # Import page
│   ├── components/
│   │   └── Navigation.tsx
│   └── lib/
│       └── api.ts          # API client
└── python/                  # Legacy Python CLI (for reference)
```

## 🚀 Getting Started

### Prerequisites

- **Go 1.21+** - [Download](https://golang.org/dl/)
- **Node.js 18+** and npm - [Download](https://nodejs.org/)
- **Git**

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Go dependencies:
   ```bash
   go mod download
   ```

3. Build the backend:
   ```bash
   go build -o bin/api ./cmd/api
   ```

4. Run the backend:
   ```bash
   # Default configuration (port 8080, database ./records.db)
   ./bin/api

   # Or with custom configuration
   PORT=8080 DB_PATH=./records.db ./bin/api
   ```

The backend will start on `http://localhost:8080`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` to configure the API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`.

## 📚 API Endpoints

### Records

- **POST** `/api/records` - Create a new record
  ```json
  {
    "date": "2024-11-15T00:00:00Z",
    "description": "Coffee shop",
    "amount": -5.50,
    "currency": "ARS",
    "accountId": "my-account",
    "category": "Food"
  }
  ```

- **GET** `/api/records` - List all records
  - Query params: `accountId`, `sortBy` (date|description), `sortOrder` (asc|desc)

- **GET** `/api/records/export` - Export records as CSV
  - Query params: `accountId`

- **DELETE** `/api/records/{id}` - Delete a record

### Import

- **POST** `/api/import` - Import records from a bank file
  - Form data:
    - `file`: The bank file (CSV for MercadoPago, XLSX for Santander)
    - `provider`: Bank provider (`mercadopago` or `santander`)
    - `accountId`: Account identifier

### Dashboard

- **GET** `/api/dashboard/summary` - Get aggregated spending data
  - Query params: `accountId`, `startDate`, `endDate`, `currency`
  - Returns: totals, category breakdown, monthly trends, top expenses

### Health

- **GET** `/health` - Health check endpoint

## 🏦 Supported Banks

### MercadoPago

- **File Format**: CSV
- **Expected Columns**:
  - `RELEASE_DATE` - Transaction date (DD-MM-YYYY)
  - `TRANSACTION_TYPE` - Type of transaction
  - `REFERENCE_ID` - Reference identifier
  - `TRANSACTION_NET_AMOUNT` - Amount (Argentine format: 1.234,56)
- **Notes**:
  - First 3 rows are skipped (metadata)
  - Row 4 contains headers
  - Only supports ARS currency
  - Dates are adjusted by +1 day
  - Decimals are removed from amounts

### Santander

- **File Format**: Excel (.xlsx)
- **Expected Columns**:
  - `Fecha` - Transaction date
  - `Descripción` - Description
  - `Cuotas` - Installments
  - `Comprobante` - Receipt number
  - `$` (ARS) - Amount in pesos
  - `U$D` (USD) - Amount in dollars
- **Notes**:
  - Supports multiple card sections in one file
  - Supports both ARS and USD currencies
  - Dates are adjusted by +1 day
  - Amounts are negated (expenses become negative)

## 🔒 Features

### Duplicate Prevention

The application automatically prevents duplicate records using a composite unique constraint on:
- Date
- Description
- Amount

If you try to import or create a duplicate record, it will be rejected with a clear error message.

### Data Import

1. Navigate to the **Import** page
2. Select your bank provider (MercadoPago or Santander)
3. Enter an account ID to identify the source
4. Upload your bank file
5. Review the import results:
   - Total records found
   - Successfully imported
   - Duplicates skipped
   - Failed records (with error details)

### Dashboard

The dashboard provides comprehensive financial insights:

- **Summary Cards**: Total spent, received, balance, and transaction count
- **Spending by Category**: Pie chart showing distribution
- **Monthly Trend**: Line chart of spending over time
- **Top Expenses**: Table of largest expenses

### Records Management

- **View All Records**: Sortable table with filtering
- **Sort**: By date or description (ascending/descending)
- **Filter**: By account ID
- **Export**: Download all records as CSV
- **Create**: Manually add individual records

## 🏛️ Hexagonal Architecture

The backend follows hexagonal architecture (ports and adapters pattern):

### Domain Layer (`internal/domain`)
- **Pure business logic**
- Entities: `Record`, `RecordBatch`
- Ports (interfaces): `RecordRepository`, `Parser`
- No external dependencies

### Application Layer (`internal/application`)
- **Use cases and orchestration**
- `RecordService`: Coordinates repository and parsers
- Implements business rules (e.g., duplicate prevention)

### Adapters Layer (`internal/adapters`)
- **Infrastructure implementations**
- **Repository Adapter** (SQLite): Persistence
- **Parser Adapters** (MercadoPago, Santander): File parsing
- **HTTP Adapter**: REST API endpoints

### Benefits
- **Testable**: Core logic isolated from infrastructure
- **Flexible**: Easy to swap implementations (e.g., PostgreSQL instead of SQLite)
- **Maintainable**: Clear separation of concerns

## 🧪 Testing the Application

### Test Backend Endpoints

1. Health check:
   ```bash
   curl http://localhost:8080/health
   ```

2. Create a record:
   ```bash
   curl -X POST http://localhost:8080/api/records \
     -H "Content-Type: application/json" \
     -d '{
       "date": "2024-11-15T00:00:00Z",
       "description": "Test Expense",
       "amount": -100.50,
       "currency": "ARS",
       "accountId": "test-account"
     }'
   ```

3. Get all records:
   ```bash
   curl http://localhost:8080/api/records
   ```

4. Get dashboard summary:
   ```bash
   curl http://localhost:8080/api/dashboard/summary
   ```

## 🔧 Configuration

### Backend Environment Variables

- `PORT` - Server port (default: 8080)
- `DB_PATH` - SQLite database path (default: ./records.db)

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080)

## 📦 Production Deployment

### Backend

1. Build the binary:
   ```bash
   cd backend
   go build -o api ./cmd/api
   ```

2. Run with production settings:
   ```bash
   PORT=8080 DB_PATH=/var/lib/financial-tracker/records.db ./api
   ```

### Frontend

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

Or deploy to Vercel:
```bash
vercel deploy --prod
```

## 🛠️ Development

### Backend Development

- Run with auto-reload (using Air):
  ```bash
  go install github.com/cosmtrek/air@latest
  air
  ```

- Run tests:
  ```bash
  go test ./...
  ```

### Frontend Development

- Run development server:
  ```bash
  npm run dev
  ```

- Type checking:
  ```bash
  npm run type-check
  ```

- Linting:
  ```bash
  npm run lint
  ```

## 📝 Data Models

### Record Entity

```go
type Record struct {
    ID          int64     // Auto-generated
    Date        time.Time // Transaction date
    Description string    // Transaction description
    Amount      float64   // Negative for expenses, positive for income
    Currency    Currency  // ARS or USD
    AccountID   string    // Account identifier
    Category    string    // Optional category
    CreatedAt   time.Time // Timestamp
}
```

### Currencies

- `ARS` - Argentine Peso
- `USD` - US Dollar

## 🚦 CORS Configuration

The backend includes CORS middleware that allows all origins by default. For production, you should restrict this to your frontend domain.

## 🐛 Troubleshooting

### Backend won't start

- Check if port 8080 is already in use
- Verify Go version: `go version` (requires 1.21+)
- Check database permissions if using a custom DB_PATH

### Frontend can't connect to backend

- Verify backend is running: `curl http://localhost:8080/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Look for CORS errors in browser console

### Import fails

- Verify file format matches the selected provider
- Check that the file has the expected structure
- Review error messages in the import results

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📧 Support

For questions or issues, please open a GitHub issue.
