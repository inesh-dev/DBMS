# Sahara Hospital Monitoring - Clinical Monitoring System

A modern clinical monitoring dashboard built with Django and React. This system helps track patient vitals and manage doctor appointments.

## Prerequisites

Before starting, ensure you have the following installed:
- **Python 3.10+**
- **Node.js 18+** & **npm**
- **PostgreSQL 14+**

---

## 1. Database Setup

1. Create a PostgreSQL database named `monitoring_db`.
2. Run the following initialization scripts from the `/backend` folder:
   ```bash
   cd backend
   psql -d monitoring_db -f db/schema.sql
   psql -d monitoring_db -f db/views.sql
   psql -d monitoring_db -f db/procedures.sql
   psql -d monitoring_db -f db/triggers.sql
   psql -d monitoring_db -f db/sample_data.sql
   ```

## 2. Backend Setup

1. Navigate to the `/backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   - Create a `.env` file in the `backend` folder.
   - Generate a secure `SECRET_KEY` by running:
     ```bash
     python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
     ```
   - Copy the output and paste it into your `.env` file along with your database credentials:
     ```env
     SECRET_KEY=your_generated_key_here
     DB_NAME=monitoring_db
     DB_USER=your_postgres_user
     DB_PASSWORD=your_postgres_password
     DB_HOST=localhost
     DB_PORT=5432
     ```
5. Apply migrations and start the server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   *Backend runs at: http://127.0.0.1:8000/*

## 3. Frontend Setup

1. Open a new terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *Frontend runs at: http://localhost:5173/*

---

## Technical Features
- **Patient Dashboard**: View real-time vitals and reports.
- **Doctor Dashboard**: Manage patient records and schedules.
- **Raw SQL Architecture**: Uses direct SQL for high-performance clinical data management.
- **JWT Authentication**: Secure login for both doctors and patients.
