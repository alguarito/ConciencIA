FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-lang-spanish \
    texlive-luatex \
    latexmk \
    curl \
    && curl -fSSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy everything (Respects .dockerignore)
COPY . .

# Build frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Back to root
WORKDIR /app

# Create necessary dirs with proper permissions for HF user
RUN mkdir -p casos salida && chmod 777 casos salida

# Expose port
EXPOSE 7860

# Run with python3 and absolute path handling
CMD ["python3", "backend/app.py"]
