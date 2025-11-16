"""
Transaction Parser - A modular and extensible transaction log parser.

This package provides parsers for different banking providers using the Template Method pattern.
"""

from .models import Transaction, TransactionBatch, Currency
from .parsers.base import TransactionParser
from .parsers.santander import SantanderParser
from .parsers.mercadopago import MercadoPagoParser

__version__ = "1.0.0"

__all__ = [
    "Transaction",
    "TransactionBatch",
    "Currency",
    "TransactionParser",
    "SantanderParser",
    "MercadoPagoParser",
]


def run_tui():
    """Run the interactive TUI mode."""
    from .tui import run_interactive_mode
    run_interactive_mode()
