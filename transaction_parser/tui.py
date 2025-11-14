"""
Terminal User Interface for the transaction parser.
Smooth, polished interface inspired by Claude Code.
"""

import sys
from pathlib import Path

from prompt_toolkit import prompt, print_formatted_text
from prompt_toolkit.completion import PathCompleter, WordCompleter
from prompt_toolkit.validation import Validator, ValidationError
from prompt_toolkit.styles import Style
from prompt_toolkit.formatted_text import FormattedText

from .parsers import SantanderParser, MercadoPagoParser


# Registry of available parsers
PARSERS = {
    'santander': SantanderParser,
    'mercadopago': MercadoPagoParser,
}

# Provider to file extension mapping
PROVIDER_EXTENSIONS = {
    'santander': '.xlsx',
    'mercadopago': '.csv',
}

# Smooth color palette
STYLE = Style.from_dict({
    'prompt': '#00d4aa',
    'prompt-arrow': '#00d4aa bold',
    'success': '#00d4aa',
    'error': '#ff6b6b',
    'warning': '#ffd93d',
    'info': '#6bcfff',
    'dim': '#888888',
    'title': '#ffffff bold',
})


class FileValidator(Validator):
    """Validator to check if file exists."""

    def validate(self, document):
        text = document.text.strip()
        if not text:
            return  # Allow empty for default values

        path = Path(text).expanduser()
        if not path.exists():
            raise ValidationError(
                message=f'File not found: {text}',
                cursor_position=len(text)
            )
        if not path.is_file():
            raise ValidationError(
                message=f'Not a file: {text}',
                cursor_position=len(text)
            )


class DirectoryValidator(Validator):
    """Validator to check if directory path is valid."""

    def validate(self, document):
        text = document.text.strip()
        if not text:
            return  # Allow empty for default

        path = Path(text).expanduser()
        if path.exists() and not path.is_dir():
            raise ValidationError(
                message=f'Not a directory: {text}',
                cursor_position=len(text)
            )


def print_msg(text: str, style: str = ''):
    """Print a formatted message."""
    style_class = f'class:{style}' if style else ''
    print_formatted_text(FormattedText([(style_class, text)]), style=STYLE)


def print_header():
    """Print smooth header."""
    print_msg('━' * 70, 'dim')
    print_msg('  Transaction Parser', 'title')
    print_msg('━' * 70, 'dim')
    print()


def print_step(number: int, title: str):
    """Print step header."""
    print()
    print_msg(f'Step {number} › {title}', 'info')
    print()


def print_hint(text: str):
    """Print a subtle hint."""
    print_msg(f'  {text}', 'dim')


def print_success(text: str, indent: bool = False):
    """Print success message."""
    prefix = '  ' if indent else ''
    print_msg(f'{prefix}✓ {text}', 'success')


def print_error(text: str):
    """Print error message."""
    print_msg(f'✗ {text}', 'error')


def print_warning(text: str):
    """Print warning message."""
    print_msg(f'⚠ {text}', 'warning')


def print_info(text: str, indent: bool = False):
    """Print info message."""
    prefix = '  ' if indent else ''
    print_msg(f'{prefix}{text}', 'info')


def select_provider() -> str:
    """Select provider with autocomplete."""
    print_step(1, 'Select Provider')

    # Show available providers
    providers_list = ', '.join(PARSERS.keys())
    print_hint(f'Available: {providers_list}')
    print_hint("Type 'exit' or press Ctrl+C to quit")
    print()

    provider_completer = WordCompleter(
        list(PARSERS.keys()),
        ignore_case=True,
        sentence=True,
    )

    while True:
        try:
            provider = prompt(
                FormattedText([
                    ('class:prompt-arrow', '› '),
                    ('class:prompt', 'Provider: '),
                ]),
                completer=provider_completer,
                style=STYLE,
                complete_while_typing=True,
            ).strip().lower()

            # Check for exit
            if provider in ('exit', 'quit', 'q'):
                print()
                print_msg('Goodbye! 👋', 'dim')
                print()
                sys.exit(0)

            if not provider:
                print()
                print_error('Please select a provider')
                print()
                continue

            if provider in PARSERS:
                print()
                print_success(f'Using {provider}')
                return provider
            else:
                print()
                print_error(f'Unknown provider: {provider}')
                print_hint(f'Available: {providers_list}')
                print()

        except (KeyboardInterrupt, EOFError):
            print('\n')
            print_msg('Goodbye! 👋', 'dim')
            print()
            sys.exit(0)


def select_input_file(provider: str) -> Path:
    """Select input file with autocomplete."""
    print_step(2, 'Select Input File')

    expected_ext = PROVIDER_EXTENSIONS.get(provider)
    if expected_ext:
        print_hint(f'Expected format: {expected_ext}')

    print_hint('Use Tab for autocomplete')
    print_hint("Type 'exit' or press Ctrl+C to quit")
    print()

    file_completer = PathCompleter(
        only_directories=False,
        expanduser=True,
    )

    while True:
        try:
            file_path = prompt(
                FormattedText([
                    ('class:prompt-arrow', '› '),
                    ('class:prompt', 'File: '),
                ]),
                completer=file_completer,
                validator=FileValidator(),
                validate_while_typing=False,
                style=STYLE,
                complete_while_typing=True,
            ).strip()

            # Check for exit
            if file_path.lower() in ('exit', 'quit', 'q'):
                print()
                print_msg('Goodbye! 👋', 'dim')
                print()
                sys.exit(0)

            if not file_path:
                print()
                print_error('Please select a file')
                print()
                continue

            path = Path(file_path).expanduser().resolve()

            # Check extension
            if expected_ext and path.suffix.lower() != expected_ext:
                print()
                print_warning(f'Expected {expected_ext}, got {path.suffix}')

                confirm = prompt(
                    FormattedText([
                        ('class:prompt-arrow', '› '),
                        ('class:warning', 'Continue anyway? (y/n): '),
                    ]),
                    style=STYLE,
                ).strip().lower()

                if confirm not in ('y', 'yes'):
                    print()
                    continue

            print()
            print_success(f'{path.name}')
            print_hint(f'  {path.parent}')
            return path

        except ValidationError as e:
            print()
            print_error(str(e.message))
            print()
        except (KeyboardInterrupt, EOFError):
            print('\n')
            print_msg('Goodbye! 👋', 'dim')
            print()
            sys.exit(0)


