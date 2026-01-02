# ScholarSphere Project - Complete Architecture & Workflow Guide

## 📋 Project Overview

**ScholarSphere** is a comprehensive **research management and collaboration platform** that aggregates faculty profiles, publications, and research trends. It enables:
- Faculty and student profile management
- Research collaboration matching and messaging
- Publication tracking and analytics
- Research trend analysis
- Forum discussions
- Academic verification system

---

## 🏗️ System Architecture

### Tech Stack
- **Backend**: Flask, SQLAlchemy ORM, MySQL, JWT Authentication, Marshmallow
- **Frontend**: React 19, Vite, React Router, Axios, Bootstrap, Recharts
- **ML/NLP**: Hugging Face Transformers (Zero-shot classification)
- **Database**: MySQL with migrations (Alembic)

---

## 📁 Folder Structure & Workflow

```
ScholarSphere/
├── backend/                 # Flask REST API
│   ├── run.py              # Entry point (python run.py)
│   ├── requirements.txt     # Python dependencies
│   ├── token.txt          # API tokens storage
│   ├── migrations/         # Database migrations (Alembic)
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   └── versions/       # Migration scripts
│   │
│   ├── scripts/            # Utility and setup scripts
│   │   ├── setup/          # Database initialization
│   │   │   ├── create_admin.py
│   │   │   ├── seed_data.py
│   │   │   ├── ensure_schema.py
│   │   │   └── ...
│   │   ├── maintenance/    # Maintenance tasks
│   │   │   ├── clean_and_scrape.py
│   │   │   └── fix_faculty_images.py
│   │   └── verification/   # Testing & verification
│   │
│   └── app/                # Main Flask application
│       ├── app.py          # Flask app factory
│       ├── config.py       # Configuration (DB, JWT, etc.)
│       ├── extensions.py   # Flask extensions (db, jwt, cors, etc.)
│       │
│       ├── auth/           # Authentication module
│       │   ├── routes.py   # /api/auth/* endpoints
│       │   ├── decorators.py # @role_required decorator
│       │   └── __init__.py
│       │
│       ├── models/         # Database models
│       │   ├── user.py            # User (with roles: student/faculty/admin)
│       │   ├── faculty.py         # Faculty profiles
│       │   ├── publication.py     # Publications & FacultyPublication (M2M)
│       │   ├── research_work.py   # Research projects/works
│       │   ├── collaboration.py   # Collaboration requests
│       │   ├── forum.py           # Forum topics & posts
│       │   ├── notification.py    # User notifications
│       │   ├── research_trend.py  # Trending research topics
│       │   └── verification.py    # Email verification
│       │
│       ├── routes/         # API route blueprints
│       │   ├── faculty.py       # /api/faculty/* (CRUD)
│       │   ├── search.py        # /api/search/* (text search, filtering, ML classification)
│       │   ├── analytics.py     # /api/analytics/* (trends, metrics, dashboards)
│       │   ├── collaboration.py # /api/collaboration/* (requests, matching, chat)
│       │   ├── forum.py         # /api/forum/* (topics, posts, comments)
│       │   ├── notifications.py # /api/notifications/* (user notifications)
│       │   ├── ai.py            # /api/ai/* (ML-powered features)
│       │   └── verification.py  # /api/verification/* (email verification)
│       │
│       ├── services/       # Business logic & utilities
│       │   ├── nlp.py            # NLP text summarization
│       │   ├── analytics_service.py # Analytics calculations
│       │   ├── recommendation.py  # Collaboration recommendations
│       │   ├── scraper.py        # Faculty/publication data scraping
│       │   └── __init__.py
│       │
│       ├── ml/            # Machine Learning models
│       │   └── domain_classifier.py # Zero-shot classification for research domains
│       │
│       ├── schemas/       # Marshmallow schemas (serialization)
│       │   └── schemas.py  # FacultySchema, PublicationSchema, etc.
│       │
│       └── __init__.py
│
└── frontend/              # React Vite application
    ├── vite.config.js     # Vite configuration
    ├── index.html         # HTML entry point
    ├── package.json       # Dependencies
    │
    └── src/
        ├── main.jsx       # React entry point (renders App)
        ├── App.jsx        # Main router & layout
        │
        ├── context/
        │   └── AuthContext.jsx # Global auth state (user, role, token)
        │
        ├── services/
        │   └── api.js     # Axios instance with JWT token handling
        │
        ├── components/
        │   ├── Navbar.jsx            # Navigation bar
        │   ├── ProtectedRoute.jsx    # Role-based route protection
        │   └── CollaborationChat.jsx # Real-time chat component
        │
        └── pages/
            ├── Home.jsx                        # Landing page
            ├── Login.jsx                       # Login form (role selection)
            ├── Register.jsx                    # Registration (role selection)
            ├── RequestVerification.jsx         # Request faculty verification
            │
            ├── Search.jsx                      # Faculty search with filters
            ├── FacultyDetails.jsx              # Individual faculty profile
            │
            ├── FacultyDashboard.jsx            # Faculty home (protected)
            ├── FacultyCollaborationDashboard.jsx # Faculty collaboration management
            │
            ├── StudentCollaborationDashboard.jsx # Student collaboration requests
            │
            ├── Forum.jsx                       # Forum topics list
            ├── ForumTopic.jsx                  # Forum topic details
            │
            ├── Analytics.jsx                   # Research trends & analytics
            └── AdminDashboard.jsx              # Admin management (protected)
```

