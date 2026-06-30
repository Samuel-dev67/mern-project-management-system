# MERN Project Management System

A full-stack **Project Management System** built with the **MERN Stack (MongoDB, Express.js, React, Node.js)**. The application enables teams to manage projects, assign tasks, track progress using a Kanban board, and collaborate through role-based access control.

---

## Features

### Authentication
- User Registration
- Secure Login
- JWT Authentication
- Protected Routes
- Role-Based Access Control (Admin, Manager, Member)

### Dashboard
- Project Statistics
- Task Statistics
- Recent Activity
- Upcoming Deadlines
- Assigned Tasks Overview

### Project Management
- Create Projects
- Edit Projects
- Delete Projects
- Archive Projects
- Project Details
- Member Management
- Search & Filtering

### Task Management
- Kanban Board
- Drag & Drop Task Status
- Create Tasks
- Edit Tasks
- Delete Tasks
- Task Comments
- Priority Levels
- Due Dates
- Search & Filters

### User Profile
- View Profile
- Update Profile Information
- Change Password
- Avatar Support

### Administration
- User Management
- Promote/Demote Users
- Role Management
- Admin Route Protection

---

## Tech Stack

### Frontend
- React
- React Router
- Axios
- Tailwind CSS
- Context API

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Express Validator

### Database
- MongoDB Atlas (or Local MongoDB)

---

## Folder Structure

```
project-root/
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Samuel-dev67/mern-project-management-system.git

cd mern-project-management-system
```

---

## Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd client
npm install
```

---

## Environment Variables

Create a `.env` file inside the **server** folder.

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

CLIENT_URL=http://localhost:5173
```

---

## Running the Application

### Start Backend

```bash
cd server

npm run dev
```

### Start Frontend

```bash
cd client

npm run dev
```

---

## User Roles

### Admin

- Full system access
- Manage users
- Promote/Demote roles
- Manage projects
- Manage tasks

### Manager

- Create projects
- Manage assigned projects
- Create and assign tasks
- Manage project members

### Member

- View assigned projects
- Manage assigned tasks
- Comment on tasks
- Update profile

---

## API Overview

### Authentication

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password
```

### Projects

```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
PATCH  /api/projects/:id/archive
```

### Tasks

```
GET    /api/projects/:projectId/tasks
POST   /api/projects/:projectId/tasks

GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id

PUT    /api/tasks/:id/status
POST   /api/tasks/:id/comments
```

### Dashboard

```
GET /api/dashboard/stats
```

### Users

```
GET /api/users
PUT /api/users/:id/role
```

---

## Future Improvements

- Email Notifications
- File Attachments
- Real-time Updates (Socket.io)
- Calendar Integration
- Activity Logs
- Advanced Analytics
- Team Chat
- Mobile Application

---

## Screenshots

Add screenshots here after running the application.

Example:

```
screenshots/

Login.png

Dashboard.png

Projects.png

Kanban.png

Profile.png

Admin.png
```

---

## Author

**Samuel**

GitHub:

https://github.com/Samuel-dev67

---

## License

This project is developed for educational and portfolio purposes.