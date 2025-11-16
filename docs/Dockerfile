# Transaction Parser - Docker Image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application
COPY transaction_parser/ ./transaction_parser/
COPY run_tui.py .

# Set environment variables for better terminal support
ENV TERM=xterm-256color
ENV PYTHONUNBUFFERED=1

# Run the TUI
CMD ["python", "-m", "transaction_parser.tui"]
