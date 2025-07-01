---
# Evibe-server
## 📦 API Endpoints

### 🔐 Authentication
- `POST /register` – Register a new user
- `GET /allUsers` – Fetch all users

### 📅 Event Management
- `GET /allEvents` – Get all events with optional search/filter
  - Supports query params:
    - `title`: Search by title
    - `filter`: `today`, `currentWeek`, `lastWeek`, `currentMonth`, `lastMonth`
- `POST /events` – Add a new event
- `PUT /events/:id` – Update an event
- `DELETE /events/:id` – Delete an event
- `GET /eventsByEmail?email=user@email.com` – Get events posted by a user
- `PATCH /events/join/:id` – Join an event (Only once per user)
- `GET /events/:id/isJoined?email=user@email.com` – Check if user already joined

---

## 🛠 Setup Instructions

### ⚙️ 1. Clone the repository

```bash
git clone https://github.com/your-username/event-management-server.git
cd event-management-server

```

### Installation

```bash
npm install
```

### Set ENV

```bash
PORT=5000
DB_USER=your_mongodb_user
DB_PASS=your_mongodb_password
```

### Run the server

```bash
npm start
```

#### Server will start on http://localhost:5000
