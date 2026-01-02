# ScholarSphere Backend

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Create a `.env` file in `backend/` with:
    ```
    DATABASE_URL=mysql://user:password@localhost/scholarsphere
    SECRET_KEY=your_secret_key
    JWT_SECRET_KEY=your_jwt_secret_key
    ```

3.  **Database Setup**:
    Ensure you have a MySQL database named `scholarsphere` running.
    ```bash
    # Initialize migrations
    flask db init
    
    # Create migration script
    flask db migrate -m "Initial migration"
    
    # Apply migrations
    flask db upgrade
    ```

4.  **Run Server**:
    ```bash
    python run.py
    ```

## API Endpoints

-   **Auth**: `/api/auth/login`, `/api/auth/register`, `/api/auth/me`
-   **Faculty**: `/api/faculty` (GET, POST, PUT, DELETE)
-   **Search**: `/api/search/all`, `/api/search/classify-domain`
-   **Analytics**: `/api/analytics/trends`
