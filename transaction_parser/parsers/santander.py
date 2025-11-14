"""
Santander-specific transaction parser.
"""

import pandas as pd
import re
from datetime import datetime, timedelta
from typing import Any

from .base import TransactionParser
from ..models import Transaction, Currency


class SantanderParser(TransactionParser):
    """Parser for Santander Excel transaction files."""

    def get_provider_name(self) -> str:
        """Get the provider name."""
        return "santander"

    def read_file(self) -> pd.DataFrame:
        """
        Read Santander Excel file.

        Returns:
            DataFrame with raw Excel data (no headers)
        """
        return pd.read_excel(self.file_path, header=None)

    def _sanitize_amount(self, value: Any) -> float | None:
        """
        Sanitize and negate amount values.

        Handles formats like: $28.640,00 or U$D4,82 or US$-29,34
        Returns negated float value or None if no value.

        Args:
            value: Raw amount value from Excel

        Returns:
            Negated float amount or None
        """
        if pd.isna(value) or value == '':
            return None

        # Convert to string if not already
        value_str = str(value).strip()

        # Remove currency symbols and spaces
        value_str = re.sub(r'[U$DS\s]', '', value_str)

        # Replace comma with dot for decimal separator
        value_str = value_str.replace('.', '').replace(',', '.')

        try:
            # Convert to float and negate
            amount = float(value_str)
            return -amount
        except ValueError:
            return None

    def _format_date_plus_one(self, date_value: Any) -> datetime | None:
        """
        Parse date and add 1 day.

        Args:
            date_value: Raw date value from Excel

        Returns:
            Date with one day added, or None if invalid
        """
        if pd.isna(date_value):
            return None

        # Parse the date
        if isinstance(date_value, str):
            date_obj = datetime.strptime(date_value, '%d/%m/%Y')
        else:
            date_obj = pd.to_datetime(date_value)

        # Add 1 day
        return date_obj + timedelta(days=1)

    def _build_description(self, cuotas: Any, descripcion: Any, comprobante: Any) -> str:
        """
        Build description by concatenating Descripción + Cuotas + Comprobante.

        Only includes non-empty parts.

        Examples:
            - "Optica Panorama - 04/06 - 0000250"
            - "Personal Flow - 00008940"
            - "One market-one market" (when cuotas/comprobante are empty)

        Args:
            cuotas: Installment information
            descripcion: Main description
            comprobante: Receipt/voucher number

        Returns:
            Formatted description string
        """
        parts = []

        # Add descripcion (main description)
        if pd.notna(descripcion) and descripcion != '':
            desc_str = str(descripcion).strip()
            # Remove trailing " - " if present
            if desc_str.endswith(' - '):
                desc_str = desc_str[:-3]
            if desc_str and desc_str != '-':
                parts.append(desc_str)

        # Add cuotas if exists and not empty
        if pd.notna(cuotas) and str(cuotas).strip() not in ('', '-'):
            parts.append(str(cuotas).strip())

        # Add comprobante if exists and not empty
        if pd.notna(comprobante) and str(comprobante).strip() not in ('', '-'):
            parts.append(str(comprobante).strip())

        return ' - '.join(parts)

    def _extract_transactions_from_section(
        self,
        df: pd.DataFrame,
        start_row: int
    ) -> list[Transaction]:
        """
        Extract transactions from a section starting at start_row.

        Args:
            df: DataFrame containing the Excel data
            start_row: Row index where the section starts

        Returns:
            List of Transaction objects
        """
        transactions = []

        # Find the header row (should contain "Fecha", "Descripción", etc.)
        header_row = None
        for i in range(start_row, min(start_row + 10, len(df))):
            row = df.iloc[i]
            if 'Fecha' in str(row.iloc[0]) or 'Fecha' in str(row.iloc[1]):
                header_row = i
                break

        if header_row is None:
            return transactions

        # Start reading data from the next row
        data_start = header_row + 1

        # Keep track of last valid date for rows with empty date cells
        last_valid_date = None

        # Read until we hit an empty row or another section
        for i in range(data_start, len(df)):
            row = df.iloc[i]

            # Check if we've hit a new section or empty rows
            first_cell = str(row.iloc[0]).strip() if pd.notna(row.iloc[0]) else ''
            if first_cell.startswith('Tarjeta de') or first_cell.startswith('Pago de') or first_cell.startswith('Últimos'):
                break

            # Check if row has date (column A or B might have it)
            fecha = None
            col_offset = 0

            if pd.notna(row.iloc[0]) and '/' in str(row.iloc[0]):
                fecha = row.iloc[0]
                col_offset = 0
                last_valid_date = fecha  # Update last valid date
            elif pd.notna(row.iloc[1]) and '/' in str(row.iloc[1]):
                fecha = row.iloc[1]
                col_offset = 1
                last_valid_date = fecha  # Update last valid date
            else:
                # No date in this row, use last valid date
                fecha = last_valid_date
                col_offset = 0

            if fecha is None:
                continue

            # Extract columns based on offset
            descripcion = row.iloc[1 + col_offset] if len(row) > 1 + col_offset else ''
            cuotas = row.iloc[2 + col_offset] if len(row) > 2 + col_offset else ''
            comprobante = row.iloc[3 + col_offset] if len(row) > 3 + col_offset else ''
            monto_pesos = row.iloc[4 + col_offset] if len(row) > 4 + col_offset else ''
            monto_dolares = row.iloc[5 + col_offset] if len(row) > 5 + col_offset else ''

            # Skip if descripcion is empty (likely an empty row)
            if pd.isna(descripcion) or str(descripcion).strip() == '':
                continue

            # Parse date
            parsed_date = self._format_date_plus_one(fecha)
            if parsed_date is None:
                continue

            # Build description
            description = self._build_description(cuotas, descripcion, comprobante)

            # Create transactions for ARS
            amount_ars = self._sanitize_amount(monto_pesos)
            if amount_ars is not None:
                transactions.append(Transaction(
                    date=parsed_date,
                    description=description,
                    amount=amount_ars,
                    currency=Currency.ARS,
                    raw_data={
                        'cuotas': cuotas,
                        'descripcion': descripcion,
                        'comprobante': comprobante
                    }
                ))

            # Create transactions for USD
            amount_usd = self._sanitize_amount(monto_dolares)
            if amount_usd is not None:
                transactions.append(Transaction(
                    date=parsed_date,
                    description=description,
                    amount=amount_usd,
                    currency=Currency.USD,
                    raw_data={
                        'cuotas': cuotas,
                        'descripcion': descripcion,
                        'comprobante': comprobante
                    }
                ))

        return transactions

    def extract_transactions(self, raw_data: pd.DataFrame) -> list[Transaction]:
        """
        Extract all transactions from the Santander Excel file.

        Includes "Pago de tarjeta y devoluciones" and all "Tarjeta de" sections.

        Args:
            raw_data: DataFrame with raw Excel data

        Returns:
            List of all Transaction objects
        """
        all_transactions = []

        # Find all sections
        for i, row in raw_data.iterrows():
            row_str = ' '.join([str(cell) for cell in row if pd.notna(cell)])

            # Check for "Pago de tarjeta y devoluciones"
            if 'Pago de tarjeta y devoluciones' in row_str:
                transactions = self._extract_transactions_from_section(raw_data, i)
                all_transactions.extend(transactions)

            # Check for "Tarjeta de" sections
            elif 'Tarjeta de' in row_str and 'terminada en' in row_str:
                transactions = self._extract_transactions_from_section(raw_data, i)
                all_transactions.extend(transactions)

        return all_transactions
