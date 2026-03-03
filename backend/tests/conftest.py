import pytest
import requests
import os

# Use the production URL directly for testing
BASE_URL = 'https://maxwell-security.preview.emergentagent.com'

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def admin_auth_header():
    """Admin HTTP Basic Auth header"""
    import base64
    username = "maxwell"
    password = "dgWlSVkBmNiT3dJF0t2NXnlWPVukeOVR"
    credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}

@pytest.fixture
def invalid_auth_header():
    """Invalid auth header for negative testing"""
    import base64
    credentials = base64.b64encode(b"invalid:invalid").decode()
    return {"Authorization": f"Basic {credentials}"}
