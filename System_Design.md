# System Design: Society Maintenance Tracker

## Overview
The Society Maintenance Tracker is a full-stack web application built to streamline the process of reporting, tracking, and resolving maintenance issues within a residential society. The system is designed with a role-based architecture, distinguishing between Residents (who report issues) and Admins (who manage operations and resolve issues).

## Architecture & Technology Stack
- **Frontend**: React.js (Vite) for a fast, responsive single-page application.
- **Backend**: Node.js with Express.js to handle API requests and business logic.
- **Database**: SQLite (via Prisma ORM) for relational data management and easy local setup.
- **Authentication**: JSON Web Tokens (JWT) for secure, stateless user sessions.

## 1. Complaint History Model
The core of the application revolves around the `Complaint` entity. To ensure transparency, we implemented a robust history tracking model.
- **Database Design**: The schema includes a `Complaint` table and a one-to-many relationship with a `ComplaintHistory` table.
- **Lifecycle Tracking**: Whenever an Admin updates the status of a complaint (e.g., from `OPEN` to `IN_PROGRESS`), a new record is inserted into the `ComplaintHistory` table.
- **Audit Trail**: This record captures the `oldStatus`, `newStatus`, the `changedBy` (Admin ID), a timestamp, and an optional `note`. This allows residents to see exactly when and why a status changed.

## 2. Overdue Detection
To ensure no complaint is forgotten, the system features an automatic overdue detection mechanism.
- **Logic**: A complaint is considered "overdue" if its status is `OPEN` and its `createdAt` timestamp is older than a configurable threshold (currently set to 3 days/72 hours).
- **Implementation**: Instead of running a heavy CRON job to constantly update database fields, the overdue calculation is performed dynamically on the backend when the Admin Dashboard metrics are requested, and visually on the frontend.
- **UI Surfacing**: In the Admin Dashboard, overdue complaints are visually highlighted (red background) and a metric counter alerts the admin to the total number of overdue issues.

## 3. Photo Handling
Allowing residents to upload photos provides crucial context for maintenance issues.
- **Storage Strategy**: For this initial version, we utilize local disk storage via the `multer` middleware in Express. 
- **Workflow**: When a resident submits a complaint with an image, `multer` intercepts the form-data request, renames the file with a unique timestamp to prevent collisions, and saves it to the backend `uploads/` directory.
- **Serving Images**: The backend serves the `uploads/` directory statically. The database stores the relative path (`/uploads/filename.jpg`), which the frontend resolves and renders in the complaint details.

## 4. Notification Flow
Keeping residents informed is critical for user satisfaction.
- **Triggers**: The system triggers email notifications on two primary events:
  1. A complaint's status is updated by an admin.
  2. An admin posts an "Important" notice to the notice board.
- **Integration**: The backend utilizes `nodemailer` configured with Ethereal Email (a fake SMTP service specifically designed for testing). 
- **Workflow**: When an admin updates a status, the backend retrieves the resident's email via a Prisma relational query and dispatches an asynchronous email function containing the new status and any admin notes. For important notices, it queries all users with the `RESIDENT` role and sends a broadcast email.

## 5. Security & Access Control
- **Role-Based Access Control (RBAC)**: Middleware functions (`authMiddleware`, `adminMiddleware`) protect backend routes. Residents can only fetch their own complaints, while Admins can fetch all complaints and access metrics.
- **Data Protection**: User passwords are computationally hashed using `bcryptjs` before storage, ensuring that plaintext passwords are never exposed.
