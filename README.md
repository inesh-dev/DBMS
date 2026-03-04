# VibeMonitoring - Clinical Decision & Patient Monitoring System

A modern, glassmorphic clinical monitoring dashboard built with Django and React.
Includes an intelligent patient vitals checking gateway, automated doctor appointment scheduling, and dedicated Patient/Doctor dashboards.

## Project Structure
- `/backend`: Django REST API with PostgreSQL (Raw SQL Architecture) & JWT Authentication.
- `/frontend`: React + Vite + Framer Motion + Recharts + React Router.

## Getting Started: Step-by-Step Guide

### 1. Software Requirements
- **Python 3.10+** (Ensure `python3-venv` is installed on Linux)
- **Node.js 18+** & **npm**
- **PostgreSQL 14+**

### 2. Database Setup
1. Open your terminal and create a PostgreSQL database named `monitoring_db`.
2. Connect to the database and ensure you have a user with the correct permissions.
3. Run the initialization scripts in the exact order below from the `/backend` folder:
   ```bash
   cd backend
   psql -d monitoring_db -f db/schema.sql
   psql -d monitoring_db -f db/views.sql
   psql -d monitoring_db -f db/procedures.sql
   psql -d monitoring_db -f db/triggers.sql
   psql -d monitoring_db -f db/sample_data.sql
   ```

### 3. Backend Setup (Virtual Environment & .env)
The backend uses environment variables to securely connect to the database.

1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create and activate a python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Linux/macOS
   # On Windows: venv\Scripts\activate
   ```
3. Install the dependencies inside the virtual environment:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   - Copy the example `.env` file to establish your local settings.
   ```bash
   cp .env.example .env
   ```
   - Open `.env` and fill in your actual PostgreSQL credentials (DB_USER, DB_PASSWORD).

5. Run Django migrations (for internal auth/admin):
   ```bash
   python manage.py migrate
   ```
6. Start the Django Server:
   ```bash
   python manage.py runserver
   ```
   *The server will run on `http://127.0.0.1:8000/`*

### 4. Frontend Setup
1. Open a **new terminal tab** and navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 5. Pushing to GitHub
Because we have configured the `.gitignore` files efficiently, secrets and environments won't leak.
1. Run `git status` to verify `venv/` and `.env` are ignored.
2. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: Complete Hospital Vitals System"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

## Key Features
- **Dynamic AI Vitals Checker**: Real-time evaluation against clinical thresholds.
- **Automated Bookings & WhatsApp**: Auto-generate user profiles and dispatch credentials.
- **Real-time Vitals Dashboards**: Charts of heart rate, BP, glucose, and more.
- **Role-based Auth (JWT)**: Secure separated dashboards for Patients and Doctors.
- **Raw SQL Architecture**: Direct database control for clinical data modeling.
