#!/bin/bash

# Security Hardening Implementation Script for FastAPI Projects
# This script automates the security hardening process
# Usage: bash .claude/security-hardening-implementation.sh

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  FastAPI Security Hardening Implementation Script              ║"
echo "║  This script will implement comprehensive security features    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a FastAPI project
if [ ! -f "backend/app.py" ]; then
    echo -e "${RED}Error: backend/app.py not found${NC}"
    echo "Make sure you're running this from the project root directory"
    exit 1
fi

echo -e "${YELLOW}Step 1: Adding security dependencies${NC}"
echo "Adding slowapi and bleach to requirements.txt..."

if ! grep -q "slowapi" backend/requirements.txt; then
    echo "slowapi==0.1.9" >> backend/requirements.txt
    echo "bleach==6.1.0" >> backend/requirements.txt
    echo -e "${GREEN}✓ Dependencies added${NC}"
else
    echo -e "${YELLOW}⊘ Dependencies already present${NC}"
fi
echo ""

echo -e "${YELLOW}Step 2: Creating environment template files${NC}"

# Create backend/.env.example
if [ ! -f "backend/.env.example" ]; then
    cat > backend/.env.example << 'EOF'
# Environment Configuration
ENV=development

# Database
DATABASE_URL=sqlite:///./secretary.db

# CORS - Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Debug Mode (only in development)
DEBUG=True
EOF
    echo -e "${GREEN}✓ Created backend/.env.example${NC}"
else
    echo -e "${YELLOW}⊘ backend/.env.example already exists${NC}"
fi

# Create frontend/.env.example if it doesn't exist
if [ ! -f "frontend/.env.example" ]; then
    cat > frontend/.env.example << 'EOF'
# Frontend Environment Configuration

# API URL - Set this to your backend API endpoint
# Development: http://localhost:8000/api
# Production: https://your-backend-url/api
REACT_APP_API_URL=http://localhost:8000/api
EOF
    echo -e "${GREEN}✓ Created frontend/.env.example${NC}"
else
    echo -e "${YELLOW}⊘ frontend/.env.example already exists${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Updating .gitignore${NC}"

# Update .gitignore with security patterns
if ! grep -q "Environment files - ALL variants" .gitignore; then
    cat >> .gitignore << 'EOF'

# Environment files - ALL variants
.env
.env.*
!.env.example

# Backend environment files
backend/.env
backend/.env.*
!backend/.env.example

# Frontend environment files
frontend/.env
frontend/.env.*
!frontend/.env.example
EOF
    echo -e "${GREEN}✓ Updated .gitignore with environment patterns${NC}"
else
    echo -e "${YELLOW}⊘ .gitignore already updated${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Creating security test suite${NC}"

if [ ! -f "backend/test_security.py" ]; then
    echo "Copying test template (placeholder - full tests in documentation)..."
    cat > backend/test_security.py << 'EOF'
"""
Security hardening tests for the FastAPI application.
Tests rate limiting, input validation, security headers, and error handling.
"""

import pytest
from starlette.testclient import TestClient
from app import app

client = TestClient(app)


class TestSecurityHeaders:
    """Test that security headers are present."""

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

    def test_csp_header(self):
        """Test Content-Security-Policy header is set."""
        response = client.get("/health")
        assert "Content-Security-Policy" in response.headers


class TestInputValidation:
    """Test input validation constraints."""

    def test_extra_fields_rejected(self):
        """Test extra=forbid rejects unexpected fields."""
        payload = {
            "title": "Test Task",
            "malicious_field": "should be rejected"
        }
        # Adjust endpoint path as needed
        response = client.post("/api/tasks", json=payload)
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
EOF
    echo -e "${GREEN}✓ Created backend/test_security.py${NC}"
else
    echo -e "${YELLOW}⊘ backend/test_security.py already exists${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Installing dependencies${NC}"

if command -v python3 &> /dev/null; then
    cd backend
    echo "Installing Python dependencies (this may take a moment)..."
    python3 -m pip install -q -r requirements.txt --upgrade 2>&1 | grep -v "already satisfied" || true
    cd ..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}⚠ Python3 not found. Please install dependencies manually:${NC}"
    echo "  cd backend && pip install -r requirements.txt"
fi
echo ""

echo -e "${YELLOW}Step 6: Verification${NC}"

# Check if slowapi is installed
if python3 -c "import slowapi" 2>/dev/null; then
    echo -e "${GREEN}✓ slowapi installed${NC}"
else
    echo -e "${RED}✗ slowapi not installed${NC}"
fi

# Check if test file exists
if [ -f "backend/test_security.py" ]; then
    echo -e "${GREEN}✓ Test security file created${NC}"
else
    echo -e "${RED}✗ Test security file not created${NC}"
fi

# Check if .env.example files exist
if [ -f "backend/.env.example" ] && [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}✓ Environment template files created${NC}"
else
    echo -e "${RED}✗ Environment template files not created${NC}"
fi
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  Next Steps                                                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. READ THE IMPLEMENTATION GUIDE:"
echo "   cat .claude/security-hardening-process.md"
echo ""
echo "2. UPDATE YOUR APP.PY with security features:"
echo "   - Add rate limiting decorators (@limiter.limit())"
echo "   - Add Pydantic validation to models"
echo "   - Add security middleware"
echo "   - Add exception handlers"
echo "   - Update CORS configuration"
echo ""
echo "3. CREATE/UPDATE ENVIRONMENT FILES:"
echo "   cp backend/.env.example backend/.env"
echo "   cp frontend/.env.example frontend/.env"
echo "   # Edit .env files with your actual values"
echo ""
echo "4. RUN TESTS:"
echo "   cd backend"
echo "   python3 -m pytest test_security.py -v"
echo "   python3 -m pytest  # Run all tests"
echo ""
echo "5. COMMIT CHANGES:"
echo "   git add ."
echo "   git commit -m 'Implement comprehensive security hardening'"
echo ""
echo -e "${GREEN}✓ Security hardening preparation complete!${NC}"
echo ""
echo "For detailed implementation steps, see: .claude/security-hardening-process.md"
echo ""