---

## 🔄 Complete Data Flow & Workflows

### 1. **User Authentication & Registration Flow**

#### Registration Process:
```
Frontend (Register.jsx)
    ↓
User fills form + selects ROLE (Student/Faculty/Admin)
    ↓
POST /api/auth/register
    ↓
Backend (auth/routes.py)
    ├─ If FACULTY role:
    │   ├─ Check if email exists in Institution Records (Faculty table)
    │   ├─ If NOT found → REJECT (need verification)
    │   └─ If found → Create User + Link to Faculty record
    │
    ├─ If STUDENT role:
    │   └─ Create User directly (no pre-verification needed)
    │
    └─ If ADMIN role:
        └─ REJECT (admin registration restricted)
    ↓
User account created in `users` table
```

#### Login Process:
```
Frontend (Login.jsx)
    ↓
User enters Username + Password + ROLE
    ↓
POST /api/auth/login
    ↓
Backend (auth/routes.py)
    ├─ Find User by username
    ├─ Verify password
    ├─ STRICT CHECK: Verify role matches
    ├─ If Faculty: Fetch faculty_id from Faculty table
    └─ Create JWT token with claims:
        - sub (user_id)
        - role (student/faculty/admin)
        - faculty_id (if faculty)
    ↓
Frontend stores JWT in localStorage
    ↓
AuthContext decodes token & sets global user state
```

---

### 2. **Faculty Management & Search Workflow**

#### Faculty Data Model:
```
Faculty Table:
├─ id (UUID)
├─ name, title, department, institution
├─ email, user_id (link to User account)
├─ research_interests (JSON array)
├─ profile_image (text/base64)
├─ citations, h_index (academic metrics)
├─ google_scholar_url, orcid_id, irins_profile_url
├─ is_available_for_collaboration (boolean)
└─ publications (relationship → FacultyPublication → Publication)
```

#### Search Flow:
```
Frontend (Search.jsx)
    ↓
User enters search query + selects filters:
├─ Text search (name, department, institution)
├─ Department filter
├─ Institution filter
├─ Domain filter (research areas)
└─ Year range (for publications)
    ↓
POST/GET /api/search/all
    ↓
Backend (routes/search.py)
    ├─ Text search across Faculty, Publication, ResearchWork tables
    ├─ Apply department/institution filters
    ├─ Domain filtering via ML classifier (see below)
    ├─ Year filtering for publications
    └─ Sorting: by relevance, citations, h-index, name
    ↓
Results aggregated:
├─ Faculty profiles
├─ Publications
└─ Research Works
    ↓
Frontend displays results with pagination
```

#### ML Domain Classification:
```
Frontend user selects domain filter (e.g., "Machine Learning")
    ↓
GET /api/search/classify-domain?domain=Machine%20Learning
    ↓
Backend (routes/search.py + ml/domain_classifier.py)
    ├─ Load Hugging Face Zero-shot classifier
    ├─ Compare text against predefined research domains
    ├─ Classify publications/research works
    └─ Return matching records
    ↓
Frontend displays domain-filtered results
```

