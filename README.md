# Transaction Parser

Parse and export bank transactions from Santander and MercadoPago files with ease.

## 🚀 Quick Start

### Web App (Recommended)

Open `index.html` in your browser - no installation required!

**Features:**
- ✅ Upload Santander Excel (.xlsx) or MercadoPago CSV files
- ✅ Automatic currency separation (ARS/USD)
- ✅ Copy to clipboard or download as CSV
- ✅ 100% client-side - your data never leaves your computer

### Python CLI

For automation and batch processing:

```bash
cd python/
pip install -r requirements.txt

# Interactive TUI
python -m transaction_parser.tui

# Command line
python -m transaction_parser.cli santander file.xlsx
python -m transaction_parser.cli mercadopago file.csv
```

## 📋 Supported Banks

| Bank | Format | Features |
|------|--------|----------|
| **Santander** | Excel (.xlsx) | ARS & USD separation, installment handling |
| **MercadoPago** | CSV | Transaction cleaning, Argentine number format |

## 📁 Project Structure

```
├── index.html              # React web app (single file, no build needed)
├── python/                 # Python CLI implementation
│   ├── transaction_parser/ # Parser modules
│   ├── requirements.txt    # Python dependencies
│   └── ...
├── docs/                   # Documentation
│   ├── PYTHON_README.md    # Detailed Python docs
│   ├── REACT_APP_README.md # React app docs
│   └── ...
└── LICENSE
```

## 📖 Documentation

- **[React App Guide](docs/REACT_APP_README.md)** - Web app features and usage
- **[Python Guide](docs/PYTHON_README.md)** - CLI usage and API reference
- **[Quick Start](docs/QUICKSTART.md)** - Python installation guide
- **[Docker Setup](docs/DOCKER_README.md)** - Run in Docker container

## 💡 Output Format

All exports use standardized CSV format:

```csv
date,description,amount
01/11/2025,"Transferencia recibida JUAN PABLO SENN",3717187
02/11/2025,"Optica Panorama - 04/06",-28640
```

- **Date:** DD/MM/YYYY format
- **Description:** Transaction details
- **Amount:** Positive for credits, negative for debits

## 🔒 Privacy

The web app processes everything in your browser - no uploads, no tracking, no data storage.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Choose your preferred method:**
- 🌐 **Quick & Easy:** Open `index.html` in your browser
- 💻 **Automation:** Use the Python CLI in the `python/` folder
