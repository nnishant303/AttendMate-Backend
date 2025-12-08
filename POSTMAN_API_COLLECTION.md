# AttendMate Backend - API Testing Guide

**Base URL:** `http://localhost:5000/api`

---

## 📋 Table of Contents
1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Employee Management](#employee-management)
4. [Attendance](#attendance)
5. [Leave Management](#leave-management)
6. [Events](#events)

---

## ✅ Health Check

### Check Server Health
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/health`
- **Auth:** None
- **Response:**
```json
{
  "ok": true,
  "time": "2024-12-08T10:10:34.000Z"
}
```

---

## 🔐 Authentication

### 1. Register User (HR)
- **Method:** `POST`
- **URL:** `/auth/register`
- **Auth:** None
- **Body (JSON):**
```json
{
  "name": "Your HR Name",
  "email": "your-hr@example.com",
  "password": "your-password",
  "role": "hr"
}
```

### 2. Register User (Employee)
- **Method:** `POST`
- **URL:** `/auth/register`
- **Auth:** None
- **Body (JSON):**
```json
{
  "name": "Employee Name",
  "email": "employee@example.com",
  "password": "your-password",
  "role": "employee"
}
```

### 3. Login
- **Method:** `POST`
- **URL:** `/auth/login`
- **Auth:** None
- **Body (JSON):**
```json
{
  "email": "your-hr@example.com",
  "password": "your-password"
}
```
- **Response:** (Save the token for subsequent requests)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Your HR Name",
    "email": "your-hr@example.com",
    "role": "hr"
  }
}
```

### 4. Google Login
- **Method:** `POST`
- **URL:** `/auth/google`
- **Auth:** None
- **Body (JSON):**
```json
{
  "token": "GOOGLE_ID_TOKEN_HERE"
}
```

### 5. Get Current User
- **Method:** `GET`
- **URL:** `/auth/me`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN_HERE`

### 6. Logout
- **Method:** `POST`
- **URL:** `/auth/logout`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN_HERE`

---

## 👥 Employee Management

> **Note:** Employee management endpoints require HR authentication. Employee authentication for the mobile app is separate.

### 1. Employee Login (Mobile App)
- **Method:** `POST`
- **URL:** `/employees/login`
- **Auth:** None
- **Body (JSON):**
```json
{
  "email": "employee@example.com",
  "password": "your-password"
}
```
- **Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employee": {
    "id": "...",
    "name": "Employee Name",
    "email": "employee@example.com",
    "employeeId": "YOUR_EMP_ID",
    "phone": "1234567890",
    "department": "Department Name",
    "designation": "Designation",
    "joiningDate": "2024-01-01",
    "address": "Employee Address"
  }
}
```
**Note:** Salary is excluded from the response for security.

### 2. Get Employee Profile (Mobile App)
- **Method:** `GET`
- **URL:** `/employees/profile`
- **Auth:** Bearer Token (Employee)
- **Headers:**
  - `Authorization: Bearer EMPLOYEE_TOKEN`
- **Response:** Returns employee profile data (excluding salary)

### 3. Add Employee (HR Only)
- **Method:** `POST`
- **URL:** `/employees/add`
- **Auth:** Bearer Token (HR)
- **Body (JSON):**
```json
{
  "name": "Employee Name",
  "employeeId": "YOUR_EMP_ID",
  "email": "employee@example.com",
  "phone": "1234567890",
  "department": "Department Name",
  "designation": "Designation",
  "password": "employee-password",
  "salary": 50000,
  "joiningDate": "2024-01-01",
  "address": "Employee Address"
}
```
**Note:** Password is required and will be automatically hashed before storage.

### 4. Get All Employees
- **Method:** `GET`
- **URL:** `/employees`
- **Auth:** Bearer Token
- **Query Parameters (Optional):**
  - `department` - Filter by department
  - `designation` - Filter by designation

### 5. Get Employee by Custom Employee ID
- **Method:** `GET`
- **URL:** `/employees/find/:employeeId`
- **Example:** `/employees/find/YOUR_EMP_ID`
- **Auth:** Bearer Token

### 6. Get Employee by MongoDB ID
- **Method:** `GET`
- **URL:** `/employees/:id`
- **Example:** `/employees/675048c8e8f9a1234567890a`
- **Auth:** Bearer Token

### 7. Update Employee (HR Only)
- **Method:** `PUT`
- **URL:** `/employees/:id`
- **Example:** `/employees/675048c8e8f9a1234567890a`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):** (Include only fields to update)
```json
{
  "department": "Product Engineering",
  "salary": 65000,
  "designation": "Senior Software Engineer"
}
```

### 8. Delete Employee (HR Only)
- **Method:** `DELETE`
- **URL:** `/employees/:id`
- **Example:** `/employees/675048c8e8f9a1234567890a`
- **Auth:** Bearer Token (Admin)

---

## ⏰ Attendance

### 1. Check-In
- **Method:** `POST`
- **URL:** `/attendance/check-in`
- **Auth:** Bearer Token
- **Body (JSON):**
```json
{
  "employeeId": "YOUR_EMP_ID",
  "date": "2024-12-08",
  "time": "09:30:00"
}
```
- **Response:**
```json
{
  "message": "Checked in successfully",
  "attendance": {
    "employeeId": "EMP001",
    "date": "2024-12-08",
    "checkInTime": "09:30:00",
    "status": "Present",
    "lateBy": 0
  }
}
```

### 2. Check-In Late (Example)
- **Method:** `POST`
- **URL:** `/attendance/check-in`
- **Auth:** Bearer Token
- **Body (JSON):**
```json
{
  "employeeId": "YOUR_EMP_ID",
  "date": "2024-12-08",
  "time": "10:30:00"
}
```

### 3. Check-Out
- **Method:** `POST`
- **URL:** `/attendance/check-out`
- **Auth:** Bearer Token
- **Body (JSON):**
```json
{
  "employeeId": "YOUR_EMP_ID",
  "date": "2024-12-08",
  "time": "18:00:00"
}
```

### 4. Get All Attendance Records
- **Method:** `GET`
- **URL:** `/attendance`
- **Auth:** Bearer Token
- **Query Parameters (Optional):**
  - `date` - Filter by specific date (YYYY-MM-DD)
  - Example: `/attendance?date=2024-12-08`

### 5. Get Attendance by Employee
- **Method:** `GET`
- **URL:** `/attendance/:employeeId`
- **Example:** `/attendance/YOUR_EMP_ID`
- **Auth:** Bearer Token
- **Query Parameters (Optional):**
  - `from` - Start date (YYYY-MM-DD)
  - `to` - End date (YYYY-MM-DD)
  - Example: `/attendance/YOUR_EMP_ID?from=2024-12-01&to=2024-12-31`

---

## 🏖️ Leave Management

### 1. Request Leave
- **Method:** `POST`
- **URL:** `/leaves/request`
- **Auth:** Bearer Token
- **Body (JSON):**
```json
{
  "employeeId": "YOUR_EMP_ID",
  "leaveType": "Sick Leave",
  "fromDate": "2024-12-10",
  "toDate": "2024-12-12",
  "reason": "Your reason"
}
```
- **Leave Types:**
  - Sick Leave
  - Casual Leave
  - Vacation
  - Maternity/Paternity Leave
  - Unpaid Leave

### 2. Request Casual Leave (Example)
- **Method:** `POST`
- **URL:** `/leaves/request`
- **Auth:** Bearer Token
- **Body (JSON):**
```json
{
  "employeeId": "EMP002",
  "leaveType": "Casual Leave",
  "fromDate": "2024-12-15",
  "toDate": "2024-12-16",
  "reason": "Personal work"
}
```

### 3. Get All Leaves (Admin Only)
- **Method:** `GET`
- **URL:** `/leaves`
- **Auth:** Bearer Token (Admin)
- **Query Parameters (Optional):**
  - `status` - Filter by status (Pending/Approved/Rejected)
  - `employeeId` - Filter by employee

### 4. Get Leaves by Employee
- **Method:** `GET`
- **URL:** `/leaves/employee/:employeeId`
- **Example:** `/leaves/employee/YOUR_EMP_ID`
- **Auth:** Bearer Token

### 5. Approve Leave (Admin Only)
- **Method:** `PUT`
- **URL:** `/leaves/:id`
- **Example:** `/leaves/675048c8e8f9a1234567890b`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):**
```json
{
  "status": "Approved"
}
```

### 6. Reject Leave (Admin Only)
- **Method:** `PUT`
- **URL:** `/leaves/:id`
- **Example:** `/leaves/675048c8e8f9a1234567890b`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):**
```json
{
  "status": "Rejected"
}
```

---

## 📅 Events

### 1. Add Event (Admin Only)
- **Method:** `POST`
- **URL:** `/events/add`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):**
```json
{
  "title": "Team Meeting",
  "start": "2024-12-10T10:00:00",
  "end": "2024-12-10T11:00:00",
  "description": "Monthly team sync",
  "allDay": false,
  "type": "Meeting"
}
```

### 2. Add Holiday Event (Example)
- **Method:** `POST`
- **URL:** `/events/add`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):**
```json
{
  "title": "Christmas",
  "start": "2024-12-25T00:00:00",
  "end": "2024-12-25T23:59:59",
  "description": "Christmas Holiday",
  "allDay": true,
  "type": "Holiday"
}
```

### 3. Get All Events
- **Method:** `GET`
- **URL:** `/events`
- **Auth:** Bearer Token
- **Query Parameters (Optional):**
  - `type` - Filter by event type
  - `from` - Start date
  - `to` - End date

### 4. Update Event (Admin Only)
- **Method:** `PUT`
- **URL:** `/events/:id`
- **Example:** `/events/675048c8e8f9a1234567890c`
- **Auth:** Bearer Token (Admin)
- **Body (JSON):** (Include only fields to update)
```json
{
  "title": "Updated Team Meeting",
  "description": "Updated monthly sync",
  "start": "2024-12-10T11:00:00"
}
```

### 5. Delete Event (Admin Only)
- **Method:** `DELETE`
- **URL:** `/events/:id`
- **Example:** `/events/675048c8e8f9a1234567890c`
- **Auth:** Bearer Token (Admin)

---

## 🔑 Authentication Headers

For all protected endpoints, add the following header:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**How to get the token:**
1. Login using `/auth/login`
2. Copy the `token` from the response
3. Use it in subsequent requests

---

## 📝 Postman Tips

### Setting Up Environment Variables
1. Create a new environment in Postman
2. Add these variables:
   - `baseUrl`: `http://localhost:5000/api`
   - `token`: (leave empty, will be set after login)

### Auto-Save Token After Login
In your login request, add this to the **Tests** tab:
```javascript
var jsonData = pm.response.json();
pm.environment.set("token", jsonData.token);
```

### Using Variables in Requests
- URL: `{{baseUrl}}/auth/login`
- Authorization Header: `Bearer {{token}}`

---

## 🚀 Testing Flow

### Recommended Testing Order:

1. **Register Admin** → Register an admin user
2. **Login** → Get authentication token
3. **Add Employees** → Create employee records
4. **Check-In** → Test attendance check-in
5. **Check-Out** → Test attendance check-out
6. **Request Leave** → Test leave request
7. **Approve Leave** → Admin approves leave
8. **Add Events** → Create calendar events
9. **Get All Data** → Verify all records

---

## 🐛 Common Issues

### 401 Unauthorized
- Token expired or invalid
- Solution: Login again to get a new token

### 403 Forbidden
- You don't have admin privileges
- Solution: Login with admin account

### 404 Not Found
- Invalid employee ID or MongoDB ID
- Solution: Check the correct ID format

### 400 Bad Request
- Missing required fields
- Invalid date format
- Solution: Check the request body matches the examples

---

## 📂 Export to Postman

You can import the `test-api.rest` file format into Postman or create a collection manually using this guide.

For automated testing, check the `test-all-apis.js` file in the project root.