---

### 3. **Collaboration Request & Matching Workflow**

#### Student Initiates Collaboration:
```
Frontend (FacultyDetails.jsx or StudentCollaborationDashboard.jsx)
    ↓
Student views faculty profile → clicks "Request Collaboration"
    ↓
Form modal appears:
├─ Project Interest (text)
└─ Message (optional description)
    ↓
POST /api/collaboration/request
    ├─ Requires JWT token (student role)
    ├─ Creates CollaborationRequest record
    │   ├─ student_id (from JWT)
    │   ├─ faculty_id (form input)
    │   ├─ project_interest
    │   ├─ message
    │   └─ status: "Pending"
    └─ Check for duplicate pending requests
    ↓
Request saved to database
```

#### Faculty Reviews & Responds:
```
Frontend (FacultyCollaborationDashboard.jsx)
    ↓
Faculty views incoming requests
    ↓
GET /api/collaboration/faculty/requests
    ├─ Fetch all pending requests for this faculty
    ├─ Include student name, email, project interest, message
    └─ Order by most recent
    ↓
Faculty can:
├─ Accept request → PUT /api/collaboration/{request_id}/accept
│   └─ Status: "Pending" → "Accepted"
│
├─ Reject request → PUT /api/collaboration/{request_id}/reject
│   └─ Status: "Pending" → "Rejected"
│
└─ View collaboration details & chat history
    ↓
Real-time updates via CollaborationChat.jsx component
```

#### Collaboration Chat:
```
Accepted collaboration opens chat interface
    ↓
WebSocket/Polling: Messages stored in database
    ├─ Each message has:
    │   ├─ sender_id
    │   ├─ recipient_id
    │   ├─ content
    │   ├─ timestamp
    │   └─ is_read (boolean)
    ↓
Frontend (CollaborationChat.jsx)
    ├─ Displays message thread
    ├─ POST /api/collaboration/{collab_id}/messages
    └─ GET /api/collaboration/{collab_id}/messages
```

#### Collaboration Availability:
```
Faculty can set availability via:
    ↓
GET/PUT /api/collaboration/faculty/availability
    ├─ GET: Fetch current availability status
    └─ PUT: Update is_available_for_collaboration flag
    ↓
Used to show "Open for Collaboration" badge on frontend
```

---

### 4. **Research Trends & Analytics Workflow**

#### Data Collection:
```
Faculty profiles have:
├─ publications (many-to-many through FacultyPublication)
├─ research_interests (JSON)
└─ research_works (one-to-many)

Publication model:
├─ title, abstract, year
├─ citations, doi
└─ domain (inferred from abstract via ML)

ResearchWork model:
├─ title, description
├─ domain (research area)
└─ trending_score
```

#### Analytics Calculation:
```
GET /api/analytics/research
    ↓
Backend (routes/analytics.py + services/analytics_service.py)
    ├─ Total Metrics:
    │   ├─ Total Faculty count
    │   ├─ Total Publications count
    │   ├─ Total Citations (sum)
    │   └─ Average H-Index
    │
    ├─ Year-wise Research Output:
    │   └─ Query: Publications grouped by year
    │       ├─ Count per year
    │       └─ Citations per year (for trends chart)
    │
    ├─ Top Research Areas:
    │   └─ ResearchWorks grouped by domain
    │       ├─ Count per domain
    │       └─ Calculate growth_rate & trending_score
    │
    ├─ Department Stats:
    │   └─ Faculty grouped by department
    │       ├─ Count per department
    │       └─ Total citations per department
    │
    └─ Recent Activity:
        ├─ Latest faculty registrations
        └─ Latest publications
    ↓
Data returned as JSON
    ↓
Frontend (Analytics.jsx)
    ├─ Visualizes with Recharts:
    │   ├─ Line chart: Publications over time
    │   ├─ Bar chart: Faculty by department
    │   ├─ Pie chart: Top research areas
    │   └─ Cards: Key metrics (total faculty, publications, etc.)
    ↓
Dashboard updates on page load/refresh
```

