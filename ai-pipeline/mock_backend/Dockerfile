# Dev-only stand-in for the Node backend's internal endpoints, see
# mock_backend/main.py. Never deployed anywhere real.

FROM python:3.11-slim

WORKDIR /app

COPY mock_backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY mock_backend ./mock_backend

EXPOSE 8001

CMD ["uvicorn", "mock_backend.main:app", "--host", "0.0.0.0", "--port", "8001"]
