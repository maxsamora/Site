import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPublicEndpoints:
    """Test public API endpoints that don't require authentication"""
    
    def test_api_root(self, api_client):
        """API root returns status ok"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "ok"
    
    def test_get_stats(self, api_client):
        """Stats endpoint returns expected structure"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected fields exist
        assert "machines_owned" in data
        assert "total_views" in data
        assert "difficulty_distribution" in data
        assert "platform_distribution" in data
        assert "popular_tags" in data
    
    def test_get_writeups(self, api_client):
        """Public writeups listing works"""
        response = api_client.get(f"{BASE_URL}/api/writeups")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_featured_writeups(self, api_client):
        """Featured writeups endpoint works"""
        response = api_client.get(f"{BASE_URL}/api/writeups/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_resources(self, api_client):
        """Public resources listing works"""
        response = api_client.get(f"{BASE_URL}/api/resources")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_challenge_token(self, api_client):
        """Challenge token endpoint returns valid token"""
        response = api_client.get(f"{BASE_URL}/api/challenge")
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "expires_in" in data
        assert len(data["token"]) > 20  # Token should be reasonably long


class TestAdminAuth:
    """Test admin authentication endpoints"""
    
    def test_admin_verify_valid_credentials(self, api_client, admin_auth_header):
        """Admin verify works with valid credentials"""
        response = api_client.get(f"{BASE_URL}/api/admin/verify", headers=admin_auth_header)
        assert response.status_code == 200
        data = response.json()
        assert data.get("authenticated") == True
    
    def test_admin_verify_invalid_credentials(self, api_client, invalid_auth_header):
        """Admin verify rejects invalid credentials"""
        response = api_client.get(f"{BASE_URL}/api/admin/verify", headers=invalid_auth_header)
        assert response.status_code == 401
    
    def test_admin_verify_no_credentials(self, api_client):
        """Admin verify requires credentials"""
        response = api_client.get(f"{BASE_URL}/api/admin/verify")
        assert response.status_code == 401


class TestAdminResourcesCRUD:
    """Test admin resource management (the recently fixed functionality)"""
    
    def test_create_resource_requires_auth(self, api_client):
        """Creating resource requires admin auth"""
        resource_data = {
            "title": "TEST_Resource",
            "description": "Test description",
            "category": "tools"
        }
        response = api_client.post(f"{BASE_URL}/api/admin/resources", json=resource_data)
        assert response.status_code == 401
    
    def test_create_resource_with_auth(self, api_client, admin_auth_header):
        """Creating resource works with valid admin auth"""
        unique_id = str(uuid.uuid4())[:8]
        resource_data = {
            "title": f"TEST_Resource_{unique_id}",
            "description": "Test description for automated test",
            "url": "https://example.com/test",
            "category": "tools"
        }
        response = api_client.post(
            f"{BASE_URL}/api/admin/resources", 
            json=resource_data, 
            headers=admin_auth_header
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["title"] == resource_data["title"]
        assert data["description"] == resource_data["description"]
        assert data["category"] == resource_data["category"]
        
        # Cleanup - delete the created resource
        resource_id = data["id"]
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/resources/{resource_id}",
            headers=admin_auth_header
        )
        assert delete_response.status_code == 200
    
    def test_delete_resource_requires_auth(self, api_client):
        """Deleting resource requires admin auth"""
        response = api_client.delete(f"{BASE_URL}/api/admin/resources/fake-id")
        assert response.status_code == 401
    
    def test_delete_resource_with_auth(self, api_client, admin_auth_header):
        """Full create and delete cycle works"""
        # First create a resource
        unique_id = str(uuid.uuid4())[:8]
        resource_data = {
            "title": f"TEST_ToDelete_{unique_id}",
            "description": "Resource to be deleted",
            "category": "notes"
        }
        create_response = api_client.post(
            f"{BASE_URL}/api/admin/resources",
            json=resource_data,
            headers=admin_auth_header
        )
        assert create_response.status_code == 200
        resource_id = create_response.json()["id"]
        
        # Verify it appears in resources list
        list_response = api_client.get(f"{BASE_URL}/api/resources")
        resources = list_response.json()
        created_titles = [r["title"] for r in resources]
        assert resource_data["title"] in created_titles
        
        # Now delete it
        delete_response = api_client.delete(
            f"{BASE_URL}/api/admin/resources/{resource_id}",
            headers=admin_auth_header
        )
        assert delete_response.status_code == 200
        
        # Verify it's gone from resources list
        list_response2 = api_client.get(f"{BASE_URL}/api/resources")
        resources2 = list_response2.json()
        remaining_titles = [r["title"] for r in resources2]
        assert resource_data["title"] not in remaining_titles


class TestVoting:
    """Test public voting on writeups"""
    
    def test_vote_invalid_type(self, api_client):
        """Invalid vote type is rejected"""
        response = api_client.post(f"{BASE_URL}/api/writeups/fake-id/vote?vote=invalid")
        assert response.status_code == 400
    
    def test_vote_nonexistent_writeup(self, api_client):
        """Voting on nonexistent writeup returns 404"""
        response = api_client.post(f"{BASE_URL}/api/writeups/nonexistent-id/vote?vote=up")
        assert response.status_code == 404


class TestComments:
    """Test comment functionality with challenge token"""
    
    def test_comment_requires_challenge_token(self, api_client):
        """Comment submission requires valid challenge token"""
        comment_data = {
            "content": "Test comment",
            "author_name": "Tester",
            "challenge_token": "invalid-token"
        }
        response = api_client.post(
            f"{BASE_URL}/api/comments?writeup_id=fake-id",
            json=comment_data
        )
        # Should fail due to invalid token
        assert response.status_code == 400
    
    def test_comment_with_valid_token_nonexistent_writeup(self, api_client):
        """Comment with valid token but nonexistent writeup returns 404"""
        # First get a valid challenge token
        token_response = api_client.get(f"{BASE_URL}/api/challenge")
        token = token_response.json()["token"]
        
        comment_data = {
            "content": "Test comment",
            "author_name": "Tester",
            "challenge_token": token
        }
        response = api_client.post(
            f"{BASE_URL}/api/comments?writeup_id=nonexistent-writeup",
            json=comment_data
        )
        assert response.status_code == 404


class TestSecurityHeaders:
    """Test security headers are present"""
    
    def test_security_headers_present(self, api_client):
        """Security headers are present in responses"""
        response = api_client.get(f"{BASE_URL}/api/")
        headers = response.headers
        
        # Check for key security headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "Content-Security-Policy" in headers


class TestContactForm:
    """Test contact form submission"""
    
    def test_contact_form_submission(self, api_client):
        """Contact form accepts valid data"""
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Subject",
            "message": "Test message content"
        }
        response = api_client.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
    
    def test_contact_form_invalid_email(self, api_client):
        """Contact form rejects invalid email"""
        contact_data = {
            "name": "Test User",
            "email": "invalid-email",
            "subject": "Test Subject",
            "message": "Test message content"
        }
        response = api_client.post(f"{BASE_URL}/api/contact", json=contact_data)
        assert response.status_code == 422  # Validation error
