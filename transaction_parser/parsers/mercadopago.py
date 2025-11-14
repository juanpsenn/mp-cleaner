"""
MercadoPago-specific transaction parser.
"""

import re
from datetime import datetime, timedelta

from .base import TransactionParser
from ..models import Transaction, Currency


class MercadoPagoParser(TransactionParser):
    """Parser for MercadoPago CSV transaction files."""

    def get_provider_name(self) -> str:
        """Get the provider name."""
        return "mercadopago"

    def read_file(self) -> list[dict]:
        """
        Read MercadoPago CSV file.

        The CSV has the following structure:
        - First 3 rows are skipped
        - 4th row contains headers
        - Data starts from row 5

        Returns:
            List of dictionaries representing rows
        """
        with open(self.file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        if len(lines) < 4:
            raise ValueError('CSV file must have at least 4 rows')

        # Get header from 4th row (index 3)
        header_line = lines[3].strip()

        # Get data from 5th row onwards (index 4+)
        data_lines = [line.strip() for line in lines[4:] if line.strip()]

        # Try to detect separator (comma or semicolon)
        separator = self._detect_separator(header_line)

        # Parse header
        headers = self._parse_csv_line(header_line, separator)

        # Parse data rows
        rows = []
        for line in data_lines:
            values = self._parse_csv_line(line, separator)
            if len(values) == len(headers):
                row = dict(zip(headers, values))
                rows.append(row)

        return rows

    def _detect_separator(self, line: str) -> str:
        """
        Detect whether the CSV uses comma or semicolon separator.

        Args:
            line: Sample CSV line (usually header)

        Returns:
            Detected separator (',' or ';')
        """
        # Count occurrences outside quotes
        comma_count = 0
        semicolon_count = 0
        in_quotes = False

        for char in line:
            if char == '"':
                in_quotes = not in_quotes
            elif not in_quotes:
                if char == ',':
                    comma_count += 1
                elif char == ';':
                    semicolon_count += 1

        return ';' if semicolon_count > comma_count else ','

    def _parse_csv_line(self, line: str, separator: str = ',') -> list[str]:
        """
        Parse a single CSV line, handling quoted values.

        Args:
            line: CSV line to parse
            separator: Separator character

        Returns:
            List of field values
        """
        result = []
        current = ''
        in_quotes = False

        for i, char in enumerate(line):
            if char == '"':
                if in_quotes and i + 1 < len(line) and line[i + 1] == '"':
                    # Escaped quote
                    current += '"'
                    i += 1
                else:
                    # Toggle quote state
                    in_quotes = not in_quotes
            elif char == separator and not in_quotes:
                # End of field
                result.append(current.strip())
                current = ''
            else:
                current += char

        # Add last field
        result.append(current.strip())

        return result

    def _convert_to_integer(self, argentine_amount: str) -> int | None:
        """
        Convert Argentine number format to integer.

        Examples:
            "1.809,09" -> 1809
            "-24.000,00" -> -24000
            "1.514,59" -> 1514

        Args:
            argentine_amount: Amount in Argentine format

        Returns:
            Integer amount (removes decimal part) or None
        """
        if not argentine_amount or not argentine_amount.strip():
            return None

        clean_amount = argentine_amount.strip()

        # Handle negative amounts
        is_negative = clean_amount.startswith('-')
        if is_negative:
            clean_amount = clean_amount[1:]

        # Remove dots (thousands separators) and split by comma (decimal separator)
        parts = clean_amount.replace('.', '').split(',')

        try:
            integer_part = int(parts[0]) if parts[0] else 0
            return -integer_part if is_negative else integer_part
        except ValueError:
            return None

    def _add_one_day_and_format(self, date_str: str) -> datetime | None:
        """
        Add one day to a date and return as datetime.

        Args:
            date_str: Date in DD-MM-YYYY format

        Returns:
            Date with one day added, or None if invalid
        """
        if not date_str or not date_str.strip():
            return None

        # Parse DD-MM-YYYY format
        parts = date_str.strip().split('-')
        if len(parts) != 3:
            return None

        try:
            day = int(parts[0])
            month = int(parts[1])
            year = int(parts[2])

            # Create date object
            date = datetime(year, month, day)

            # Add one day
            return date + timedelta(days=1)
        except (ValueError, IndexError):
            return None

    def _clean_transaction_type(self, transaction_type: str) -> str:
        """
        Clean transaction type by removing transfer prefixes.

        Args:
            transaction_type: Raw transaction type string

        Returns:
            Cleaned transaction type
        """
        if not transaction_type:
            return ''

        # Remove "Transferencia enviada" or "Transferencia recibida"
        cleaned = re.sub(
            r'transferencia\s+(enviada|recibida)\s*',
            '',
            transaction_type,
            flags=re.IGNORECASE
        )

        return cleaned.strip()

    def extract_transactions(self, raw_data: list[dict]) -> list[Transaction]:
        """
        Extract transactions from MercadoPago CSV data.

        Expected columns:
        - RELEASE_DATE: Transaction date
        - TRANSACTION_TYPE: Type of transaction
        - REFERENCE_ID: Reference identifier
        - TRANSACTION_NET_AMOUNT: Transaction amount

        Args:
            raw_data: List of dictionaries from CSV

        Returns:
            List of Transaction objects
        """
        transactions = []

        for row in raw_data:
            # Extract fields
            date_str = row.get('RELEASE_DATE', '').strip()
            transaction_type = row.get('TRANSACTION_TYPE', '').strip()
            reference_id = row.get('REFERENCE_ID', '').strip()
            amount_str = row.get('TRANSACTION_NET_AMOUNT', '').strip()

            # Skip if no date (empty rows)
            if not date_str:
                continue

            # Parse date
            parsed_date = self._add_one_day_and_format(date_str)
            if parsed_date is None:
                continue

            # Clean transaction type
            clean_type = self._clean_transaction_type(transaction_type)

            # Build description
            description_parts = []
            if clean_type:
                description_parts.append(clean_type)
            if reference_id:
                description_parts.append(reference_id)

            description = ' - '.join(description_parts) if description_parts else 'Transaction'

            # Convert amount
            amount = self._convert_to_integer(amount_str)
            if amount is None:
                continue

            # Create transaction (MercadoPago uses ARS currency)
            transactions.append(Transaction(
                date=parsed_date,
                description=description,
                amount=amount,
                currency=Currency.ARS,
                raw_data={
                    'transaction_type': transaction_type,
                    'reference_id': reference_id
                }
            ))

        return transactions
