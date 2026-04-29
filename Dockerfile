FROM python:3.10-slim

# Set up working directory
WORKDIR /app

# Install system dependencies for OpenCV and DeepFace
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -m -u 1000 user

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories and set permissions for the non-root user
RUN mkdir -p output registered_faces && \
    chown -R user:user /app

# Switch to non-root user
USER user

# Set environment variable to run on port 7860 (Hugging Face Default)
ENV PORT=7860

# Expose port
EXPOSE 7860

# Start the application
CMD ["python", "backend.py"]
