"""
Base abstract parser implementing the Template Method pattern.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any
import csv

from ..models import Transaction, TransactionBatch, Currency


class TransactionParser(ABC):
    """
    Abstract base class for transaction parsers.

    This class implements the Template Method pattern, defining the skeleton
    of the parsing algorithm. Subclasses must implement specific steps.
    """

    def __init__(self, file_path: str | Path):
        """
        Initialize the parser.

        Args:
            file_path: Path to the file to parse
        """
        self.file_path = Path(file_path)
        if not self.file_path.exists():
            raise FileNotFoundError(f"File not found: {self.file_path}")

    @abstractmethod
    def get_provider_name(self) -> str:
        """
        Get the name of the provider.

        Returns:
            Provider name (e.g., 'santander', 'mercadopago')
        """
        pass

    @abstractmethod
    def read_file(self) -> Any:
        """
        Read the input file.

        Returns:
            Raw file data in appropriate format (DataFrame, list, etc.)
        """
        pass

    @abstractmethod
    def extract_transactions(self, raw_data: Any) -> list[Transaction]:
        """
        Extract transactions from raw data.

        Args:
            raw_data: Raw file data

        Returns:
            List of Transaction objects
        """
        pass

    def validate_transactions(self, transactions: list[Transaction]) -> list[Transaction]:
        """
        Validate and filter transactions.

        Default implementation filters out transactions with empty descriptions.
        Subclasses can override for custom validation.

        Args:
            transactions: List of transactions to validate

        Returns:
            List of valid transactions
        """
        return [t for t in transactions if t.description.strip()]

    def group_by_currency(self, transactions: list[Transaction]) -> dict[Currency, TransactionBatch]:
        """
        Group transactions by currency.

        Args:
            transactions: List of transactions

        Returns:
            Dictionary mapping currencies to transaction batches
        """
        batches = {}
        for transaction in transactions:
            currency = transaction.currency
            if currency not in batches:
                batches[currency] = TransactionBatch(
                    transactions=[],
                    currency=currency,
                    provider=self.get_provider_name()
                )
            batches[currency].transactions.append(transaction)

        # Sort each batch by date (newest first)
        for batch in batches.values():
            batch.sort_by_date(descending=True)

        return batches

    def parse(self) -> dict[Currency, TransactionBatch]:
        """
        Parse the file and extract transactions (Template Method).

        This method defines the skeleton of the parsing algorithm:
        1. Read the file
        2. Extract transactions
        3. Validate transactions
        4. Group by currency

        Returns:
            Dictionary mapping currencies to transaction batches
        """
        # Step 1: Read file
        raw_data = self.read_file()

        # Step 2: Extract transactions
        transactions = self.extract_transactions(raw_data)

        # Step 3: Validate transactions
        valid_transactions = self.validate_transactions(transactions)

        # Step 4: Group by currency
        batches = self.group_by_currency(valid_transactions)

        return batches

    def export_to_csv(
        self,
        batches: dict[Currency, TransactionBatch],
        output_dir: str | Path = ".",
        filename_pattern: str = "transactions_{currency}.csv"
    ) -> dict[Currency, Path]:
        """
        Export transaction batches to CSV files.

        Args:
            batches: Dictionary of transaction batches by currency
            output_dir: Directory to save CSV files
            filename_pattern: Filename pattern with {currency} placeholder

        Returns:
            Dictionary mapping currencies to output file paths
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        output_files = {}

        for currency, batch in batches.items():
            if len(batch) == 0:
                continue

            # Generate filename
            filename = filename_pattern.format(currency=currency.value.lower())
            output_path = output_dir / filename

            # Write CSV
            with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
                fieldnames = ['date', 'description', 'amount']
                writer = csv.DictWriter(
                    csvfile,
                    fieldnames=fieldnames,
                    quoting=csv.QUOTE_NONNUMERIC
                )

                writer.writeheader()
                for transaction in batch.transactions:
                    writer.writerow(transaction.to_csv_row())

            output_files[currency] = output_path

        return output_files
