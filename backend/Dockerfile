FROM python:3.10-slim

WORKDIR /app

# 🔧 Install git so pip can fetch from GitHub
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Copy requirements file from subdirectory
COPY ./app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy full app
COPY ./app .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]


# FROM node:18-alpine
# WORKDIR /app
# COPY . .
# RUN npm install
# CMD ["npm", "start"]
