#!/usr/bin/env python3
"""
Security-focused Backend API Testing for ZeroDay.log
Tests the new security model with HTTP Basic Auth admin access and public read-only endpoints
"""

import requests
import sys
import json
import base64
from datetime import datetime
from typing import Dict, List, Optional
import time

class SecurityAPITester:
    def __init__(self, base_url="https://maxwell-security.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_auth = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Admin credentials from environment
        self.admin_username = "maxwell"
        self.admin_password = "dgWlSVkBmNiT3dJF0t2NXnlWPVukeOVR"

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def get_basic_auth_header(self):
        """Generate HTTP Basic Auth header"""
        if not self.admin_auth:
            credentials = f"{self.admin_username}:{self.admin_password}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            self.admin_auth = {"Authorization": f"Basic {encoded_credentials}"}
        return self.admin_auth

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if headers:
            req_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.text else {}
                except:
                    response_data = {}
                self.log_test(name, True)
                return True, response_data, response
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}, response

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}, None
        except Exception as e:
            self.log_test(name, False, f"Unexpected error: {str(e)}")
            return False, {}, None

    def test_security_headers(self):
        """Test that security headers are present"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            headers = response.headers
            
            security_headers = {
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
                "X-XSS-Protection": "1; mode=block",
                "Content-Security-Policy": True  # Just check if present
            }
            
            all_headers_present = True
            for header, expected_value in security_headers.items():
                if header in headers:
                    if expected_value == True:  # Just check presence
                        self.log_test(f"Security Header - {header}", True)
                    elif headers[header] == expected_value:
                        self.log_test(f"Security Header - {header}", True)
                    else:
                        self.log_test(f"Security Header - {header}", False, f"Expected '{expected_value}', got '{headers[header]}'")
                        all_headers_present = False
                else:
                    self.log_test(f"Security Header - {header}", False, "Header not present")
                    all_headers_present = False
            
            return all_headers_present
        except Exception as e:
            self.log_test("Security Headers Check", False, str(e))
            return False

    def test_rate_limiting(self):
        """Test rate limiting functionality"""
        print(f"\n🔍 Testing Rate Limiting...")
        
        # Make many requests quickly to trigger rate limit
        requests_made = 0
        rate_limited = False
        
        for i in range(35):  # Exceed the 30 req/min limit
            try:
                response = requests.get(f"{self.api_url}/stats", timeout=2)
                requests_made += 1
                
                if response.status_code == 429:
                    rate_limited = True
                    self.log_test("Rate Limiting", True, f"Rate limited after {requests_made} requests")
                    break
                    
                time.sleep(0.1)  # Small delay between requests
            except:
                break
        
        if not rate_limited:
            self.log_test("Rate Limiting", False, f"Did not get rate limited after {requests_made} requests")
        
        return rate_limited

    def test_public_endpoints(self):
        """Test public read-only endpoints"""
        # Test API root
        success1, _, _ = self.run_test("API Root", "GET", "", 200)
        
        # Test public stats
        success2, response_data, _ = self.run_test("Public Stats", "GET", "stats", 200)
        
        if success2:
            # Verify stats structure
            required_fields = ['machines_owned', 'total_views', 'difficulty_distribution', 'platform_distribution']
            for field in required_fields:
                if field in response_data:
                    self.log_test(f"Stats Field - {field}", True)
                else:
                    self.log_test(f"Stats Field - {field}", False, f"Missing field")
        
        # Test public writeups
        success3, _, _ = self.run_test("Public Writeups", "GET", "writeups", 200)
        
        # Test public resources
        success4, _, _ = self.run_test("Public Resources", "GET", "resources", 200)
        
        # Test public contact form
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "subject": "Test Message",
            "message": "This is a test message"
        }
        success5, _, _ = self.run_test("Public Contact Form", "POST", "contact", 200, data=contact_data)
        
        return success1 and success2 and success3 and success4 and success5

    def test_admin_authentication(self):
        """Test admin authentication with HTTP Basic Auth"""
        # Test admin verify with correct credentials
        auth_header = self.get_basic_auth_header()
        success1, _, _ = self.run_test("Admin Auth Valid", "GET", "admin/verify", 200, headers=auth_header)
        
        # Test admin verify without credentials
        success2, _, _ = self.run_test("Admin Auth Missing", "GET", "admin/verify", 401)
        
        # Test admin verify with wrong credentials
        wrong_auth = {"Authorization": "Basic " + base64.b64encode("wrong:password".encode()).decode()}
        success3, _, _ = self.run_test("Admin Auth Invalid", "GET", "admin/verify", 401, headers=wrong_auth)
        
        return success1 and success2 and success3

    def test_admin_endpoints_require_auth(self):
        """Test that admin endpoints return 401 without auth"""
        admin_endpoints = [
            ("GET", "admin/writeups"),
            ("POST", "admin/writeups"),
            ("DELETE", "admin/writeups/test-id"),
            ("POST", "admin/resources"),
            ("DELETE", "admin/resources/test-id"),
            ("DELETE", "admin/comments/test-id"),
        ]
        
        all_protected = True
        for method, endpoint in admin_endpoints:
            test_data = {"title": "test", "description": "test", "content": "test", "difficulty": "easy", "platform": "other", "tags": []} if method == "POST" else None
            success, _, _ = self.run_test(f"Protected {method} {endpoint}", method, endpoint, 401, data=test_data)
            if not success:
                all_protected = False
        
        return all_protected

    def test_admin_writeup_operations(self):
        """Test admin writeup CRUD operations"""
        auth_header = self.get_basic_auth_header()
        
        # Create writeup
        writeup_data = {
            "title": "Test Security Writeup",
            "description": "Testing the new security model",
            "content": "# Security Test\n\nThis is a test writeup for the new security model.",
            "difficulty": "easy",
            "platform": "other",
            "tags": ["security", "test"],
            "skills": ["Testing"],
            "techniques": ["Manual Testing"],
            "cves": [],
            "tools_used": ["curl"]
        }
        
        success1, response_data, _ = self.run_test("Admin Create Writeup", "POST", "admin/writeups", 200, 
                                                   data=writeup_data, headers=auth_header)
        
        writeup_id = None
        if success1 and 'id' in response_data:
            writeup_id = response_data['id']
            self.log_test("Writeup ID Generated", True)
        else:
            self.log_test("Writeup ID Generated", False, "No ID in response")
            return False
        
        # Get all writeups (admin)
        success2, _, _ = self.run_test("Admin Get All Writeups", "GET", "admin/writeups", 200, headers=auth_header)
        
        # Update writeup
        update_data = {"title": "Updated Security Writeup", "published": True}
        success3, _, _ = self.run_test("Admin Update Writeup", "PUT", f"admin/writeups/{writeup_id}", 200,
                                       data=update_data, headers=auth_header)
        
        # Delete writeup
        success4, _, _ = self.run_test("Admin Delete Writeup", "DELETE", f"admin/writeups/{writeup_id}", 200,
                                       headers=auth_header)
        
        return success1 and success2 and success3 and success4

    def test_public_voting_and_comments(self):
        """Test public voting and commenting functionality"""
        auth_header = self.get_basic_auth_header()
        
        # First create a writeup as admin
        writeup_data = {
            "title": "Voting Test Writeup",
            "description": "Test writeup for voting",
            "content": "Test content",
            "difficulty": "easy",
            "platform": "other",
            "tags": ["test"],
            "skills": [],
            "techniques": [],
            "cves": [],
            "tools_used": []
        }
        
        success1, response_data, _ = self.run_test("Create Writeup for Voting Test", "POST", "admin/writeups", 200,
                                                   data=writeup_data, headers=auth_header)
        
        if not success1 or 'id' not in response_data:
            return False
        
        writeup_id = response_data['id']
        
        # Test public voting (no auth required)
        success2, _, _ = self.run_test("Public Upvote", "POST", f"writeups/{writeup_id}/vote?vote=up", 200)
        success3, _, _ = self.run_test("Public Downvote", "POST", f"writeups/{writeup_id}/vote?vote=down", 200)
        
        # Test public comments (no auth required)
        comment_data = {
            "content": "This is a test comment from public user",
            "author_name": "Test User"
        }
        success4, _, _ = self.run_test("Public Comment", "POST", f"comments?writeup_id={writeup_id}", 200, 
                                       data=comment_data)
        
        # Get comments
        success5, _, _ = self.run_test("Get Comments", "GET", f"comments/{writeup_id}", 200)
        
        # Cleanup - delete the test writeup
        self.run_test("Cleanup Test Writeup", "DELETE", f"admin/writeups/{writeup_id}", 200, headers=auth_header)
        
        return success2 and success3 and success4 and success5

    def test_image_upload_security(self):
        """Test secure image upload functionality"""
        auth_header = self.get_basic_auth_header()
        
        # Test without auth (should fail)
        success1, _, _ = self.run_test("Image Upload No Auth", "POST", "admin/upload", 401)
        
        # Note: We can't easily test actual file uploads in this script without creating files
        # This would need to be tested separately or with proper file handling
        
        return success1

    def run_all_tests(self):
        """Run comprehensive security test suite"""
        print("🚀 Starting ZeroDay.log Security API Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        print(f"   Admin User: {self.admin_username}")
        
        # Test security headers
        self.test_security_headers()
        
        # Test public endpoints (no auth required)
        self.test_public_endpoints()
        
        # Test admin authentication
        self.test_admin_authentication()
        
        # Test that admin endpoints are protected
        self.test_admin_endpoints_require_auth()
        
        # Test admin operations (with auth)
        self.test_admin_writeup_operations()
        
        # Test public voting and comments
        self.test_public_voting_and_comments()
        
        # Test image upload security
        self.test_image_upload_security()
        
        # Test rate limiting (do this last as it may affect other tests)
        print("\n⏱️  Testing rate limiting (this may take a moment)...")
        self.test_rate_limiting()

        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All security tests passed!")
            return 0
        else:
            print("❌ Some security tests failed")
            return 1

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "failed_tests": self.tests_run - self.tests_passed,
            "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "0%",
            "test_results": self.test_results
        }

def main():
    tester = SecurityAPITester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    print(f"\n📋 Security Test Summary:")
    print(f"   Success Rate: {summary['success_rate']}")
    print(f"   Passed: {summary['passed_tests']}")
    print(f"   Failed: {summary['failed_tests']}")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())