#### Trending Research Topics:
```
ResearchTrend model:
├─ topic (string)
├─ trending_score (calculated)
├─ growth_rate
└─ updated_at

GET /api/analytics/trends?limit=5
    ├─ Query top trending topics
    └─ Sorted by trending_score (descending)
    ↓
Frontend displays trending topics widget
```

---

### 5. **Forum & Discussion Workflow**

#### Forum Structure:
```
Forum Tables:
├─ Topic
│   ├─ id, title, description
│   ├─ created_by (user_id)
│   ├─ created_at, updated_at
│   └─ posts (one-to-many relationship)
│
└─ Post
    ├─ id, topic_id, content
    ├─ created_by (user_id)
    ├─ created_at, updated_at
    └─ comments (one-to-many relationship)
```

#### Forum Workflow:
```
Frontend (Forum.jsx)
    ↓
GET /api/forum/topics
    ├─ Fetch all forum topics
    ├─ Include post count
    └─ Order by most recent
    ↓
Display topics list
    ↓
Click topic → ForumTopic.jsx
    ↓
GET /api/forum/topics/{topic_id}
    ├─ Fetch topic details
    ├─ Fetch all posts + comments
    └─ Nested structure
    ↓
Display topic with posts and comments
    ↓
User can:
├─ POST /api/forum/topics (create new topic)
├─ POST /api/forum/{topic_id}/posts (reply to topic)
├─ POST /api/forum/{post_id}/comments (comment on post)
└─ DELETE endpoints for own content
```

---

### 6. **Email Verification Workflow**

#### Faculty Verification Request:
```
Frontend (RequestVerification.jsx)
    ↓
Faculty enters email
    ↓
POST /api/verification/request
    ├─ Check if email already in institution records
    ├─ If not: Add to pending verification queue
    └─ Send verification email with token
    ↓
Email contains verification link with token
```

#### Verification Completion:
```
Faculty clicks email link (token in URL)
    ↓
GET /api/verification/verify?token=xyz
    ├─ Verify token validity
    ├─ Add faculty to Faculty table if valid
    └─ Mark email as verified
    ↓
Faculty can now register with that email
```

---

### 7. **Notification System Workflow**

#### Notification Types:
```
Notification model:
├─ id, user_id (recipient)
├─ type (e.g., "collaboration_accepted", "forum_reply", etc.)
├─ title, message, icon
├─ related_id (link to collaboration/post/etc.)
├─ is_read (boolean)
├─ created_at
└─ action_url (link to navigate to)
```

#### Notification Flow:
```
Event triggered (e.g., collaboration request accepted):
    ↓
Create Notification record
    ├─ POST /api/notifications (create)
    └─ Save to database
    ↓
Frontend (CollaborationChat.jsx component):
    ├─ GET /api/notifications (fetch unread)
    ├─ Display notification badge
    ├─ Show notification toast/modal
    └─ PUT /api/notifications/{id}/read (mark as read)
```

---

### 8. **Admin Dashboard Workflow**

```
Frontend (AdminDashboard.jsx)
    ↓
Only accessible with admin role (ProtectedRoute.jsx)
    ↓
Admin features:
├─ View all users (student/faculty/admin)
├─ Manage faculty verification requests
├─ View system statistics
├─ Delete inappropriate content (forum posts)
├─ Manage research domains/categories
└─ System health & analytics
    ↓
Endpoints (protected with @role_required('admin')):
├─ GET /api/admin/users
├─ PUT /api/admin/users/{id}/approve-verification
├─ DELETE /api/admin/forum/{post_id}
└─ GET /api/admin/statistics
```

---

## 🔐 Authentication & Authorization Flow

### JWT Token Structure:
```python
Token Claims:
{
    "sub": user_id,              # User ID (subject)
    "role": "student|faculty|admin",
    "faculty_id": "uuid" (if faculty),
    "exp": timestamp,            # Expiration
    "iat": timestamp             # Issued at
}
```

### Role-Based Access Control (RBAC):
```
Frontend:
├─ ProtectedRoute.jsx checks:
│   ├─ Token exists?
│   ├─ User role matches required role?
│   └─ If not → redirect to login
    ↓
Backend:
├─ @jwt_required decorator on routes
├─ @role_required('student'|'faculty'|'admin') on specific endpoints
└─ get_jwt_identity() retrieves user_id from token
    ↓
API Middleware:
├─ Validate token signature
├─ Check expiration
├─ Enforce role permissions
└─ Return 401/403 on auth failure
```

