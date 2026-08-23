# System Design Write-Up: Society Maintenance Tracker

## 1. Architectural Overview
The Society Maintenance Tracker is built on a modern decoupled architecture using **Node.js/Express** for the backend API, **React (Vite)** for the client application, and **SQLite via Prisma ORM** for persistent data storage. Role-Based Access Control (RBAC) is enforced at the API layer using JSON Web Tokens (JWT).

```
[ React Client ]  <--->  [ Express REST API ]  <--->  [ SQLite Database (Prisma) ]
                                |
                                v
                   [ Multer Storage / Nodemailer ]
```

---

## 2. Complaint History & Audit Trail Model
To guarantee complete operational transparency between residents and society administrators, the complaint lifecycle relies on an immutable audit logging architecture.

- **Data Modeling**: The system maintains a strict 1-to-N relationship between the `Complaint` entity and the `ComplaintHistory` entity.
- **Event Triggers**: When an Admin updates a complaint's state (e.g., transition from `OPEN` to `IN_PROGRESS` or `RESOLVED`), the backend performs a atomic operation:
  1. The target `Complaint` record is updated with the new `status` and `priority`.
  2. A new `ComplaintHistory` record is automatically inserted, referencing the `complaintId`, the `changedBy` user ID, `oldStatus`, `newStatus`, timestamp (`createdAt`), and an optional administrative `note`.
- **UI Visibility**: Residents can inspect their complaint cards to see a chronological timeline of every transition along with the admin's notes, preventing communication gaps.

---

## 3. Overdue Detection & Surfacing Algorithm
Preventing unattended complaints requires an automated mechanism to identify delayed resolutions without causing system performance degradation.

- **Dynamic Evaluation Strategy**: Instead of relying on background cron jobs that run periodic write queries against the database, overdue evaluation is computed dynamically during data fetch operations.
- **Configurable Threshold**: A complaint is designated as **OVERDUE** if:
  $$\text{Status} = \text{"OPEN"} \quad \land \quad (\text{CurrentTime} - \text{CreatedAt}) > \text{Threshold (e.g., 3 Days)}$$
- **Priority Surfacing**: In the `AdminDashboard`, the complaint feed is sorted using a composite comparator logic:
  1. Complaints flagged as `isOverdue === true` are hoisted directly to the **top of the list**.
  2. Sub-sorting is applied chronologically by creation timestamp descending.
- **Visual Alerting**: Overdue complaints are rendered with distinct red highlighting (`#fef2f2` container background) and explicit warning badges to instantly capture administrative attention.

---

## 4. Photo Handling Architecture
Visual evidence simplifies maintenance diagnosis for technicians before visiting a resident's unit.

- **Multipart Upload Processing**: Photo uploads are handled using the `Multer` middleware configured for disk storage.
- **File Naming & Collision Avoidance**: Incoming files are sanitized and assigned a unique timestamp suffix (`Date.now() + path.extname(originalName)`) to prevent filesystem overwrites.
- **Static Asset Serving**: The Express server exposes the static `/uploads` directory over HTTP. The database persists only the relative file path string (e.g., `/uploads/1724450000000.png`).
- **Rendering & Fallback**: The React client resolves full asset URLs dynamically (`http://localhost:5000/uploads/...`) and renders preview cards with responsive image containers.

---

## 5. Notification Flow & Integration
Keeping users proactively informed on status changes and emergency notices is achieved via automated email triggers.

- **SMTP Provider Integration**: The system leverages `Nodemailer` initialized with Ethereal SMTP (an isolated testing service suited for development validation).
- **Trigger Workflows**:
  1. **Status Update**: Upon an admin status mutation, the backend queries the resident's associated email address and asynchronously dispatches a personalized notification detailing the new status and note.
  2. **Important Notices**: When an admin posts a notice marked with `isImportant = true`, the system retrieves all registered user emails with the `RESIDENT` role and fires a batch notification.
- **Non-Blocking Execution**: Email dispatch functions are executed asynchronously outside the primary HTTP response block, ensuring API response latencies remain minimal for administrative users.
