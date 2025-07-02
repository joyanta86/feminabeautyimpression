import requests
import unittest
import os
import base64
import json
from io import BytesIO
from PIL import Image
import numpy as np

class BeautySalonAPITest(unittest.TestCase):
    def setUp(self):
        # Use the public endpoint from frontend/.env
        self.base_url = "https://10dac800-fdee-40b4-9c27-e25ccbac1c86.preview.emergentagent.com"
        self.admin_credentials = {
            "username": "admin",
            "password": "beauty123"
        }
        self.token = None
        
    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        print("✅ Health check endpoint is working")
        
    def test_02_admin_login_success(self):
        """Test successful admin login"""
        print("\n🔍 Testing admin login with correct credentials...")
        response = requests.post(
            f"{self.base_url}/api/admin/login",
            json=self.admin_credentials
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("token_type", data)
        self.assertEqual(data["token_type"], "bearer")
        
        # Save token for later tests
        self.token = data["access_token"]
        print("✅ Admin login successful")
        
    def test_03_admin_login_failure(self):
        """Test failed admin login"""
        print("\n🔍 Testing admin login with incorrect credentials...")
        wrong_credentials = {
            "username": "wrong_user",
            "password": "wrong_pass"
        }
        response = requests.post(
            f"{self.base_url}/api/admin/login",
            json=wrong_credentials
        )
        self.assertEqual(response.status_code, 401)
        print("✅ Admin login fails with incorrect credentials")
        
    def test_04_get_gallery(self):
        """Test getting gallery images"""
        print("\n🔍 Testing gallery retrieval...")
        response = requests.get(f"{self.base_url}/api/gallery")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        print(f"✅ Gallery retrieval successful. Found {len(data)} images.")
        
    def test_05_upload_image(self):
        """Test image upload functionality"""
        print("\n🔍 Testing image upload...")
        
        # Skip if no token
        if not self.token:
            print("❌ No authentication token available")
            self.skipTest("No authentication token available")
            
        # Create a test image
        img_array = np.zeros((100, 100, 3), dtype=np.uint8)
        img_array[:50, :50] = [255, 0, 0]  # Red square
        img = Image.fromarray(img_array)
        img_buffer = BytesIO()
        img.save(img_buffer, format="JPEG")
        img_buffer.seek(0)
        
        # Prepare the upload
        files = {
            'file': ('test_image.jpg', img_buffer, 'image/jpeg')
        }
        data = {
            'description': 'Test image upload'
        }
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        
        print(f"Token: {self.token[:10]}...")
        print(f"URL: {self.base_url}/api/gallery")
        
        # Upload the image
        try:
            response = requests.post(
                f"{self.base_url}/api/gallery",
                files=files,
                data=data,
                headers=headers
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response content: {response.text}")
            
            self.assertEqual(response.status_code, 200)
            result = response.json()
            self.assertIn("message", result)
            self.assertIn("id", result)
            self.assertEqual(result["message"], "Image uploaded successfully")
            
            # Save image ID for deletion test
            self.image_id = result["id"]
            print(f"✅ Image upload successful. Image ID: {self.image_id}")
        except Exception as e:
            print(f"❌ Error during image upload: {str(e)}")
            raise
        
    def test_06_delete_image(self):
        """Test image deletion"""
        print("\n🔍 Testing image deletion...")
        
        # Skip if no token or image_id
        if not hasattr(self, 'token') or not self.token:
            self.skipTest("No authentication token available")
        if not hasattr(self, 'image_id'):
            self.skipTest("No image ID available for deletion")
            
        headers = {
            'Authorization': f'Bearer {self.token}'
        }
        
        response = requests.delete(
            f"{self.base_url}/api/gallery/{self.image_id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn("message", result)
        self.assertEqual(result["message"], "Image deleted successfully")
        print("✅ Image deletion successful")
        
    def test_07_chat_functionality(self):
        """Test chat functionality"""
        print("\n🔍 Testing chat functionality...")
        
        chat_data = {
            "message": "Hello, can you tell me about your services?",
            "session_id": None
        }
        
        response = requests.post(
            f"{self.base_url}/api/chat",
            json=chat_data
        )
        
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn("response", result)
        self.assertIn("session_id", result)
        self.assertIsNotNone(result["session_id"])
        print("✅ Chat functionality working")
        
    def test_08_unauthorized_image_upload(self):
        """Test unauthorized image upload"""
        print("\n🔍 Testing unauthorized image upload...")
        
        # Create a test image
        img_array = np.zeros((100, 100, 3), dtype=np.uint8)
        img_array[:50, :50] = [0, 255, 0]  # Green square
        img = Image.fromarray(img_array)
        img_buffer = BytesIO()
        img.save(img_buffer, format="JPEG")
        img_buffer.seek(0)
        
        # Prepare the upload without token
        files = {
            'file': ('test_image.jpg', img_buffer, 'image/jpeg')
        }
        data = {
            'description': 'Unauthorized test image'
        }
        
        # Upload the image without token
        response = requests.post(
            f"{self.base_url}/api/gallery",
            files=files,
            data=data
        )
        
        self.assertEqual(response.status_code, 401)
        print("✅ Unauthorized image upload correctly rejected")

if __name__ == "__main__":
    # Add more verbose output for debugging
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--debug':
        # Run specific test for debugging
        suite = unittest.TestSuite()
        suite.addTest(BeautySalonAPITest('test_05_upload_image'))
        unittest.TextTestRunner(verbosity=2).run(suite)
    else:
        unittest.main(argv=['first-arg-is-ignored'], exit=False)