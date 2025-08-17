# Use Python 3.11 slim image
FROM python:3.11-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN pip install uv

# Set working directory
WORKDIR /app

# Copy pyproject.toml and uv.lock for dependency installation
COPY pyproject.toml uv.lock* ./

# Create virtual environment and install dependencies
RUN uv venv .venv
RUN uv pip install -r pyproject.toml

# Copy source code
COPY src/ ./src/

# Create uploads directory for video processing
RUN mkdir -p /app/uploads

# Expose the port FastAPI will run on
EXPOSE 8000

# Activate virtual environment and start the application
CMD [".venv/bin/uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
