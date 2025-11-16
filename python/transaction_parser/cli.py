"""
Command-line interface for the transaction parser.
"""

import argparse
import sys
from pathlib import Path
from typing import Type

from .parsers import TransactionParser, SantanderParser, MercadoPagoParser


# Registry of available parsers
PARSERS = {
    'santander': SantanderParser,
    'mercadopago': MercadoPagoParser,
}


def get_parser_class(provider: str) -> Type[TransactionParser]:
    """
    Get parser class for a given provider.

    Args:
        provider: Provider name (e.g., 'santander', 'mercadopago')

    Returns:
        Parser class

    Raises:
        ValueError: If provider is not supported
    """
    parser_class = PARSERS.get(provider.lower())
    if parser_class is None:
        available = ', '.join(PARSERS.keys())
        raise ValueError(f"Unknown provider '{provider}'. Available: {available}")
    return parser_class


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description='Parse and clean transaction logs from different banking providers.',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Parse Santander Excel file
  python -m transaction_parser.cli santander santander.xlsx

  # Parse MercadoPago CSV file
  python -m transaction_parser.cli mercadopago mercadopago.csv

  # Specify custom output directory
  python -m transaction_parser.cli santander santander.xlsx -o output/

  # Specify custom filename pattern
  python -m transaction_parser.cli mercadopago mercadopago.csv -p "mp_transactions_{currency}.csv"
        """
    )

    parser.add_argument(
        'provider',
        choices=list(PARSERS.keys()),
        help='Banking provider (santander, mercadopago, etc.)'
    )

    parser.add_argument(
        'input_file',
        type=str,
        help='Path to input file (Excel or CSV depending on provider)'
    )

    parser.add_argument(
        '-o', '--output-dir',
        type=str,
        default='.',
        help='Output directory for CSV files (default: current directory)'
    )

    parser.add_argument(
        '-p', '--pattern',
        type=str,
        default='transactions_{currency}.csv',
        help='Output filename pattern with {currency} placeholder (default: transactions_{currency}.csv)'
    )

    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Enable verbose output'
    )

    args = parser.parse_args()

    try:
        # Validate input file
        input_path = Path(args.input_file)
        if not input_path.exists():
            print(f"Error: Input file not found: {input_path}", file=sys.stderr)
            sys.exit(1)

        # Get parser class
        parser_class = get_parser_class(args.provider)

        # Create parser instance
        if args.verbose:
            print(f"Using {args.provider} parser...")
            print(f"Reading from: {input_path}")

        transaction_parser = parser_class(input_path)

        # Parse transactions
        if args.verbose:
            print("Parsing transactions...")

        batches = transaction_parser.parse()

        # Display results
        total_transactions = sum(len(batch) for batch in batches.values())
        print(f"\nExtracted {total_transactions} transactions:")
        for currency, batch in batches.items():
            print(f"  - {len(batch)} {currency.value} transactions")

        # Export to CSV
        if args.verbose:
            print(f"\nExporting to CSV files in: {args.output_dir}")

        output_files = transaction_parser.export_to_csv(
            batches,
            output_dir=args.output_dir,
            filename_pattern=args.pattern
        )

        # Display output files
        print("\nGenerated files:")
        for currency, output_path in output_files.items():
            batch = batches[currency]
            print(f"  - {output_path} ({len(batch)} transactions)")

        print("\nSuccess!")

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        if args.verbose:
            import traceback
            traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
