import requests

BASE_URL = "http://localhost:5000/api"

def test_search():
    print("Test: Public Faculty Search")
    # Search for something that likely exists (e.g. from seed data or real scrape)
    # "Sharma" is common, or "Gupta"
    # Or strict faculty we created earlier "Strict Faculty"
    query = "Strict"
    r = requests.get(f"{BASE_URL}/faculty/search-public?name={query}")
    
    print(f"Status: {r.status_code}")
    print(f"Results: {len(r.json())}")
    for f in r.json():
        print(f" - {f['name']} ({f['department']}) [Reg: {f['user_id'] is not None}]")

if __name__ == "__main__":
    test_search()
