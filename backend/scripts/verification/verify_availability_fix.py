import requests
import uuid
import time

BASE_URL = "http://localhost:5000/api"

def run_test():
    print("Test: Verify Unlinked Faculty Availability")
    
    # 1. Login Admin
    admin_token = None
    for pwd in ["admin123", "adminpassword"]:
        r = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": pwd, "role": "admin"})
        if r.status_code == 200:
            admin_token = r.json()['access_token']
            print("Admin logged in.")
            break
            
    if not admin_token:
        print("FAIL: Could not login as admin.")
        return

    # 2. Submit Verification Request (to create new faculty)
    unique_name = f"Prof. Ghost {uuid.uuid4().hex[:4]}"
    email = f"ghost_{uuid.uuid4().hex[:4]}@test.com"
    
    r = requests.post(f"{BASE_URL}/verification/request", json={
        "name": unique_name,
        "email": email,
        "department": "Paranormal Studies",
        "message": "I exist but have no user account."
    })
    if r.status_code != 201:
        print(f"FAIL: Request submission failed: {r.text}")
        return
        
    # 3. Approve Request (Creates Faculty, user_id=None)
    # Need ID.
    headers_admin = {"Authorization": f"Bearer {admin_token}"}
    r = requests.get(f"{BASE_URL}/verification/admin/requests?status=Pending", headers=headers_admin)
    reqs = r.json()
    target_req = next((x for x in reqs if x['email'] == email), None)
    
    if not target_req:
        print("FAIL: Verification request not found.")
        return
        
    r = requests.post(f"{BASE_URL}/verification/admin/requests/{target_req['id']}/approve", headers=headers_admin)
    if r.status_code != 200:
        print(f"FAIL: Approval failed: {r.text}")
        return
    print(f"Approved {unique_name}. Faculty record created.")
    
    # 4. Search as Student
    # Login as student (create temp)
    stu_name = f"stu_{uuid.uuid4().hex[:4]}"
    requests.post(f"{BASE_URL}/auth/register", json={"username": stu_name, "email": f"{stu_name}@test.com", "password": "password", "role": "student"})
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": stu_name, "password": "password", "role": "student"})
    if r.status_code != 200:
         print(f"FAIL: Student login failed: {r.text}")
         return
    stu_token = r.json()['access_token']
    
    print("Searching for the ghost faculty...")
    headers_stu = {"Authorization": f"Bearer {stu_token}"}
    r = requests.get(f"{BASE_URL}/collaboration/available-faculty?q={unique_name}", headers=headers_stu)
    
    if r.status_code == 200:
        results = r.json()
        found = any(x['name'] == unique_name for x in results)
        if found:
            print("PASS: Unlinked Faculty found in search!")
        else:
            print(f"FAIL: Faculty {unique_name} NOT found in search results. Fix not working.")
            print(f"Results: {len(results)}")
    else:
        print(f"FAIL: Search API error: {r.text}")

if __name__ == "__main__":
    run_test()
