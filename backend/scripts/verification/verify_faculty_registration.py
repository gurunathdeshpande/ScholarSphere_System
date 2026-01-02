import requests
import json
import time
import random

BASE_URL = "http://localhost:5000/api"

TIMESTAMP = int(time.time())
RND = random.randint(1000, 9999)
UNKNOWN_FACULTY_EMAIL = f"unknown_fac_{TIMESTAMP}_{RND}@test.com"
UNKNOWN_USERNAME = f"Unknown Prof {RND}"
ADMIN_TOKEN = None

def run_verification_test():
    print("Test: Faculty Verification Workflow")

    # 1. Login as Admin (Need an admin account)
    # Assuming one exists or we create one.
    # We'll rely on the one created previously or create a new one.
    setup_admin()
    
    # 2. Test Public Search (Should indicate not found or found)
    print("Testing Public Search...")
    r = requests.get(f"{BASE_URL}/faculty/search-public?name=Unknown")
    # This might return results, but our specific unknown email user shouldn't exist
    
    # 3. Attempt Registration as Unknown Faculty (Should Fail)
    print(f"Attempting to register unknown faculty: {UNKNOWN_FACULTY_EMAIL}")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": UNKNOWN_USERNAME, 
        "email": UNKNOWN_FACULTY_EMAIL, 
        "password": "password", 
        "role": "faculty"
    })
    
    if r.status_code == 403 and r.json().get('code') == 'FACULTY_NOT_FOUND':
        print("PASS: Registration Blocked (403 FACULTY_NOT_FOUND) as expected.")
    else:
        print(f"FAIL: Registration NOT blocked! Status: {r.status_code}, Body: {r.text}")
        return

    # 4. Submit Verification Request
    print("Submitting verification request...")
    r = requests.post(f"{BASE_URL}/verification/request", json={
        "name": UNKNOWN_USERNAME,
        "email": UNKNOWN_FACULTY_EMAIL,
        "department": "Quantum Physics",
        "message": "Let me in!"
    })
    if r.status_code == 201:
        print("PASS: Request submitted.")
    else:
        print(f"FAIL: Request failed: {r.text}")
        return

    # 5. Admin Approves Request
    print("Admin reviewing requests...")
    headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    r = requests.get(f"{BASE_URL}/verification/admin/requests", headers=headers)
    reqs = r.json()
    target_req = next((req for req in reqs if req['email'] == UNKNOWN_FACULTY_EMAIL), None)
    
    if not target_req:
        print("FAIL: Verification request not found in Admin list.")
        return
    
    print(f"Approving request {target_req['id']}...")
    r = requests.post(f"{BASE_URL}/verification/admin/requests/{target_req['id']}/approve", headers=headers)
    if r.status_code == 200:
        print("PASS: Request Approved.")
    else:
        print(f"FAIL: Approval failed: {r.text}")
        return
        
    # 6. Retry Registration (Should Succeed)
    print("Retrying Registration...")
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": UNKNOWN_USERNAME, 
        "email": UNKNOWN_FACULTY_EMAIL, 
        "password": "password", 
        "role": "faculty"
    })
    
    if r.status_code == 201:
         print("PASS: Registration Succeeded after approval!")
    else:
         print(f"FAIL: Registration failed even after approval: {r.text}")

def setup_admin():
    global ADMIN_TOKEN
    
    # Try login as admin
    # "admin" / "admin123" is usually what I create in `create_admin.py` (which I saw earlier)
    # Let's verify `create_admin.py` content or just force create here.
    
    login_data = {"username": "admin", "password": "admin123"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    
    if r.status_code != 200:
        print("Admin login failed. Attempting to create admin...")
        # Create Admin
        # But auth/register blocks admin registration!
        # I must rely on `create_admin.py` or similar backchannel.
        # But wait, I have direct DB access via `venv/Scripts/python create_admin.py`.
        # Or I can just continue if I can't login, but the rest will fail.
        
        # Actually I can't run create_admin.py from here easily as a subprocess without complexity.
        # Let's assume `create_admin.py` was run?
        # Maybe the username is different?
        pass
    else:
        ADMIN_TOKEN = r.json()['access_token']
        print("Admin Logged In.")
        return

    # Try 'admin_user'
    login_data = {"username": "admin_user", "password": "securepassword123"}
    r = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    if r.status_code == 200:
        ADMIN_TOKEN = r.json()['access_token']
        print("Admin Logged In (as admin_user).")
    else:
        print("CRITICAL: Admin login failed completely.")

if __name__ == "__main__":
    try:
        run_verification_test()
    except Exception as e:
        print(f"Error: {e}")
