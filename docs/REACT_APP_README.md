# Transaction Parser React App

A modern, browser-based React application for parsing and exporting bank transactions from Santander and MercadoPago files.

## Features

- **Modern React UI**: Beautiful, responsive interface built with React 18
- **Bank Support**:
  - Santander Excel (.xlsx) files
  - MercadoPago CSV files
- **Real-time Processing**: Client-side file processing with instant feedback
- **Multiple Export Options**:
  - Copy transactions to clipboard (CSV format)
  - Download as CSV file
- **Currency Separation**: Automatically separates ARS and USD transactions
- **Transaction Preview**: Preview up to 10 transactions before export
- **No Backend Required**: 100% client-side processing for privacy and speed

## Usage

### Quick Start

1. Open `transaction-parser-app.html` in any modern web browser
2. Select your bank (Santander or MercadoPago)
3. Upload your transaction file
4. Click "Process File"
5. View results and export using "Copy to Clipboard" or "Download CSV"

### Supported File Formats

#### Santander
- **Format**: Excel (.xlsx)
- **Features**:
  - Extracts transactions from multiple card sections
  - Handles installment payments (cuotas)
  - Supports both ARS and USD
  - Adds one day to transaction dates
  - Negates amounts (converts debits to negative)

#### MercadoPago
- **Format**: CSV with specific structure
- **Features**:
  - Auto-detects CSV separator (comma or semicolon)
  - Cleans transaction types
  - Converts Argentine number format
  - Adds one day to transaction dates
  - Converts amounts to integers

## Technical Details

### Architecture

The app is built as a single self-contained HTML file with:
- React 18 for UI
- Babel for JSX transformation
- SheetJS (xlsx) library for Excel parsing
- Native JavaScript for CSV parsing
- Modern CSS with gradients and animations

### Parser Logic

The application follows the Template Method design pattern (ported from the original Python implementation):

1. **BaseParser**: Abstract class defining the parsing workflow
   - `readFile()`: Read and parse the file
   - `extractTransactions()`: Extract transaction data
   - `validateTransactions()`: Filter invalid transactions
   - `groupByCurrency()`: Organize by currency

2. **SantanderParser**: Santander-specific implementation
   - Reads Excel files using SheetJS
   - Extracts from "Tarjeta de" and "Pago de tarjeta" sections
   - Handles date formatting and amount negation
   - Builds descriptions from multiple columns

3. **MercadoPagoParser**: MercadoPago-specific implementation
   - Custom CSV parsing (handles quoted fields)
   - Auto-detects separators
   - Cleans transaction types
   - Converts Argentine number format

### Output Format

All exports use CSV format:
```csv
date,description,amount
01/01/2024,"Transaction description",1000
02/01/2024,"Another transaction",-500
```

- **date**: DD/MM/YYYY format
- **description**: Quoted to handle commas
- **amount**: Numeric (negative for debits, positive for credits)

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- ES6+ support
- FileReader API
- Clipboard API (for copy functionality)

## Privacy & Security

- **100% Client-Side**: All file processing happens in your browser
- **No Server Upload**: Files never leave your computer
- **No Data Storage**: No data is stored or transmitted
- **Open Source**: Full source code visible in the HTML file

## Comparison with Python Version

### Advantages
- ✅ No installation required
- ✅ Works on any OS with a browser
- ✅ Modern, intuitive UI
- ✅ Instant processing
- ✅ No dependencies to install

### Python Version Advantages
- ✅ Command-line automation
- ✅ Batch processing
- ✅ Scriptable workflows

## Development

The app is a single HTML file for easy distribution. To modify:

1. Edit `transaction-parser-app.html`
2. The main components are:
   - **Styles**: CSS in `<style>` tag
   - **Parser Classes**: JavaScript classes implementing the parsing logic
   - **React App**: Main UI component in JSX
3. Open in browser to test

## Examples

### Processing Santander File
1. Select "Santander" from bank dropdown
2. Upload your `.xlsx` file
3. Click "Process File"
4. View separated ARS and USD transactions
5. Export as needed

### Processing MercadoPago File
1. Select "MercadoPago" from bank dropdown
2. Upload your `.csv` file
3. Click "Process File"
4. View ARS transactions
5. Copy or download results

## Troubleshooting

**File not processing?**
- Ensure you selected the correct bank
- Check file format (.xlsx for Santander, .csv for MercadoPago)
- Verify file is not corrupted

**No transactions showing?**
- Check if file has expected structure
- For MercadoPago: Ensure CSV has at least 4 rows with headers on row 4

**Copy to clipboard not working?**
- Ensure you're using HTTPS or localhost
- Check browser permissions for clipboard access

## License

MIT License - Same as the original Python project
