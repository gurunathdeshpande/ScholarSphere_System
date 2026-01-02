# ScholarSphere Execution Guide

This guide provides step-by-step instructions to set up and run the ScholarSphere project locally.

## Prerequisites
-   **Python**: 3.8 or higher
-   **Node.js**: 16 or higher
-   **MySQL**: 8.0 or higher
-   **Git**

---

## 1. Backend Setup (Flask + MySQL + ML)

### 1.1 Environment Setup
Navigate to the `backend` directory and create a virtual environment:
```bash
cd backend
python -m venv venv
```

Activate the virtual environment:
-   **Windows**: `venv\Scripts\activate`
-   **Mac/Linux**: `source venv/bin/activate`

### 1.2 Install Dependencies
Install the required Python packages:
```bash
pip install -r requirements.txt
```
*Note: This includes Flask, SQLAlchemy, PyTorch, Transformers, and other ML dependencies.*

### 1.3 Configure Environment Variables
Create a `.env` file in the `backend` directory with the following content:
```ini
# Database Configuration
DATABASE_URL=mysql://root:your_password@localhost/scholarsphere

# Security
SECRET_KEY=your_super_secret_key
JWT_SECRET_KEY=your_jwt_secret_key

# Optional: ML Configuration
TRANSFORMERS_CACHE=./.cache
```
*Replace `root:your_password` with your actual MySQL credentials.*

### 1.4 Database Setup
1.  Open your MySQL client (Workbench, CLI, etc.).
2.  Create the database:
    ```sql
    CREATE DATABASE scholarsphere;
    ```
3.  Initialize and apply migrations:
    ```bash
    flask db init
    flask db migrate -m "Initial migration"
    flask db upgrade
    ```

### 1.5 Start the Backend Server
Run the Flask application:
```bash
python run.py
```
The server will start at `http://localhost:5000`.

---

## 2. Frontend Setup (React JS)

### 2.1 Install Dependencies
Open a new terminal, navigate to the `frontend` directory, and install dependencies:
```bash
cd frontend
npm install
```

### 2.2 Configure API URL
By default, the frontend is configured to talk to `http://localhost:5000`.
If you need to change this, edit `src/services/api.js`:
```javascript
const API_URL = 'http://localhost:5000/api';
```

### 2.3 Start the Development Server
Run the React application:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173` (or the port shown in the terminal).

---

## 3. Verification Steps

### 3.1 Verify Authentication
1.  Go to `http://localhost:5173`.
2.  Click **Register** and create a new account.
3.  You should be redirected to **Login**.
4.  Log in with your new credentials.
5.  **Success**: You are redirected to the Home page, and "Signed in as: [username]" appears in the navbar.
6.  Check `localStorage` in browser dev tools to see the `token`.

### 3.2 Verify Search & Analytics
1.  **Analytics**: On the Home page, you should see "Research Trends". If the database is empty, it will say "No trends available".
2.  **Search**: Go to the **Search** page.
    -   Enter a query (e.g., "AI").
    -   Click Search.
    -   **Success**: Results tabs (Faculty, Publications, Research) should appear (even if empty).

### 3.3 Verify Faculty Scraper
1.  Use a tool like Postman or curl (or build a UI button if you prefer).
2.  **Endpoint**: `POST http://localhost:5000/api/faculty/scrape`
3.  **Headers**: `Authorization: Bearer <your_jwt_token>`
4.  **Success**: Returns `{"message": "Faculty data scraping started", ...}`.
5.  Check the server logs to see scraping progress.

### 3.4 Verify ML Pipeline
1.  The ML pipeline runs automatically during scraping to classify publications.
2.  To test manually:
    -   **Endpoint**: `POST http://localhost:5000/api/search/classify-domain`
    -   **Body**: `{"texts": ["Deep learning approaches for image recognition"]}`
    -   **Success**: Returns `{"results": [{"domains": ["Computer Vision", "Machine Learning"], ...}]}`.
