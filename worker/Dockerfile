FROM python:3.12-slim AS builder

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

FROM python:3.12-slim

WORKDIR /app

COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --from=builder /app/src/ ./src/

RUN useradd -m worker && chown -R worker:worker /app

USER worker

CMD ["python", "src/main.py"]