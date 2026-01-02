import requests
import json
import uuid

BASE_URL = "http://localhost:5000/api"

# Test Data
STUDENT_CREDS = {"username": "test_student", "password": "password", "role": "student"}
FACULTY_CREDS = {"username": "Dr. Smith", "password": "password", "role": "faculty"} 
# Assuming Dr. Smith exists from previous tests, else we might fail login if DB clean.
# Actually, I should use the admin token to verify things mostly.

ADMIN_TOKEN = None
STUDENT_TOKEN = None

def get_admin_token():
    try:
        # Try common passwords
        for pwd in ["admin123", "adminpassword", "securepassword123"]:
            r = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": pwd, "role": "admin"})
            if r.status_code == 200:
                print(f"Logged in with password: {pwd}")
                return r.json()['access_token']
        
        print(f"Admin Login Failed: {r.text}")
    except Exception as e:
        print(f"Connection Error: {e}")
    return None

def run_tests():
    global ADMIN_TOKEN
    print("Test 1: Admin Login & Token Fetch")
    ADMIN_TOKEN = get_admin_token()
    if not ADMIN_TOKEN:
         print("FAIL: Admin Token missing. Is backend running?")
         return

    print("PASS: Admin Logged In.")
    
    # Test 2: Strict Role Login (FAIL Case)
    print("\nTest 2: Strict Role Login (Failure Case)")
    # Use KNOWN good password
    # admin/admin123 (most likely)
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123", "role": "student"})
    if r.status_code == 403:
         print("PASS: Login rejected for incorrect role (403).")
    elif r.status_code == 401:
         print("FAIL: Got 401 (Wrong Password?) but expected 403 (Wrong Role). ensure 'admin123' is correct.")
    else:
         print(f"FAIL: Login should be 403, got {r.status_code}: {r.text}")

    # Test 3: Faculty Search (Public & Student)
    print("\nTest 3: Faculty Search API")
    r = requests.get(f"{BASE_URL}/faculty/search-public?name=Smith")
    if r.status_code == 200:
         print("PASS: Public Search operational.")
    else:
         print(f"FAIL: Public Search failed {r.status_code}")

    # Test 4: Collaboration Search (Student Role)
    # Need student token. Create one if needed.
    # Register temp student
    uname = f"temp_stu_{uuid.uuid4().hex[:6]}"
    requests.post(f"{BASE_URL}/auth/register", json={"username": uname, "email": f"{uname}@test.com", "password": "password", "role": "student"})
    
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": uname, "password": "password", "role": "student"})
    if r.status_code == 200:
        stu_token = r.json()['access_token']
        headers = {"Authorization": f"Bearer {stu_token}"}
        
        print("\nTest 4: Available Faculty Search")
        r = requests.get(f"{BASE_URL}/collaboration/available-faculty?q=Smith", headers=headers)
        if r.status_code == 200:
             print(f"PASS: Search Available Faculty returning {len(r.json())} results.")
        else:
             print(f"FAIL: Available Faculty Search failed {r.status_code}")
    else:
        print("FAIL: Could not login as student for collaboration test.")

if __name__ == "__main__":
    run_tests()
