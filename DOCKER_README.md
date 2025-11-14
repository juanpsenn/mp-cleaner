# Transaction Parser - Docker Edition

Run the Transaction Parser on **any platform** (Windows, Mac, Linux) using Docker!

## Prerequisites

Install Docker Desktop:
- **Windows**: https://docs.docker.com/desktop/install/windows-install/
- **Mac**: https://docs.docker.com/desktop/install/mac-install/
- **Linux**: https://docs.docker.com/desktop/install/linux-install/

## Quick Start

### Windows

1. **Open PowerShell or Command Prompt** in the project folder
2. **Run:**
   ```cmd
   run-docker.bat
   ```

### Linux/Mac

1. **Open Terminal** in the project folder
2. **Run:**
   ```bash
   ./run-docker.sh
   ```

### Manual Docker Commands

**Build the image:**
```bash
docker build -t transaction-parser .
```

**Run the container:**
```bash
docker run -it --rm -v "$(pwd):/data" -w /data transaction-parser
```

## How It Works

1. Docker creates a Linux container with Python and all dependencies
2. Your current folder is mounted into the container
3. The TUI runs inside the container
4. You can access your files (they're in the current directory)
5. Generated CSV files appear in your current folder

## Usage

Once the TUI starts:

1. **Select provider** (santander or mercadopago)
2. **Select input file** - Your files are available!
   - Type the filename directly: `amex.xlsx`
   - Or use full path: `/data/amex.xlsx`
3. **Select output folder** - Press Enter for current directory
4. **Done!** CSV files appear in your folder

## File Paths

Inside the container:
- Your project folder is at `/data`
- So `amex.xlsx` in your folder = `/data/amex.xlsx` in container
- Or just type `amex.xlsx` (the TUI will find it)

## Advantages

✓ **Works on Windows, Mac, Linux** - Same experience everywhere
✓ **No Python installation needed** - Everything in the container
✓ **Isolated environment** - Doesn't affect your system
✓ **Easy updates** - Just rebuild the image
✓ **Share easily** - Just share the Docker image

## Troubleshooting

### "Docker not found"
- Install Docker Desktop first
- Make sure Docker Desktop is running

### "Permission denied" on Linux/Mac
- Run: `chmod +x run-docker.sh`

### "Cannot find file"
- Files must be in the current folder (where you run the command)
- Or provide absolute path: `/data/your-file.xlsx`

### Tab autocomplete doesn't work
- Docker terminal has limitations
- Just type the filename directly

## Advanced

### Build and push to Docker Hub

```bash
docker build -t yourusername/transaction-parser:latest .
docker push yourusername/transaction-parser:latest
```

Then anyone can run:
```bash
docker run -it --rm -v "$(pwd):/data" yourusername/transaction-parser:latest
```

### Run without docker-compose

```bash
docker run -it --rm \
  -v "$(pwd):/data" \
  -w /data \
  transaction-parser
```

## What's Included

- Python 3.12
- pandas, openpyxl, prompt_toolkit
- Transaction Parser TUI
- All parsers (Santander, MercadoPago)

## Size

Docker image: ~200MB (includes Python runtime)

Much better than 38MB Linux-only executable, and works everywhere! 🚀

---

**Need help?** See README.md for full documentation.
