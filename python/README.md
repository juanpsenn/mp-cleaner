# Transaction Parser - Python CLI

Python command-line tool for parsing Santander and MercadoPago transaction files.

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or use virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### Interactive TUI (Easiest)

```bash
python -m transaction_parser.tui
```

The TUI provides:
- Tab autocomplete for file paths
- Interactive provider selection
- Visual feedback and progress
- Error validation

### Command Line

```bash
# Basic usage
python -m transaction_parser.cli santander transactions.xlsx
python -m transaction_parser.cli mercadopago transactions.csv

# Custom output directory
python -m transaction_parser.cli santander file.xlsx -o output/

# Custom filename pattern
python -m transaction_parser.cli mercadopago file.csv -p "mp_{currency}.csv"

# Verbose output
python -m transaction_parser.cli santander file.xlsx -v
```

### As a Python Module

```python
from transaction_parser import SantanderParser, MercadoPagoParser

# Parse Santander file
parser = SantanderParser('transactions.xlsx')
batches = parser.parse()

# Export to CSV
output_files = parser.export_to_csv(batches, output_dir='output/')

# Access transactions
for currency, batch in batches.items():
    print(f"{currency.value}: {len(batch)} transactions")
    for transaction in batch.transactions:
        print(f"  {transaction}")
```

## Architecture

Built using the **Template Method** design pattern:

- `models.py` - Data models (Transaction, TransactionBatch, Currency)
- `parsers/base.py` - Abstract base parser
- `parsers/santander.py` - Santander implementation
- `parsers/mercadopago.py` - MercadoPago implementation
- `cli.py` - Command-line interface
- `tui.py` - Interactive terminal UI

## Adding a New Bank

1. Create parser in `transaction_parser/parsers/new_bank.py`:

```python
from .base import TransactionParser
from ..models import Transaction, Currency

class NewBankParser(TransactionParser):
    def get_provider_name(self) -> str:
        return "newbank"

    def read_file(self) -> Any:
        # Implement file reading
        pass

    def extract_transactions(self, raw_data: Any) -> list[Transaction]:
        # Implement extraction logic
        pass
```

2. Register in `cli.py`:

```python
PARSERS = {
    'santander': SantanderParser,
    'mercadopago': MercadoPagoParser,
    'newbank': NewBankParser,  # Add here
}
```

## Requirements

- Python 3.10+
- pandas >= 2.0.0
- openpyxl >= 3.1.0
- prompt_toolkit >= 3.0.0

## Documentation

See [../docs/PYTHON_README.md](../docs/PYTHON_README.md) for detailed documentation.
