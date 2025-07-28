# mp-cleaner
A web-based tool to clean and process MercadoPago transaction CSV files.

## What it does

- Processes MercadoPago CSV exports by skipping the first 3 summary rows
- Removes "Transferencia enviada/recibida" prefixes from transaction descriptions
- Combines transaction type and reference ID into a clean description format
- Converts Argentine number format (1.234,56) to integers (1234)
- Adds 1 day to all transaction dates
- Sorts transactions by date in descending order (newest first)
- Outputs a clean CSV ready for analysis

## Usage

1. Open `index.html` in your browser
2. Select your MercadoPago CSV file
3. Click "Process CSV"
4. Copy or download the cleaned results

## Input Format
```
RELEASE_DATE;TRANSACTION_TYPE;REFERENCE_ID;TRANSACTION_NET_AMOUNT;PARTIAL_BALANCE
22-07-2025;Transferencia enviada Area, Maria Lucia;119118545859;-24.000,00;1.801.838,67
```

## Output Format
```
fecha,descripcion,monto
23/07/2025,"Area, Maria Lucia - 119118545859",-24000
``` 
