# Society Maintenance Tracker

A full-stack web application for residential societies to manage and track maintenance complaints. Built with React (Vite), Node.js, Express, and Prisma (SQLite).

## Features
- **Role-Based Authentication**: Secure login and registration for Residents and Admins.
- **Complaint Lifecycle**: Residents can raise complaints with optional photos. Admins can update the status (Open, In Progress, Resolved) and priority.
- **History Tracking**: Every status change is recorded with timestamps and admin notes.
- **Overdue Detection**: Complaints open for more than 3 days are flagged as overdue on the Admin Dashboard.
- **Notice Board**: Admins can post notices. Important notices are pinned and trigger email broadcasts.
- **Email Notifications**: Automated emails sent to residents upon status updates or important notices (via Ethereal testing SMTP).
- **Premium UI**: Designed with modern aesthetics, glassmorphism, and responsive layouts.

## Prerequisites
- Node.js (v16+)
- npm or yarn

## Setup Instructions

### 1. Database & Backend Setup
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory based on the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Initialize the Prisma database (SQLite):
   ```bash
   npx prisma db push
   npx prisma generate
   ```
5. Start the backend server:
   ```bash
   npm start
   # Or for development: npm run dev
   ```
   The backend will run on `http://localhost:5000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend/` directory:
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
   The frontend will run on the port provided by Vite (usually `http://localhost:5173`).

## API Documentation

### Auth
- `POST /api/auth/register`: Register a new user (`name`, `email`, `password`, `role`).
- `POST /api/auth/login`: Authenticate and receive a JWT token (`email`, `password`).

### Complaints
- `POST /api/complaints`: Create a complaint (Requires Auth. Body: `category`, `description`, optional `photo` file).
- `GET /api/complaints`: Fetch complaints. Residents see their own; Admins see all. (Requires Auth).
- `PUT /api/complaints/:id`: Update complaint status, priority, and note. (Requires Admin Auth).

### Notices
- `GET /api/notices`: Get all notices (Requires Auth).
- `POST /api/notices`: Create a notice. Triggers email if `isImportant` is true. (Requires Admin Auth).

### Dashboard
- `GET /api/dashboard`: Fetch admin metrics (total, by status, by category, overdue count). (Requires Admin Auth).

## Architecture & System Design
Please see `System_Design.md` for a detailed breakdown of the complaint history model, overdue detection, photo handling, and notification flows.