def select_output_folder() -> Path:
    """Select output folder with autocomplete."""
    print_step(3, 'Select Output Folder')

    print_hint('Use Tab for autocomplete')
    print_hint('Press Enter for current directory')
    print_hint("Type 'exit' or press Ctrl+C to quit")
    print()

    dir_completer = PathCompleter(
        only_directories=True,
        expanduser=True,
    )

    while True:
        try:
            output_dir = prompt(
                FormattedText([
                    ('class:prompt-arrow', '› '),
                    ('class:prompt', 'Output: '),
                    ('class:dim', '[.]'),
                    ('', ' '),
                ]),
                completer=dir_completer,
                validator=DirectoryValidator(),
                validate_while_typing=False,
                style=STYLE,
                complete_while_typing=True,
                default='',
            ).strip()

            # Check for exit
            if output_dir.lower() in ('exit', 'quit', 'q'):
                print()
                print_msg('Goodbye! 👋', 'dim')
                print()
                sys.exit(0)

            if not output_dir:
                output_dir = '.'

            path = Path(output_dir).expanduser().resolve()

            # Create directory if needed
            if not path.exists():
                print()
                print_info(f'Directory does not exist: {path}')

                confirm = prompt(
                    FormattedText([
                        ('class:prompt-arrow', '› '),
                        ('class:prompt', 'Create? (y/n): '),
                    ]),
                    style=STYLE,
                ).strip().lower()

                if confirm in ('y', 'yes'):
                    path.mkdir(parents=True, exist_ok=True)
                    print()
                    print_success(f'Created {path}')
                else:
                    print()
                    continue

            print()
            print_success(f'{path}')
            return path

        except ValidationError as e:
            print()
            print_error(str(e.message))
            print()
        except (KeyboardInterrupt, EOFError):
            print('\n')
            print_msg('Goodbye! 👋', 'dim')
            print()
            sys.exit(0)


def process_transactions(provider: str, input_file: Path, output_dir: Path) -> bool:
    """Process transactions with visual feedback."""
    print_step(4, 'Processing')

    try:
        # Parse
        print_info('Parsing transactions...')
        parser_class = PARSERS[provider]
        parser = parser_class(input_file)
        batches = parser.parse()

        # Summary
        total = sum(len(batch) for batch in batches.values())
        print()
        print_success(f'Found {total} transactions', indent=True)

        for currency, batch in batches.items():
            print_info(f'  {currency.value}: {len(batch)}', indent=True)

        # Export
        print()
        print_info('Exporting to CSV...')

        output_files = parser.export_to_csv(
            batches,
            output_dir=output_dir,
            filename_pattern='transactions_{currency}.csv'
        )

        # Results
        print()
        print_success('Completed!', indent=True)
        print()

        for currency, file_path in output_files.items():
            batch = batches[currency]
            print_info(f'  {file_path.name} ({len(batch)} rows)', indent=True)
            print_hint(f'    {file_path.parent}')

        print()
        print_msg('━' * 70, 'dim')

        return True

    except FileNotFoundError as e:
        print()
        print_error(f'File error: {e}')
        print()
        return False
    except ValueError as e:
        print()
        print_error(f'Parse error: {e}')
        print()
        return False
    except Exception as e:
        print()
        print_error(f'Unexpected error: {e}')
        print()
        import traceback
        print_msg('Details:', 'dim')
        traceback.print_exc()
        print()
        return False


def ask_continue() -> bool:
    """Ask if user wants to process another file."""
    try:
        print()

        another = prompt(
            FormattedText([
                ('class:prompt-arrow', '› '),
                ('class:prompt', 'Process another file? '),
                ('class:dim', '(y/n)'),
                ('', ' '),
            ]),
            style=STYLE,
        ).strip().lower()

        print()  # Space after response
        return another in ('y', 'yes')

    except (KeyboardInterrupt, EOFError):
        return False


def run_interactive_mode():
    """Run the smooth interactive mode."""
    try:
        print()
        print_header()

        while True:
            # Step 1: Provider
            provider = select_provider()

            # Step 2: Input file
            input_file = select_input_file(provider)

            # Step 3: Output folder
            output_dir = select_output_folder()

            # Step 4: Process
            success = process_transactions(provider, input_file, output_dir)

            if not success:
                print_info('Try again with a different file?')
                print()

            if not ask_continue():
                break

            # Start fresh for next file
            print_header()

        print_msg('Goodbye! 👋', 'dim')
        print()

    except (KeyboardInterrupt, EOFError):
        print('\n')
        print_msg('Cancelled', 'dim')
        print()
        sys.exit(0)


def main():
    """Main entry point for the TUI."""
    run_interactive_mode()


if __name__ == '__main__':
    main()
