# Leave Management System

A full-stack Leave Management System built with **React.js**, **FastAPI**, and **MongoDB**.

The system provides role-based access for **Admin, Manager, and Employee**, with JWT authentication and automatic leave balance management.

## Features

### Authentication

* User login with username or email
* JWT-based authentication
* Protected APIs
* Role-based authorization
* Active/inactive user validation

### Employee

* View personal profile
* View leave balances
* Apply for leave
* View submitted leave requests
* Track leave request status

### Manager

* View pending leave requests
* Approve leave requests
* Reject leave requests
* Automatic leave balance update after approval

### Admin

* View users
* Create users
* Automatic leave balance creation for new users
* Create leave types
* Edit leave types
* Delete leave types

## Tech Stack

### Frontend

* React.js
* JavaScript
* Axios
* HTML
* CSS

### Backend

* Python
* FastAPI
* Pydantic
* JWT Authentication
* Argon2 Password Hashing

### Database

* MongoDB
* MongoDB Compass

## Project Structure

```text
leave-management/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── database/
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── README.md
└── .gitignore
```

## User Roles

| Role     | Permissions                      |
| -------- | -------------------------------- |
| Admin    | Manage users and leave types     |
| Manager  | Approve or reject leave requests |
| Employee | Apply for and track leaves       |

## Leave Flow

```text
Employee
   ↓
Select Leave Type
   ↓
Select From Date / To Date
   ↓
Submit Leave Request
   ↓
Manager Reviews
   ↓
 ┌───────────────┐
 │               │
Approve         Reject
 │               │
 ↓               ↓
Update          Request
Balance         Rejected
```

## Automatic Leave Balance

When an admin creates a new user, the system automatically creates leave balances based on the existing leave types.

For example:

```text
Casual Leave → 12 days
Sick Leave   → 10 days
```

When a new employee is created:

```text
Employee
   ↓
Casual Leave → 12 days
Sick Leave   → 10 days
```

When a leave is approved:

```text
Total Days     = 12
Used Days      = 3
Remaining Days = 9
```

## Authentication

The application uses JWT authentication.

```text
Login
  ↓
Verify Username / Email
  ↓
Verify Password
  ↓
Generate JWT
  ↓
Frontend stores token
  ↓
Axios sends:
Authorization: Bearer <token>
  ↓
Protected API
```

## Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

Backend will run on:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

## Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file for sensitive configuration.

Example:

```env
MONGO_URL=your_mongodb_connection_string
DATABASE_NAME=leave_management
SECRET_KEY=your_secret_key
```

Do not commit your `.env` file to GitHub.

## API Authentication

Protected requests use the following header:

```text
Authorization: Bearer <access_token>
```

Axios automatically attaches the token to requests using an interceptor.

## Future Improvements

* Email notifications
* Leave history filtering
* Pagination
* Dashboard statistics
* Admin user activation/deactivation

## Author

**Lokesh**

Full Stack Developer
