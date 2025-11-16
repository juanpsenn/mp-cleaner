# Transaction Parser

A modular and extensible Python application for parsing and cleaning transaction logs from different banking providers.

## Features

- **Modular Architecture**: Built using the Template Method design pattern for easy extensibility
- **Multiple Provider Support**: Currently supports Santander and MercadoPago, easily extensible for other banks
- **Currency Support**: Handles ARS and USD transactions separately
- **Data Cleaning**: Automatically cleans and formats transaction data
- **CSV Export**: Exports processed transactions to clean CSV files
- **CLI Interface**: Easy-to-use command-line interface

## Supported Providers

- **Santander**: Parses Excel (.xlsx) files with card transactions
- **MercadoPago**: Parses CSV files with transaction history

## Installation

### Using pip

```bash
# Install dependencies
pip install -r requirements.txt

# Install the package in development mode
pip install -e .
```

### Using a virtual environment (recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Usage

### Interactive Terminal UI (Recommended)

The easiest way to use the transaction parser is through the interactive TUI:

```bash
# Run the interactive TUI
python -m transaction_parser.tui

# Or if installed via pip:
transaction-parser-tui
```

The TUI will guide you through:
1. **Provider selection** - Choose from available providers with autocomplete
2. **Input file selection** - Select your file with Tab autocomplete
3. **Output folder selection** - Choose where to save results with Tab autocomplete
4. **Processing** - Automatic parsing and CSV generation with progress feedback

**Features:**
- ✓ Tab autocomplete for file paths (like Claude Code)
- ✓ Input validation with helpful error messages
- ✓ Visual feedback and colored output
- ✓ Option to process multiple files sequentially

### Command Line Interface

For scripting and automation, use the CLI:

```bash
# Parse Santander Excel file
python -m transaction_parser.cli santander santander.xlsx

# Parse MercadoPago CSV file
python -m transaction_parser.cli mercadopago mercadopago.csv

# Specify custom output directory
python -m transaction_parser.cli santander santander.xlsx -o output/

# Specify custom filename pattern
python -m transaction_parser.cli mercadopago mercadopago.csv -p "mp_{currency}.csv"

# Enable verbose output
python -m transaction_parser.cli santander santander.xlsx -v
```

### As a Python Module

```python
from transaction_parser import SantanderParser, MercadoPagoParser

# Parse Santander transactions
parser = SantanderParser('santander.xlsx')
batches = parser.parse()

# Export to CSV
output_files = parser.export_to_csv(batches, output_dir='output/')

# Access transactions programmatically
for currency, batch in batches.items():
    print(f"{currency.value}: {len(batch)} transactions")
    for transaction in batch.transactions:
        print(f"  {transaction}")
```

## Architecture

The application follows the **Template Method** design pattern:

```
transaction_parser/
├── models.py              # Data models (Transaction, TransactionBatch, Currency)
├── parsers/
│   ├── base.py            # Abstract base parser (Template Method)
│   ├── santander.py       # Santander-specific implementation
│   └── mercadopago.py     # MercadoPago-specific implementation
└── cli.py                 # Command-line interface
```

### Key Components

1. **Transaction Model**: Represents a single financial transaction with date, description, amount, and currency
2. **TransactionBatch**: Groups transactions by currency
3. **TransactionParser (Abstract)**: Defines the template method for parsing
4. **Provider-Specific Parsers**: Implement provider-specific parsing logic

### Template Method Pattern

The `TransactionParser` base class defines the parsing workflow:

1. Read the file (`read_file()` - abstract)
2. Extract transactions (`extract_transactions()` - abstract)
3. Validate transactions (`validate_transactions()` - can be overridden)
4. Group by currency (`group_by_currency()` - implemented)
5. Export to CSV (`export_to_csv()` - implemented)

## Adding a New Provider

To add support for a new banking provider:

1. Create a new parser class in `transaction_parser/parsers/`:

```python
from .base import TransactionParser
from ..models import Transaction, Currency

class NewBankParser(TransactionParser):
    def get_provider_name(self) -> str:
        return "newbank"

    def read_file(self) -> Any:
        # Implement file reading logic
        pass

    def extract_transactions(self, raw_data: Any) -> list[Transaction]:
        # Implement transaction extraction logic
        pass
```

2. Register the parser in `cli.py`:

```python
PARSERS = {
    'santander': SantanderParser,
    'mercadopago': MercadoPagoParser,
    'newbank': NewBankParser,  # Add your parser here
}
```

## Provider-Specific Details

### Santander Parser

- **Input Format**: Excel (.xlsx) files
- **Features**:
  - Extracts transactions from multiple card sections
  - Handles installment payments (cuotas)
  - Supports both ARS and USD transactions
  - Adds one day to transaction dates
  - Negates amounts (converts debits to negative values)

### MercadoPago Parser

- **Input Format**: CSV files with specific structure (first 3 rows skipped, 4th row is header)
- **Features**:
  - Auto-detects CSV separator (comma or semicolon)
  - Cleans transaction types (removes "Transferencia enviada/recibida")
  - Converts Argentine number format (dots for thousands, comma for decimals)
  - Adds one day to transaction dates
  - Converts amounts to integers (removes decimals)

## Output Format

All parsers generate CSV files with the following structure:

```csv
date,description,amount
01/01/2024,"Transaction description",1000
02/01/2024,"Another transaction",-500
```

- **date**: Formatted as DD/MM/YYYY
- **description**: Properly quoted to handle commas and special characters
- **amount**: Numeric value (negative for debits, positive for credits)

Files are named using the pattern: `transactions_{currency}.csv` (e.g., `transactions_ars.csv`, `transactions_usd.csv`)

## Requirements

- Python 3.10 or higher
- pandas >= 2.0.0
- openpyxl >= 3.1.0
- prompt_toolkit >= 3.0.0 (for TUI)

## Best Practices

This project follows Python best practices:

- **Type Hints**: All functions include type annotations
- **Docstrings**: Comprehensive documentation for all classes and methods
- **Separation of Concerns**: Clear separation between models, parsers, and CLI
- **DRY Principle**: Common logic is centralized in the base class
- **Open/Closed Principle**: Open for extension (new parsers) but closed for modification
- **Single Responsibility**: Each class has a single, well-defined purpose

## License

MIT License
