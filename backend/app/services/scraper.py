import requests
from bs4 import BeautifulSoup
import time
import logging
from typing import Dict, List, Optional
import re
from urllib.parse import urljoin
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class IRINSScraper:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.faculty_data = []
        self.department_counter = {}
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch a page and return its BeautifulSoup object"""
        try:
            response = self.session.get(url, headers=self.headers)
            response.raise_for_status()
            return BeautifulSoup(response.text, 'html.parser')
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    def extract_departments(self, soup: BeautifulSoup) -> List[Dict]:
        """Extract department links from the main page"""
        departments = []
        try:
            # More robust approach: Find all links containing 'faculty/index/Department'
            # This avoids dependency on specific container classes which seem to have changed
            for link in soup.find_all('a', href=True):
                href = link['href']
                if 'faculty/index/Department' in href:
                    dept_name = link.text.strip()
                    # Filter out short or irrelevant links if any
                    if len(dept_name) > 3: 
                        dept_url = urljoin(self.base_url, href)
                        
                        # Avoid duplicates
                        if not any(d['url'] == dept_url for d in departments):
                            departments.append({
                                'name': dept_name,
                                'url': dept_url
                            })
                            logger.info(f"Found department: {dept_name}")
                            print(f"DEBUG: Found department: {dept_name}")

            if not departments:
                logger.error("Could not find any department links using pattern matching")
                print("DEBUG: No departments found via pattern.")

        except Exception as e:
            logger.error(f"Error extracting departments: {str(e)}")

        return departments

    def extract_faculty_from_department(self, dept_url: str, dept_name: str) -> List[Dict]:
        """Extract faculty information from a department page, handling pagination"""
        faculty_list = []
        page = 1
        max_pages = 20 # Safety limit
        
        while page <= max_pages:
            try:
                # Append page parameter if not first page or always
                # IRINS usually uses /index/Department/page/X or ?page=X
                # Let's try appending /page/X if standard url
                
                if page == 1:
                    current_url = dept_url
                else:
                    # Heuristic for pagination URL construction
                    if '?' in dept_url:
                        current_url = f"{dept_url}&page={page}"
                    else:
                         current_url = f"{dept_url}/page/{page}"
                
                logger.info(f"Scraping {dept_name} - Page {page}")
                soup = self.get_page(current_url)
                if not soup:
                    break
                
                page_faculty = []
                seen_urls = set()
                
                # Check for "No results" or similar if IRINS has it
                # or just check if we find zero new profiles
                
                for link in soup.find_all('a', href=True):
                    href = link['href']
                    if '/profile/' in href and 'index' not in href:
                        profile_url = urljoin(self.base_url, href)
                        
                        if profile_url in seen_urls:
                            continue
                        
                        # Check strictly if this is a profile ID (usually numeric) to avoid random links
                        if not re.search(r'/profile/\d+$', href):
                             continue

                        try:
                            # Only extract if we haven't seen this URL in the GLOBAL list for this department run?
                            # For now, just page level check + global uniqueness in DB handles the rest.
                            
                            faculty_data = self.extract_faculty_profile(profile_url, dept_name)
                            if faculty_data:
                                page_faculty.append(faculty_data)
                                seen_urls.add(profile_url)
                                self.department_counter[dept_name] = self.department_counter.get(dept_name, 0) + 1
                                logger.info(f"Extracted: {faculty_data['name']}")
                                
                        except Exception as e:
                            logger.error(f"Error processing faculty {profile_url}: {e}")
                            continue

                if not page_faculty:
                    logger.info(f"No faculty found on page {page}, stopping pagination for {dept_name}")
                    break
                
                faculty_list.extend(page_faculty)
                page += 1
                
                # Optional: Check if there is a 'Next' button to be sure, otherwise we rely on empty list
                # next_link = soup.find('a', text=re.compile('Next|>', re.I))
                # if not next_link: break
                
            except Exception as e:
                logger.error(f"Error on page {page} of {dept_name}: {e}")
                break

        return faculty_list

    def extract_faculty_profile(self, profile_url: str, department: str) -> Optional[Dict]:
        """Extract detailed information from a faculty profile page"""
        try:
            soup = self.get_page(profile_url)
            if not soup:
                return None
            
            text_content = soup.get_text()

            # 1. Name
            name = "Unknown"
            name_tag = soup.find('h1') or soup.find('div', class_='user-name')
            if name_tag:
                name = name_tag.text.strip()
            
            # 2. Photo
            photo_url = None
            # Try multiple common IRINS selectors
            img_candidates = [
                soup.select_one('div.profile-image img'),
                soup.find('img', class_='img-circle'),
                soup.select_one('div.user-image img'),
                soup.select_one('.sidebar-wrapper img'),
                soup.find('img', alt=re.compile('profile', re.I))
            ]
            
            for img in img_candidates:
                if img and img.get('src'):
                    potential_url = img.get('src')
                    # Filter out default/placeholder images if possible
                    if 'default' not in potential_url.lower() and 'avatar' not in potential_url.lower():
                         photo_url = urljoin(self.base_url, potential_url)
                         break
            
            if not photo_url and img_candidates[0]: # Fallback to first found even if default-like
                 photo_url = urljoin(self.base_url, img_candidates[0].get('src'))

            # 3. Stats (Citations, H-Index) - Aggressive Regex
            citations = 0
            h_index = 0
            
            # Regex to find "Citations" followed by up to 10 characters and then a number
            cit_match = re.search(r'Citations\s*.{0,20}?\b(\d+)\b', text_content, re.IGNORECASE)
            if cit_match:
                citations = int(cit_match.group(1))
            
            # Regex for H-Index
            h_match = re.search(r'h-index\s*.{0,20}?\b(\d+)\b', text_content, re.IGNORECASE)
            if h_match:
                h_index = int(h_match.group(1))

            # 4. Research Interests
            research_interests = []
            interests_section = soup.find(string=re.compile("Expertise|Research Interest|Competence", re.I))
            if interests_section:
                container = interests_section.find_parent('div') or interests_section.find_parent('section')
                if container:
                    tags = container.find_all(['span', 'a'], class_=re.compile(r'label|tag|badge'))
                    research_interests = [t.text.strip() for t in tags if len(t.text.strip()) > 2]
            
            if not research_interests:
                 # Fallback: scan for comma separated text after "Expertise" label
                 match = re.search(r'(Expertise|Research Interests):\s*(.*)', text_content, re.IGNORECASE)
                 if match:
                     raw_interests = match.group(2).split('\n')[0] # Take first line
                     research_interests = [i.strip() for i in raw_interests.split(',') if len(i.strip()) > 3][:5]

            if not research_interests:
                research_interests = ["General"]

            # 5. Publications (Aggressive Search)
            publications = []
            
            # Strategy 1: Look for specific blocks (publications list)
            # IRINS usually puts them in a list.
            list_items = soup.find_all(['div', 'li', 'tr'])
            
            for item in list_items:
                text = item.get_text().strip()
                # Heuristic: A publication usually has a year (1990-2030) and is long enough
                year_match = re.search(r'\b(19|20)\d{2}\b', text)
                if year_match and len(text) > 30 and len(text) < 500:
                    # Filter out noise (menu items with years, etc)
                    if any(x in text.lower() for x in ['copyright', 'reserved', 'view all']):
                        continue
                        
                    # Extract Year
                    year = int(year_match.group(0))
                    
                    # Extract Title (Roughly the start of the text)
                    # We assume title is the first significant part
                    title = text.split(str(year))[0].strip().strip(',.-')
                    if len(title) > 10:
                        publications.append({
                            'title': title,
                            'year': year,
                            'venue': "Unknown Venue", # Hard to parse reliability without structure
                            'research_domains': research_interests
                        })

            # Dedup publications based on title
            unique_pubs = {p['title']: p for p in publications}.values()
            publications = list(unique_pubs)

            return {
                'name': name,
                'department': department,
                'profile_url': profile_url,
                'photo_url': photo_url,
                'research_interests': research_interests,
                'publications': publications,
                'citations': citations,
                'h_index': h_index,
                'scraped_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error extracting faculty profile from {profile_url}: {str(e)}")
            return None

    def scrape_all(self) -> Dict:
        """Main scraping function"""
        try:
            # Get the main page
            soup = self.get_page(self.base_url)
            if not soup:
                raise Exception("Could not fetch main page")

            # Extract departments
            departments = self.extract_departments(soup)
            logger.info(f"Found {len(departments)} departments")

            # Process each department
            for dept in departments:
                logger.info(f"Processing department: {dept['name']}")
                faculty_list = self.extract_faculty_from_department(dept['url'], dept['name'])
                self.faculty_data.extend(faculty_list)
                
                # Add a small delay between departments
                time.sleep(2)

            return {
                'faculty': self.faculty_data,
                'department_stats': self.department_counter,
                'total_faculty': len(self.faculty_data),
                'total_departments': len(departments)
            }

        except Exception as e:
            logger.error(f"Error in main scraping function: {str(e)}")
            return {
                'error': str(e),
                'faculty': self.faculty_data,
                'department_stats': self.department_counter
            }
