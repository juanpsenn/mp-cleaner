#!/usr/bin/env python3
"""
Example script demonstrating the usage of the transaction parser.
"""

from transaction_parser import SantanderParser, MercadoPagoParser, Currency
from pathlib import Path


def example_santander():
    """Example: Parse Santander transactions."""
    print("=" * 60)
    print("EXAMPLE 1: Santander Parser")
    print("=" * 60)

    file_path = 'santander.xlsx'

    # Check if file exists
    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        print("Skipping Santander example.\n")
        return

    # Create parser and parse transactions
    parser = SantanderParser(file_path)
    batches = parser.parse()

    # Display results
    print(f"\nParsed {file_path}")
    print(f"Total batches: {len(batches)}")

    for currency, batch in batches.items():
        print(f"\n{currency.value} Transactions: {len(batch)}")
        print(f"Provider: {batch.provider}")

        # Show first 5 transactions
        print("\nFirst 5 transactions:")
        for i, transaction in enumerate(batch.transactions[:5], 1):
            print(f"  {i}. {transaction}")

    # Export to CSV
    output_files = parser.export_to_csv(batches)

    print("\nExported files:")
    for currency, path in output_files.items():
        print(f"  - {path}")

    print()


def example_mercadopago():
    """Example: Parse MercadoPago transactions."""
    print("=" * 60)
    print("EXAMPLE 2: MercadoPago Parser")
    print("=" * 60)

    file_path = 'mercadopago.csv'

    # Check if file exists
    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        print("Skipping MercadoPago example.\n")
        return

    # Create parser and parse transactions
    parser = MercadoPagoParser(file_path)
    batches = parser.parse()

    # Display results
    print(f"\nParsed {file_path}")
    print(f"Total batches: {len(batches)}")

    for currency, batch in batches.items():
        print(f"\n{currency.value} Transactions: {len(batch)}")
        print(f"Provider: {batch.provider}")

        # Show first 5 transactions
        print("\nFirst 5 transactions:")
        for i, transaction in enumerate(batch.transactions[:5], 1):
            print(f"  {i}. {transaction}")

        # Calculate total debits and credits
        debits = sum(t.amount for t in batch.transactions if t.amount < 0)
        credits = sum(t.amount for t in batch.transactions if t.amount > 0)

        print(f"\nSummary:")
        print(f"  Total debits:  {debits:,.2f}")
        print(f"  Total credits: {credits:,.2f}")
        print(f"  Net amount:    {debits + credits:,.2f}")

    # Export to CSV with custom pattern
    output_files = parser.export_to_csv(
        batches,
        output_dir='output',
        filename_pattern='mercadopago_{currency}.csv'
    )

    print("\nExported files:")
    for currency, path in output_files.items():
        print(f"  - {path}")

    print()


def example_custom_processing():
    """Example: Custom processing of transactions."""
    print("=" * 60)
    print("EXAMPLE 3: Custom Transaction Processing")
    print("=" * 60)

    file_path = 'santander.xlsx'

    if not Path(file_path).exists():
        print(f"File not found: {file_path}")
        print("Skipping custom processing example.\n")
        return

    # Parse transactions
    parser = SantanderParser(file_path)
    batches = parser.parse()

    # Get ARS transactions
    ars_batch = batches.get(Currency.ARS)

    if ars_batch:
        print(f"\nAnalyzing {len(ars_batch)} ARS transactions...")

        # Filter large transactions (absolute value > 50000)
        large_transactions = [
            t for t in ars_batch.transactions
            if abs(t.amount) > 50000
        ]

        print(f"\nLarge transactions (> 50,000):")
        if large_transactions:
            for transaction in large_transactions:
                print(f"  {transaction}")
        else:
            print("  No large transactions found")

        # Group by month
        from collections import defaultdict
        monthly_totals = defaultdict(float)

        for transaction in ars_batch.transactions:
            month_key = transaction.date.strftime('%Y-%m')
            monthly_totals[month_key] += transaction.amount

        print(f"\nMonthly totals:")
        for month, total in sorted(monthly_totals.items()):
            print(f"  {month}: ${total:,.2f}")

    print()


def main():
    """Run all examples."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 10 + "Transaction Parser - Examples" + " " * 19 + "║")
    print("╚" + "═" * 58 + "╝")
    print()

    # Run examples
    example_santander()
    example_mercadopago()
    example_custom_processing()

    print("=" * 60)
    print("Examples completed!")
    print("=" * 60)
    print()


if __name__ == '__main__':
    main()
