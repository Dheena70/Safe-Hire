FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend, datasets, and ml_models
COPY backend/ backend/
COPY datasets/ datasets/
COPY ml_models/ ml_models/

WORKDIR /app/backend

# Download NLTK corpora
RUN python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet')"

EXPOSE 5050

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5050", "--workers", "2", "--timeout", "120"]
