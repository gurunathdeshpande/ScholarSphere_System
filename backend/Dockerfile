# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for mysqlclient and potential ML build tools
RUN apt-get update && apt-get install -y \
    pkg-config \
    default-libmysqlclient-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt /app/

# Install Python dependencies
# 1. Install CPU-only Torch first (lighter, prevents OOM on build)
# 2. Install other requirements (Torch requirement will be satisfied by above)
RUN pip install --upgrade pip && \
    pip install torch --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . /app/

# Expose port 5000
EXPOSE 5000

# Run the application using Gunicorn
# Run the application using Gunicorn
# Use sh -c to expand the PORT environment variable (default to 5000 if not set)
CMD ["sh", "-c", "gunicorn -w 2 -b 0.0.0.0:${PORT:-5000} --timeout 120 run:app"]
