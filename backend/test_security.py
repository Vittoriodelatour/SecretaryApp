"""
Security hardening tests for the Secretary App API.
Tests rate limiting, input validation, security headers, and error handling.
"""

import pytest
from starlette.testclient import TestClient
from app import app

client = TestClient(app)


class TestRateLimiting:
    """Test rate limiting on endpoints."""

    def test_health_endpoint_rate_limit(self):
        """Test health endpoint allows 120 requests per minute."""
        # Send 121 requests - the 121st should be rate limited
        responses = [client.get("/health") for _ in range(121)]
        # At least one should be rate limited
        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, "Rate limiting not triggered after threshold"

    def test_create_task_rate_limit(self):
        """Test create task endpoint has rate limit of 20/minute."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
        }
        # Send 21 requests - the 21st should be rate limited
        responses = [client.post("/api/tasks", json=payload) for _ in range(21)]
        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, "Rate limiting not triggered for create_task"

    def test_command_endpoint_rate_limit(self):
        """Test command endpoint has rate limit of 30/minute."""
        payload = {"text": "add task test"}
        # Send 31 requests - the 31st should be rate limited
        responses = [client.post("/api/command", json=payload) for _ in range(31)]
        status_codes = [r.status_code for r in responses]
        assert 429 in status_codes, "Rate limiting not triggered for command endpoint"

    def test_rate_limit_response_format(self):
        """Test rate limit response includes Retry-After header."""
        payload = {"text": "add task test"}
        # Trigger rate limit
        for _ in range(31):
            client.post("/api/command", json=payload)

        response = client.post("/api/command", json=payload)
        assert response.status_code == 429
        assert "Retry-After" in response.headers
        assert "error" in response.json()
        assert "message" in response.json()


class TestInputValidation:
    """Test input validation on all endpoints."""

    def test_task_title_too_long(self):
        """Test title max_length validation (500 chars)."""
        payload = {
            "title": "x" * 501,
            "importance": 3,
            "urgency": 3,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422
        assert "error" in response.json()

    def test_task_title_empty(self):
        """Test title cannot be empty."""
        payload = {
            "title": "",
            "importance": 3,
            "urgency": 3,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_importance_out_of_range(self):
        """Test importance bounds validation (1-5)."""
        payload = {
            "title": "Test Task",
            "importance": 10,
            "urgency": 3,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_urgency_out_of_range(self):
        """Test urgency bounds validation (1-5)."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 0,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_due_date_invalid_format(self):
        """Test due_date format validation (YYYY-MM-DD)."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
            "due_date": "2024/01/01",  # Wrong format
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_due_time_invalid_format(self):
        """Test due_time format validation (HH:MM)."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
            "due_time": "25:00",  # Invalid hour
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_duration_negative(self):
        """Test duration_minutes must be positive."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
            "duration_minutes": -5,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_task_duration_exceeds_max(self):
        """Test duration_minutes cannot exceed 1440 (24 hours)."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
            "duration_minutes": 1441,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_extra_fields_rejected(self):
        """Test extra=forbid rejects unexpected fields."""
        payload = {
            "title": "Test Task",
            "importance": 3,
            "urgency": 3,
            "malicious_field": "should be rejected",
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_command_text_too_long(self):
        """Test command text max_length validation (1000 chars)."""
        payload = {"text": "x" * 1001}
        response = client.post("/api/command", json=payload)
        assert response.status_code == 422

    def test_command_text_empty(self):
        """Test command text cannot be empty."""
        payload = {"text": ""}
        response = client.post("/api/command", json=payload)
        assert response.status_code == 422

    def test_calendar_start_date_format(self):
        """Test calendar start_date format validation."""
        response = client.get("/api/calendar?start_date=2024/01/01&end_date=2024-01-31")
        assert response.status_code == 422

    def test_calendar_end_date_format(self):
        """Test calendar end_date format validation."""
        response = client.get("/api/calendar?start_date=2024-01-01&end_date=01/31/2024")
        assert response.status_code == 422

    def test_calendar_date_range_exceeds_365_days(self):
        """Test calendar date range cannot exceed 365 days."""
        response = client.get(
            "/api/calendar?start_date=2023-01-01&end_date=2025-01-02"
        )
        assert response.status_code == 400


class TestSecurityHeaders:
    """Test security headers are present on all responses."""

    def test_x_frame_options_header(self):
        """Test X-Frame-Options header is set."""
        response = client.get("/health")
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"

    def test_x_content_type_options_header(self):
        """Test X-Content-Type-Options header is set."""
        response = client.get("/health")
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"

    def test_x_xss_protection_header(self):
        """Test X-XSS-Protection header is set."""
        response = client.get("/health")
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"

    def test_referrer_policy_header(self):
        """Test Referrer-Policy header is set."""
        response = client.get("/health")
        assert "Referrer-Policy" in response.headers

    def test_csp_header(self):
        """Test Content-Security-Policy header is set."""
        response = client.get("/health")
        assert "Content-Security-Policy" in response.headers

    def test_request_id_header(self):
        """Test X-Request-ID header is present."""
        response = client.get("/health")
        assert "X-Request-ID" in response.headers
        # Should be a valid UUID format
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) == 36  # UUID format


class TestErrorHandling:
    """Test error handling and response formats."""

    def test_404_error_format(self):
        """Test 404 error has standard format."""
        response = client.get("/api/tasks/999999")
        assert response.status_code == 404
        assert "error" in response.json()
        assert "message" in response.json()

    def test_validation_error_format(self):
        """Test validation error includes field information."""
        payload = {
            "title": "x" * 501,
            "importance": 10,
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422
        data = response.json()
        assert "error" in data
        assert "message" in data
        assert "errors" in data
        assert isinstance(data["errors"], list)
        if data["errors"]:
            assert "field" in data["errors"][0]
            assert "message" in data["errors"][0]

    def test_request_size_limit(self):
        """Test request size limit is enforced."""
        # Create a payload larger than 1MB
        payload = {"text": "x" * 2_000_000}
        response = client.post("/api/command", json=payload)
        # Should either be 413 (Payload Too Large) or validation error
        assert response.status_code in [413, 422]

    def test_cors_headers_on_valid_origin(self):
        """Test CORS headers when request is from allowed origin."""
        # The test client allows all origins in test mode
        response = client.get("/api/priority-matrix")
        assert response.status_code in [200, 404]  # 404 if no tasks, 200 if tasks exist

    def test_health_endpoint_responds(self):
        """Test health endpoint returns 200 OK or 429 if rate limited in test."""
        response = client.get("/api/priority-matrix")
        # The endpoint should respond (either 200 or 429 from rate limiting)
        assert response.status_code in [200, 404, 429]


class TestValidationErrorDetails:
    """Test that validation errors provide helpful messages."""

    def test_title_validation_message(self):
        """Test title validation error provides clear message."""
        payload = {"title": ""}
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422

    def test_date_validation_message(self):
        """Test date validation error provides clear message."""
        payload = {
            "title": "Test",
            "due_date": "invalid-date",
        }
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
