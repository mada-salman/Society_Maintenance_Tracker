# 🏢 Society Maintenance Tracker

A comprehensive full-stack web platform built for residential societies to log, track, and manage maintenance complaints, broadcast important community notices, and monitor operational analytics.

---

## 🚀 Demo Credentials

The database comes pre-seeded with sample user accounts for quick testing:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Resident** | `resident@society.com` | `password123` |
| **Admin** | `admin@society.com` | `password123` |

---

## ✨ Features

- **Role-Based Authentication**: Secure JWT-based access control distinguishing between `RESIDENT` and `ADMIN` roles.
- **Complaint Lifecycle & History**: Residents raise issues with photos; Admins manage status (`OPEN`, `IN_PROGRESS`, `RESOLVED`) and priority (`LOW`, `MEDIUM`, `HIGH`). Every status update records an audit log with timestamps and notes.
- **Dynamic Overdue Surface**: Complaints remaining open past a configurable threshold (3+ days) are flagged as **OVERDUE** and prioritized at the top of the Admin view.
- **Notice Board & Email Alerts**: Admins post notices. Flagging a notice as "Important" pins it to the top and triggers automated email broadcasts to residents via Nodemailer.
- **Admin Analytics Dashboard**: Real-time visualization of complaint metrics by status, by category, and overdue counts.

---

## 🛠️ Technology Stack

- **Frontend**: React.js (Vite), React Router, Lucide Icons, Custom CSS (Glassmorphism design).
- **Backend**: Node.js, Express.js, Prisma ORM, JWT, bcryptjs, Multer, Nodemailer.
- **Database**: SQLite (managed via Prisma).

---

## 💻 Local Setup Guide

### Prerequisites
- Node.js (v16 or higher)
- npm

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database schema & seed demo users:
   ```bash
   npx prisma db push
   node seed.js
   ```
4. Start the backend server:
   ```bash
   npm start
   ```
   *The backend runs on `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 🗄️ Database Schema (Prisma)

```prisma
model User {
  id         Int         @id @default(autoincrement())
  name       String
  email      String      @unique
  password   String
  role       String      @default("RESIDENT") // RESIDENT | ADMIN
  complaints Complaint[]
}

model Complaint {
  id          Int                @id @default(autoincrement())
  residentId  Int
  resident    User               @relation(fields: [residentId], references: [id])
  category    String
  description String
  photoUrl    String?
  priority    String             @default("LOW") // LOW | MEDIUM | HIGH
  status      String             @default("OPEN") // OPEN | IN_PROGRESS | RESOLVED
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  history     ComplaintHistory[]
}

model ComplaintHistory {
  id          Int       @id @default(autoincrement())
  complaintId Int
  complaint   Complaint @relation(fields: [complaintId], references: [id])
  changedBy   Int
  oldStatus   String
  newStatus   String
  note        String?
  createdAt   DateTime  @default(now())
}

model Notice {
  id          Int      @id @default(autoincrement())
  title       String
  content     String
  isImportant Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## 📡 API Documentation

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` - Create user (`name`, `email`, `password`, `role`).
- `POST /api/auth/login` - Authenticate user & return JWT token.

### Complaint Routes (`/api/complaints`)
- `GET /api/complaints` - Fetch complaints (Residents see their own; Admins see all).
- `POST /api/complaints` - Create complaint (`category`, `description`, optional `photo` upload).
- `PUT /api/complaints/:id` - Update status, priority, and note (Admin only).

### Notice Routes (`/api/notices`)
- `GET /api/notices` - List all notices (Important notices pinned first).
- `POST /api/notices` - Create notice (Admin only; `isImportant` triggers email broadcast).

### Dashboard Routes (`/api/dashboard`)
- `GET /api/dashboard` - Get analytics (`totalComplaints`, `byStatus`, `byCategory`, `overdueCount`).

---

## 🌐 Deployment Guide (GitHub + Cloud Hosting)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Deploy Society Maintenance Tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Society_Maintenance_Tracker.git
git push -u origin main
```

### 2. Host Backend (Render / Railway)
- Connect GitHub repo, set Root Directory to `backend`.
- Build Command: `npm install && npx prisma generate && npx prisma db push`
- Start Command: `node index.js`

### 3. Host Frontend (Vercel / Netlify)
- Connect GitHub repo, set Root Directory to `frontend`.
- Deploy directly using default Vite preset.