---

## 📊 Database Schema Overview

### Key Tables:
```
1. users
   ├─ id (PK), username, email, password_hash
   ├─ role (enum: student/faculty/admin)
   └─ Relationships: faculty (1:1), collaborations (1:many)

2. faculty
   ├─ id (UUID, PK), name, email, department, institution
   ├─ user_id (FK → users)
   ├─ research_interests (JSON)
   ├─ citations, h_index
   └─ Relationships: publications (many:many), collaborations (1:many)

3. publications
   ├─ id (PK), title, abstract, year
   ├─ doi, citations, domain
   └─ Relationships: faculty (many:many through faculty_publications)

4. faculty_publications (Junction Table)
   ├─ faculty_id (FK)
   └─ publication_id (FK)

5. collaboration_requests
   ├─ id (PK), student_id (FK), faculty_id (FK)
   ├─ project_interest, message, status
   └─ created_at, updated_at

6. forum_topics
   ├─ id (PK), title, description
   ├─ created_by (FK → users)
   └─ Relationships: posts (1:many)

7. forum_posts
   ├─ id (PK), topic_id (FK), content
   ├─ created_by (FK → users)
   └─ Relationships: comments (1:many)

8. research_works
   ├─ id (PK), title, description, domain
   ├─ created_by (FK → users)
   └─ trending_score

9. research_trends
   ├─ id (PK), topic, trending_score, growth_rate
   └─ updated_at

10. notifications
    ├─ id (PK), user_id (FK)
    ├─ type, title, message, related_id
    ├─ is_read, created_at
    └─ action_url
```

---

## 🚀 API Endpoint Summary

### Auth Routes
```
POST   /api/auth/register           # Create new user
POST   /api/auth/login              # Login & get JWT token
GET    /api/auth/me                 # Get current user profile
```

### Faculty Routes
```
GET    /api/faculty                 # List all faculty
GET    /api/faculty/{id}            # Get faculty details
POST   /api/faculty                 # Create faculty (admin only)
PUT    /api/faculty/{id}            # Update faculty (admin/self)
DELETE /api/faculty/{id}            # Delete faculty (admin only)
```

### Search Routes
```
GET    /api/search/all              # Search faculty/publications/research
GET    /api/search/filter-options   # Get available filters
POST   /api/search/classify-domain  # ML domain classification
```

### Collaboration Routes
```
POST   /api/collaboration/request            # Student sends request
GET    /api/collaboration/faculty/requests   # Faculty views requests
PUT    /api/collaboration/{id}/accept        # Faculty accepts
PUT    /api/collaboration/{id}/reject        # Faculty rejects
GET    /api/collaboration/faculty/availability
PUT    /api/collaboration/faculty/availability
POST   /api/collaboration/{id}/messages      # Send message
GET    /api/collaboration/{id}/messages      # Get message history
```

### Analytics Routes
```
GET    /api/analytics/research      # Research analytics & metrics
GET    /api/analytics/trends        # Trending topics
```

### Forum Routes
```
GET    /api/forum/topics            # List all topics
POST   /api/forum/topics            # Create new topic
GET    /api/forum/topics/{id}       # Get topic with posts
POST   /api/forum/{topic_id}/posts  # Create post
POST   /api/forum/{post_id}/comments # Create comment
DELETE /api/forum/posts/{id}        # Delete post
```

### Notifications Routes
```
GET    /api/notifications           # Fetch notifications
PUT    /api/notifications/{id}/read # Mark as read
DELETE /api/notifications/{id}      # Delete notification
```

### Verification Routes
```
POST   /api/verification/request    # Request email verification
GET    /api/verification/verify     # Verify token & confirm email
```

### Admin Routes
```
GET    /api/admin/users             # List all users
PUT    /api/admin/users/{id}/...    # Manage users
GET    /api/admin/statistics        # System statistics
```

---

## 🔄 Request-Response Cycle Example: Searching Faculty

