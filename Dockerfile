FROM python:3.11-slim

# Install system dependencies: TeX Live (minimal) + Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-lang-spanish \
    texlive-luatex \
    latexmk \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy frontend and build
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm ci && npm run build

# Copy everything else
WORKDIR /app
COPY . .

# Create necessary directories
RUN mkdir -p casos salida

# Expose port (HF uses 7860)
EXPOSE 7860

# Start the server
CMD ["python", "backend/app.py"]
