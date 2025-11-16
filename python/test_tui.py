#!/usr/bin/env python3
"""
Test script to verify TUI components work correctly.
"""

def test_imports():
    """Test that all imports work."""
    print("Testing imports...")
    try:
        from transaction_parser.tui import (
            print_header,
            print_step,
            print_success,
            print_error,
            print_warning,
            print_info,
            print_hint,
        )
        print("✓ All imports successful")
        return True
    except Exception as e:
        print(f"✗ Import error: {e}")
        return False


def test_printing():
    """Test that print functions work."""
    print("\nTesting print functions...")
    try:
        from transaction_parser.tui import (
            print_header,
            print_step,
            print_success,
            print_error,
            print_warning,
            print_info,
            print_hint,
        )

        print("\n" + "="*70)
        print_header()
        print_step(1, "Test Step")
        print_hint("This is a hint")
        print_success("Success message")
        print_error("Error message")
        print_warning("Warning message")
        print_info("Info message")
        print("="*70 + "\n")

        print("✓ All print functions work")
        return True
    except Exception as e:
        print(f"✗ Print error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_validators():
    """Test validators."""
    print("\nTesting validators...")
    try:
        from transaction_parser.tui import FileValidator, DirectoryValidator
        from pathlib import Path

        # Create test file
        test_file = Path("test_file.txt")
        test_file.write_text("test")

        file_val = FileValidator()
        dir_val = DirectoryValidator()

        # Test file exists
        from prompt_toolkit.document import Document
        doc = Document(str(test_file))
        try:
            file_val.validate(doc)
            print("✓ File validator works")
        except Exception as e:
            print(f"✗ File validator error: {e}")
            return False
        finally:
            test_file.unlink(missing_ok=True)

        return True
    except Exception as e:
        print(f"✗ Validator error: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("  TUI Component Tests")
    print("="*70)

    results = []
    results.append(("Imports", test_imports()))
    results.append(("Printing", test_printing()))
    results.append(("Validators", test_validators()))

    print("\n" + "="*70)
    print("  Test Summary")
    print("="*70)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{name:20s} {status}")

    all_passed = all(r for _, r in results)

    print("="*70)
    if all_passed:
        print("\n✓ All tests passed!\n")
        return 0
    else:
        print("\n✗ Some tests failed\n")
        return 1


if __name__ == '__main__':
    import sys
    sys.exit(main())