### Frontend Request:
```javascript
// Search.jsx
const response = await axios.get('/api/search/all', {
  params: {
    q: "machine learning",
    departments: "Computer Science",
    limit: 20,
    page: 1,
    sort_by: "relevance"
  },
  headers: {
    Authorization: `Bearer ${token}`  // JWT token
  }
});
```

### Backend Processing:
```python
# routes/search.py
@search_bp.route('/all', methods=['GET'])
def search_all():
    query = request.args.get('q')
    departments = request.args.get('departments').split(',')
    
    # Query Faculty table with text search
    faculty_q = Faculty.query.filter(
        or_(
            Faculty.name.like(f'%{query}%'),
            Faculty.department.like(f'%{query}%')
        )
    ).filter(Faculty.department.in_(departments))
    
    # Query Publications
    pub_q = Publication.query.filter(
        Publication.abstract.like(f'%{query}%')
    )
    
    # Apply sorting, pagination
    results = {
        'faculty': [schema.dump(f) for f in faculty_q.all()],
        'publications': [schema.dump(p) for p in pub_q.all()]
    }
    
    return jsonify(results)
```

### Frontend Display:
```javascript
// Search.jsx
setResults(response.data);
// Display faculty cards with image, name, department, citations
// Display publication list with title, abstract summary, citations
```

---

## 📁 Key File Purposes

### Backend Core Files:
- **app.py**: Flask app factory, initializes extensions, registers blueprints
- **config.py**: Database URL, JWT secrets, environment variables
- **extensions.py**: SQLAlchemy ORM, JWT-Manager, CORS, Marshmallow

### Frontend Core Files:
- **main.jsx**: React entry point (mounts App to DOM)
- **App.jsx**: Routes definition, layout wrapper
- **AuthContext.jsx**: Global authentication state & JWT handling
- **api.js**: Axios instance with default headers & interceptors

### Utility Scripts:
- **scripts/setup/seed_data.py**: Populate database with sample data
- **scripts/setup/create_admin.py**: Create admin user
- **scripts/maintenance/clean_and_scrape.py**: Data cleanup & scraping

---

## 🔗 Data Flow Summary Diagram

```
User Registration/Login
    ↓
JWT Token Generated & Stored (Frontend localStorage)
    ↓
AuthContext Global State Updated
    ↓
Protected Routes Check Role & Redirect if Needed
    ↓
API Requests Include Authorization Header
    ↓
Backend Validates Token & Role
    ↓
Database Queries Execute (Models → SQLAlchemy)
    ↓
Marshmallow Schemas Serialize Response
    ↓
JSON Response Returned to Frontend
    ↓
Frontend Updates UI State & Re-renders
    ↓
User Sees Results
```

---

## 🎯 Major Features & Their Components

| Feature | Frontend Pages | Backend Routes | Models | Services |
|---------|---|---|---|---|
| **Search** | Search.jsx | /api/search/* | Faculty, Publication, ResearchWork | nlp.py, domain_classifier.py |
| **Collaboration** | FacultyDetails, StudentCollaborationDashboard, FacultyCollaborationDashboard | /api/collaboration/* | CollaborationRequest, User | recommendation.py |
| **Analytics** | Analytics.jsx | /api/analytics/* | ResearchTrend, Publication, Faculty | analytics_service.py |
| **Forum** | Forum.jsx, ForumTopic.jsx | /api/forum/* | Topic, Post, Comment | - |
| **Notifications** | (integrated in Navbar) | /api/notifications/* | Notification | - |
| **Faculty Mgmt** | FacultyDetails.jsx | /api/faculty/* | Faculty, FacultyPublication | scraper.py |
| **Admin** | AdminDashboard.jsx | /api/admin/* | User, Faculty, Topic, Post | - |

---

## 🚀 Getting Started

### Backend:
```bash
cd backend
pip install -r requirements.txt
python run.py  # Runs on http://localhost:5000
```

### Frontend:
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Database:
```bash
# MySQL must be running with scholarsphere database
# Run migrations:
cd backend
flask db upgrade
```

---

## 📝 Environment Variables (.env)

```
DATABASE_URL=mysql+mysqldb://root:password@localhost/scholarsphere
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_here
FLASK_ENV=development
```

---

This document provides a complete understanding of how ScholarSphere flows from folder to folder, file to file, and how data moves through the system!
