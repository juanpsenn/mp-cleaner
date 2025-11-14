"""
Data models for transaction processing.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class Currency(Enum):
    """Supported currencies."""
    ARS = "ARS"
    USD = "USD"


@dataclass
class Transaction:
    """
    Represents a single financial transaction.

    Attributes:
        date: Transaction date
        description: Transaction description
        amount: Transaction amount (negative for debits, positive for credits)
        currency: Currency of the transaction
        raw_data: Optional dictionary containing original raw data
    """
    date: datetime
    description: str
    amount: float
    currency: Currency
    raw_data: Optional[dict] = None

    def to_csv_row(self) -> dict:
        """
        Convert transaction to CSV-compatible dictionary.

        Returns:
            Dictionary with formatted transaction data
        """
        return {
            'date': self.date.strftime('%d/%m/%Y'),
            'description': self.description,
            'amount': self.amount
        }

    def __str__(self) -> str:
        """String representation of the transaction."""
        return f"{self.date.strftime('%d/%m/%Y')} | {self.description} | {self.amount} {self.currency.value}"


@dataclass
class TransactionBatch:
    """
    Represents a batch of transactions grouped by currency.

    Attributes:
        transactions: List of transactions
        currency: Currency of all transactions in this batch
        provider: Name of the provider (e.g., 'santander', 'mercadopago')
    """
    transactions: list[Transaction]
    currency: Currency
    provider: str

    def sort_by_date(self, descending: bool = True) -> None:
        """
        Sort transactions by date.

        Args:
            descending: If True, sort newest first; otherwise oldest first
        """
        self.transactions.sort(key=lambda t: t.date, reverse=descending)

    def __len__(self) -> int:
        """Return number of transactions in the batch."""
        return len(self.transactions)
