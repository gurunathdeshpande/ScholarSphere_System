import requests
import json
import time

BASE_URL = "http://localhost:5000/api"

def run_test():
    print("Test: Collaboration Flow")
    
    # 1. Register Student
    student_email = "test_student_collab@test.com"
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "Test Student",
        "email": student_email,
        "password": "password",
        "role": "student"
    })
    token = None
    if r.status_code == 201:
        # User created, now login
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "Test Student",
            "password": "password"
        })
        student_token = r.json()['access_token']
    elif r.status_code == 400 and "already exists" in r.text:
        print("Student already exists, logging in...")
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "Test Student", # Note: username must match what matches existing email? 
            # Risk: previous run random email. 
            # Fix: Use constant email for test script.
            "password": "password"
        })
        if r.status_code == 200:
             student_token = r.json()['access_token']
        else:
             print(f"Login failed: {r.text}")
             return
    else:
        print(f"Failed to register student: {r.text}")
        return
    
    # 2. Register Faculty
    faculty_email = "test_faculty_collab@test.com"
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "Test Faculty",
        "email": faculty_email,
        "password": "password",
        "role": "faculty"
    })

    if r.status_code == 201:
        r = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "Test Faculty",
            "password": "password"
        })
        faculty_token = r.json()['access_token']
    elif r.status_code == 400 and "already exists" in r.text:
         print("Faculty already exists, logging in...")
         r = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "Test Faculty",
            "password": "password"
        })
         if r.status_code == 200:
             faculty_token = r.json()['access_token']
         else:
             print(f"Faculty login failed: {r.text}")
             return
    else:
        print(f"Failed to register faculty: {r.text}")
        return
    
    # 3. Create Faculty Profile
    # We need a faculty profile to request against
    headers_fac = {"Authorization": f"Bearer {faculty_token}"}
    r = requests.post(f"{BASE_URL}/faculty", json={
        "name": "Prof. Test",
        "department": "CSE",
        "title": "Professor",
        "institution": "Test Inst"
    }, headers=headers_fac)
    
    # Check if profile created or already linked
    # If 400 (already linked), get profile.
    
    # Let's get "My Profile" to find the ID
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers_fac)
    faculty_id = r.json()['faculty_id'] # Should be in user object now
    
    if not faculty_id:
        # Create it
        r = requests.post(f"{BASE_URL}/faculty", json={
             "name": "Prof. Test",
             "department": "CSE",
             "title": "Professor", 
             "institution": "Test Inst"
        }, headers=headers_fac)
        faculty_id = r.json()['id']

    print(f"Faculty ID: {faculty_id}")

    # 4. Student Sends Request
    headers_stu = {"Authorization": f"Bearer {student_token}"}
    r = requests.post(f"{BASE_URL}/collaboration/request", json={
        "faculty_id": faculty_id,
        "project_interest": "AI Research",
        "message": "I want to join."
    }, headers=headers_stu)
    
    if r.status_code == 201:
        req_id = r.json()['id']
        print(f"Request Sent! ID: {req_id}")
    else:
        print(f"Failed to send request: {r.text}")
        return

    # 5. Faculty Sees Request
    r = requests.get(f"{BASE_URL}/collaboration/faculty/requests", headers=headers_fac)
    if r.status_code == 200:
        reqs = r.json()
        print(f"Faculty Inbox: found {len(reqs)} requests")
        my_req = next((x for x in reqs if x['id'] == req_id), None)
        if my_req:
            print("Request verification successful.")
        else:
            print("Request not found in inbox.")
    else:
        print(f"Failed to fetch requests: {r.text}")

    # 6. Faculty Replies
    r = requests.post(f"{BASE_URL}/collaboration/{req_id}/reply", json={
        "message": "Sure, let's talk."
    }, headers=headers_fac)
    
    if r.status_code == 201:
        print("Reply Sent successfully.")
    else:
        print(f"Failed to reply: {r.text}")
        
    # 7. Student Sees Message
    r = requests.get(f"{BASE_URL}/collaboration/{req_id}/messages", headers=headers_stu)
    if r.status_code == 200:
        msgs = r.json()
        print(f"Chat History: {len(msgs)} messages found.")
        print(msgs)
    else:
        print(f"Failed to get messages: {r.text}")


if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"Error: {e}")
