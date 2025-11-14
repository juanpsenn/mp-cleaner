# Quick Start Guide

Get started with Transaction Parser in 5 minutes!

## Installation

```bash
# 1. Navigate to the project directory
cd /home/juan/workspace/transactions

# 2. Create a virtual environment (recommended)
python -m venv venv

# 3. Activate the virtual environment
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. (Optional) Install the package
pip install -e .
```

## Run the TUI (Easiest Method)

```bash
# Run the interactive Terminal UI
python -m transaction_parser.tui

# Or use the launcher script
python run_tui.py

# Or if installed via pip
transaction-parser-tui
```

Follow the interactive prompts:
1. Select provider (santander or mercadopago)
2. Select input file (use Tab to autocomplete)
3. Select output folder (use Tab to autocomplete)
4. Done! Your CSV files will be generated

## Example: Parse Santander File

```bash
# Using TUI (recommended)
python -m transaction_parser.tui
# Then follow the prompts

# Using CLI (for scripting)
python -m transaction_parser.cli santander santander.xlsx
```

Output:
```
Extracted 150 transactions:
  - 120 ARS transactions
  - 30 USD transactions

Generated files:
  - ./transactions_ars.csv (120 transactions)
  - ./transactions_usd.csv (30 transactions)

Success!
```

## Example: Parse MercadoPago File

```bash
# Using TUI
python -m transaction_parser.tui

# Using CLI
python -m transaction_parser.cli mercadopago mercadopago.csv -o output/
```

## Example: Use as Python Module

```python
from transaction_parser import SantanderParser

# Parse transactions
parser = SantanderParser('santander.xlsx')
batches = parser.parse()

# Export to CSV
output_files = parser.export_to_csv(batches, output_dir='output/')

# Print results
for currency, path in output_files.items():
    print(f"{currency.value}: {path}")
```

## What's Next?

- Read [README.md](README.md) for full documentation
- Check [TUI_GUIDE.md](TUI_GUIDE.md) for TUI features and tips
- See [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for advanced examples
- Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand the design

## Need Help?

- **TUI not working?** Make sure `prompt_toolkit` is installed: `pip install prompt_toolkit`
- **Import errors?** Check you're in the virtual environment: `source venv/bin/activate`
- **File not found?** Use absolute paths or check your current directory

## Quick Reference

### Available Providers
- `santander` - Parses Excel (.xlsx) files
- `mercadopago` - Parses CSV (.csv) files

### TUI Keyboard Shortcuts
- **Tab** - Autocomplete file paths
- **Enter** - Confirm selection
- **Ctrl+C** - Exit

### CLI Commands
```bash
# Basic usage
python -m transaction_parser.cli <provider> <input_file>

# With options
python -m transaction_parser.cli <provider> <input_file> -o <output_dir> -v

# Help
python -m transaction_parser.cli --help
```

That's it! You're ready to parse transactions. 🚀
