#!/usr/bin/env python3
"""
Backend API Testing for CTF Writeup Blog
Tests all API endpoints including auth, writeups, comments, resources, contact, and stats
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional

class CTFWriteupAPITester:
    def __init__(self, base_url="https://maxwell-security.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None) -> tuple:
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if self.token and not headers:
            req_headers['Authorization'] = f'Bearer {self.token}'
        elif headers:
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
                return True, response_data
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test(name, False, error_msg)
                return False, {}

        except requests.exceptions.RequestException as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, f"Unexpected error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_stats_endpoint(self):
        """Test stats endpoint (no auth required)"""
        success, response = self.run_test("Get Stats", "GET", "stats", 200)
        if success:
            required_fields = ['machines_owned', 'difficulty_distribution', 'platform_distribution']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Stats Response - {field} field", False, f"Missing {field} in response")
                    return False
                else:
                    self.log_test(f"Stats Response - {field} field", True)
            
            # Test that difficulty_distribution has expected structure
            if isinstance(response.get('difficulty_distribution'), dict):
                self.log_test("Stats Response - difficulty_distribution structure", True)
            else:
                self.log_test("Stats Response - difficulty_distribution structure", False, "Should be a dict")
            
            # Test that platform_distribution has expected structure  
            if isinstance(response.get('platform_distribution'), dict):
                self.log_test("Stats Response - platform_distribution structure", True)
            else:
                self.log_test("Stats Response - platform_distribution structure", False, "Should be a dict")
                
        return success

    def test_register_user(self):
        """Test user registration"""
        timestamp = int(datetime.now().timestamp())
        test_user_data = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@zerodaylog.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        
        if success and 'access_token' in response and 'user' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log_test("Registration Token Received", True)
            return True
        elif success:
            self.log_test("Registration Token Received", False, "Missing token or user in response")
            return False
        return False

    def test_login_user(self):
        """Test user login with existing account"""
        # Try to login with the registered user
        timestamp = int(datetime.now().timestamp())
        login_data = {
            "email": f"test_{timestamp}@zerodaylog.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=login_data
        )
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Invalid Login (should fail)",
            "POST",
            "auth/login", 
            401,
            data=invalid_data
        )
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            self.log_test("Get Current User", False, "No token available")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_create_writeup(self):
        """Test creating a writeup with enhanced fields"""
        if not self.token:
            self.log_test("Create Writeup", False, "No token available")
            return False, None
            
        writeup_data = {
            "title": "Test HTB Machine - Lame",
            "description": "A beginner-friendly Linux machine focusing on SMB enumeration and exploitation",
            "content": "# HTB Lame Writeup\n\n## Enumeration\n\n```bash\nnmap -sC -sV 10.10.10.3\n```\n\n## Exploitation\n\nUsing distcc exploit...",
            "difficulty": "easy",
            "platform": "htb",
            "machine_name": "Lame",
            "os_type": "linux",
            "tags": ["smb", "distcc", "linux"],
            "skills": ["SMB Enumeration", "Distcc Exploitation"],
            "techniques": ["Service Exploitation", "Command Injection"],
            "cves": ["CVE-2004-2687"],
            "tools_used": ["nmap", "smbclient", "nc"],
            "cover_image": "https://example.com/lame.png"
        }
        
        success, response = self.run_test(
            "Create Writeup",
            "POST",
            "writeups",
            200,
            data=writeup_data
        )
        
        if success and 'id' in response:
            self.log_test("Writeup ID Generated", True)
            # Test that enhanced fields are in response
            enhanced_fields = ['skills', 'techniques', 'cves', 'os_type', 'tools_used']
            for field in enhanced_fields:
                if field in response:
                    self.log_test(f"Enhanced Field - {field}", True)
                else:
                    self.log_test(f"Enhanced Field - {field}", False, f"Missing {field} in response")
            return True, response['id']
        elif success:
            self.log_test("Writeup ID Generated", False, "Missing ID in response")
            
        return False, None

    def test_get_writeups(self):
        """Test getting all writeups"""
        return self.run_test("Get All Writeups", "GET", "writeups", 200)[0]

    def test_get_featured_writeups(self):
        """Test getting featured writeups"""
        return self.run_test("Get Featured Writeups", "GET", "writeups/featured", 200)[0]

    def test_get_writeup_by_id(self, writeup_id: str):
        """Test getting specific writeup by ID"""
        if not writeup_id:
            self.log_test("Get Writeup by ID", False, "No writeup ID provided")
            return False
            
        return self.run_test(
            "Get Writeup by ID",
            "GET",
            f"writeups/{writeup_id}",
            200
        )[0]

    def test_search_writeups(self):
        """Test writeup search functionality with enhanced filters"""
        # Test search by title
        success1, _ = self.run_test(
            "Search Writeups by Title",
            "GET",
            "writeups?search=Lame",
            200
        )
        
        # Test filter by difficulty
        success2, _ = self.run_test(
            "Filter Writeups by Difficulty",
            "GET",
            "writeups?difficulty=easy",
            200
        )
        
        # Test filter by platform
        success3, _ = self.run_test(
            "Filter Writeups by Platform",
            "GET",
            "writeups?platform=htb",
            200
        )
        
        # Test new enhanced filters
        success4, _ = self.run_test(
            "Filter Writeups by OS Type",
            "GET", 
            "writeups?os_type=linux",
            200
        )
        
        success5, _ = self.run_test(
            "Filter Writeups by Skill",
            "GET",
            "writeups?skill=SMB Enumeration",
            200
        )
        
        success6, _ = self.run_test(
            "Filter Writeups by Technique",
            "GET",
            "writeups?technique=Service Exploitation",
            200
        )
        
        return success1 and success2 and success3 and success4 and success5 and success6

    def test_vote_writeup(self, writeup_id: str):
        """Test voting on writeup"""
        if not self.token or not writeup_id:
            self.log_test("Vote on Writeup", False, "No token or writeup ID")
            return False
            
        # Test upvote
        success1, _ = self.run_test(
            "Upvote Writeup",
            "POST",
            f"writeups/{writeup_id}/vote?vote=up",
            200
        )
        
        # Test downvote 
        success2, _ = self.run_test(
            "Downvote Writeup", 
            "POST",
            f"writeups/{writeup_id}/vote?vote=down",
            200
        )
        
        return success1 and success2

    def test_create_comment(self, writeup_id: str):
        """Test creating a comment"""
        if not self.token or not writeup_id:
            self.log_test("Create Comment", False, "No token or writeup ID")
            return False, None
            
        comment_data = {
            "content": "Great writeup! Very helpful for beginners.",
            "writeup_id": writeup_id
        }
        
        success, response = self.run_test(
            "Create Comment",
            "POST",
            "comments",
            200,
            data=comment_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_get_comments(self, writeup_id: str):
        """Test getting comments for writeup"""
        if not writeup_id:
            self.log_test("Get Comments", False, "No writeup ID")
            return False
            
        return self.run_test(
            "Get Comments for Writeup",
            "GET",
            f"comments/{writeup_id}",
            200
        )[0]

    def test_create_resource(self):
        """Test creating a resource"""
        if not self.token:
            self.log_test("Create Resource", False, "No token available")
            return False, None
            
        resource_data = {
            "title": "Burp Suite Community Edition",
            "description": "Free web vulnerability scanner and proxy tool",
            "url": "https://portswigger.net/burp/communitydownload",
            "category": "tools"
        }
        
        success, response = self.run_test(
            "Create Resource",
            "POST",
            "resources",
            200,
            data=resource_data
        )
        
        if success and 'id' in response:
            return True, response['id']
        return False, None

    def test_get_resources(self):
        """Test getting all resources"""
        success1, _ = self.run_test("Get All Resources", "GET", "resources", 200)
        success2, _ = self.run_test("Get Resources by Category", "GET", "resources?category=tools", 200)
        return success1 and success2

    def test_contact_form(self):
        """Test contact form submission"""
        contact_data = {
            "name": "John Hacker",
            "email": "john@example.com", 
            "subject": "Great platform!",
            "message": "Love the writeups, very detailed and helpful for learning."
        }
        
        return self.run_test(
            "Submit Contact Form",
            "POST",
            "contact",
            200,
            data=contact_data
        )[0]

    def test_unauthorized_endpoints(self):
        """Test endpoints that require authentication without token"""
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success1, _ = self.run_test(
            "Create Writeup (Unauthorized)",
            "POST",
            "writeups",
            401,
            data={"title": "test", "content": "test", "difficulty": "easy", "platform": "htb", "description": "test", "tags": []}
        )
        
        success2, _ = self.run_test(
            "Get Current User (Unauthorized)", 
            "GET",
            "auth/me",
            401
        )
        
        # Restore token
        self.token = temp_token
        return success1 and success2

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting CTF Writeup Blog API Tests...")
        print(f"   Base URL: {self.base_url}")
        print(f"   API URL: {self.api_url}")
        
        # Test basic endpoints
        self.test_root_endpoint()
        self.test_stats_endpoint()
        
        # Test authentication
        if self.test_register_user():
            self.test_get_current_user()
            self.test_invalid_login()
            
            # Test writeups
            success, writeup_id = self.test_create_writeup()
            if success:
                self.test_get_writeup_by_id(writeup_id)
                self.test_vote_writeup(writeup_id)
                
                # Test comments
                success, comment_id = self.test_create_comment(writeup_id)
                if success:
                    self.test_get_comments(writeup_id)
            
            self.test_get_writeups()
            self.test_get_featured_writeups()
            self.test_search_writeups()
            
            # Test resources
            success, resource_id = self.test_create_resource()
            self.test_get_resources()
            
            # Test other endpoints
            self.test_contact_form()
            self.test_unauthorized_endpoints()
        else:
            print("⚠️  Registration failed, skipping authenticated tests")

        # Print results
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            return 1

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": f"{(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "0%",
            "test_results": self.test_results
        }

def main():
    tester = CTFWriteupAPITester()
    exit_code = tester.run_all_tests()
    
    # Save detailed results
    summary = tester.get_test_summary()
    print(f"\n📋 Test Summary:")
    print(f"   Success Rate: {summary['success_rate']}")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())