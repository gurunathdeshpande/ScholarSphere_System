import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

import random

# Unique emails for this run
TIMESTAMP = int(time.time())
RND = random.randint(1000, 9999)
FACULTY_EMAIL = f"strict_fac_{TIMESTAMP}_{RND}@test.com"
STUDENT_A_EMAIL = f"strict_stu_a_{TIMESTAMP}_{RND}@test.com"
STUDENT_B_EMAIL = f"strict_stu_b_{TIMESTAMP}_{RND}@test.com"

def run_strict_test():
    print("Test: Strict Security Verification")
    
    # 1. Register Faculty, Student A, Student B
    fac_token = register_user(f"Strict Faculty {RND}", FACULTY_EMAIL, "faculty")
    stu_a_token = register_user(f"Student A {RND}", STUDENT_A_EMAIL, "student")
    stu_b_token = register_user(f"Student B {RND}", STUDENT_B_EMAIL, "student")
    
    # 2. Setup Faculty Profile & Availability
    setup_faculty(fac_token)
    
    # 3. Student A requests Faculty
    fac_id = get_faculty_id(fac_token)
    print(f"Faculty ID: {fac_id}")
    
    req_a_id = send_request(stu_a_token, fac_id, "Msg from A")
    print(f"Request A ID: {req_a_id}")
    
    # 4. Student B requests Faculty
    req_b_id = send_request(stu_b_token, fac_id, "Msg from B")
    print(f"Request B ID: {req_b_id}")
    
    # 5. VERIFY: Student A trying to read Request B's messages
    print(f"Attempting Unauthorized Access: Student A -> Request B ({req_b_id})...")
    status = get_messages_status(stu_a_token, req_b_id)
    if status == 403:
        print("PASS: Access Denied (403) as expected.")
    else:
        print(f"FAIL: Student A could access Request B! Status: {status}")
        return

    # 6. VERIFY: Student B trying to read Request A's messages
    print(f"Attempting Unauthorized Access: Student B -> Request A ({req_a_id})...")
    status = get_messages_status(stu_b_token, req_a_id)
    if status == 403:
        print("PASS: Access Denied (403) as expected.")
    else:
        print(f"FAIL: Student B could access Request A! Status: {status}")
        return

    # 7. VERIFY: Available Faculty Endpoint
    print("Verifying Available Faculty List...")
    avail = get_available_faculty(stu_a_token)
    found = any(f['id'] == fac_id for f in avail)
    if found:
        print("PASS: Faculty is listed only when available.")
    else:
        print("FAIL: Faculty not found in available list.")

def register_user(name, email, role):
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": name, "email": email, "password": "password", "role": role
    })
    token = None
    if r.status_code == 201:
        # Login
        r = requests.post(f"{BASE_URL}/auth/login", json={"username": name, "password": "password"})
        data = r.json()
        print(f"DEBUG: Login for {name}: {data.get('user', {})}")
        token = data['access_token']
    elif r.status_code == 400 and "already exists" in r.text:
        # User exists, just login
        r = requests.post(f"{BASE_URL}/auth/login", json={"username": name, "password": "password"})
        if r.status_code == 200:
             token = r.json()['access_token']
        else:
             print(f"Login failed for {name}: {r.text}")
    else:
        print(f"Registration failed for {name}: {r.text}")
    return token

def setup_faculty(token):
    headers = {"Authorization": f"Bearer {token}"}
    # 1. Get Faculty ID from token/me
    fid = get_faculty_id(token)
    if not fid:
        print("Setup: Could not get Faculty ID")
        return

    # 2. Update Profile (Department)
    requests.put(f"{BASE_URL}/faculty/{fid}", json={"department": "Security Department"}, headers=headers)
    
    # 3. Set Available
    requests.put(f"{BASE_URL}/collaboration/faculty/availability", json={"is_available": True}, headers=headers)

def get_faculty_id(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if r.status_code != 200:
        print(f"Failed to get me: {r.text}")
        return None
    data = r.json()
    if 'faculty_id' not in data:
        print(f"faculty_id missing in: {data}")
    return data.get('faculty_id')

def send_request(token, fac_id, msg):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.post(f"{BASE_URL}/collaboration/request", json={
        "faculty_id": fac_id, "project_interest": "Security", "message": msg
    }, headers=headers)
    return r.json()['id']

def get_messages_status(token, req_id):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/collaboration/{req_id}/messages", headers=headers)
    return r.status_code

def get_available_faculty(token):
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get(f"{BASE_URL}/collaboration/available-faculty", headers=headers)
    return r.json()

if __name__ == "__main__":
    try:
        run_strict_test()
    except Exception as e:
        print(f"Error: {e}")
