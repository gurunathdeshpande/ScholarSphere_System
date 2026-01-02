from app.services.scraper import IRINSScraper
import logging

logging.basicConfig(level=logging.INFO)

print("--- STARTING TEST ---")
try:
    scraper = IRINSScraper("https://msrit.irins.org/")
    
    # Test specific department
    dept_url = "https://msrit.irins.org/faculty/index/Department+of+Aerospace+Engineering"
    print(f"Testing Department: {dept_url}")
    faculty_list = scraper.extract_faculty_from_department(dept_url, "TEST_DEPT")
    
    if faculty_list:
        f = faculty_list[0]
        print("First extracted faculty:")
        print(f"Name: {f['name']}")
        print(f"Interests: {f['research_interests']}")
        print(f"Publications Count: {len(f['publications'])}")
        if f['publications']:
            print(f"Sample Pub: {f['publications'][0]}")
    else:
        print("No faculty found in department.")

except Exception as e:
    print(f"EXCEPTION CAUGHT: {e}")
print("--- END TEST ---")
