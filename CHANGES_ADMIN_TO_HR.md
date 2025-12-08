# Database and Role Changes Summary

## Changes Made

### 1. **User Model Updates** (`src/models/User.js`)
- ✅ Changed role enum from `["admin", "employee"]` to `["hr", "employee"]`
- ✅ Changed collection name from default `"users"` to `"hrUsers"`
- ✅ Default role remains `"employee"`

### 2. **Employee Model Updates** (`src/models/Employee.js`)
- ✅ Added `password` field (required) for employee authentication

### 3. **Middleware Updates** (`src/middleware/adminMiddleware.js`)
- ✅ Updated role check from `"admin"` to `"hr"`
- ✅ Updated error message from "Not authorized as an admin" to "Not authorized as HR"

### 4. **Controller Comments Updated**
- ✅ `src/controllers/eventController.js` - Changed all `@access Private (Admin)` to `@access Private (HR)`
- ✅ `src/controllers/leaveController.js` - Changed comments from `(admin)` to `(HR)`
- ✅ `src/routes/employeeRoutes.js` - Updated comment from `(admin)` to `(HR)`

### 5. **Test Files Updated**
- ✅ `test-all-apis.js` - Changed registration role from `'admin'` to `'hr'`
- ✅ `test-api.rest` - Updated registration and login examples to use HR user

### 6. **Documentation Updated**
- ✅ `POSTMAN_API_COLLECTION.md` - Updated all examples to use `"hr"` role instead of `"admin"`

## New Database Structure

### hrUsers Collection (Previously: users)
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  googleId: String,
  picture: String,
  role: "hr" | "employee" (default: "employee")
}
```

### employees Collection
```javascript
{
  name: String,
  employeeId: String (unique),
  email: String (unique),
  phone: String,
  department: String,
  password: String,  // ✨ NEW FIELD
  designation: String,
  salary: Number,
  joiningDate: Date,
  address: String
}
```

## HR Dashboard vs Employee App Architecture

Your backend now supports two separate frontends:

### 1. HR Dashboard (Web App)
- **Users:** HR personnel from `hrUsers` collection
- **Role:** `"hr"`
- **Access:** Full admin privileges
  - Manage employees
  - Approve/reject leaves  
  - Manage events
  - View all attendance records

### 2. Employee Mobile App (React Ionic)
- **Users:** Employees from `employees` collection
- **Role:** `"employee"` (if using User model) OR direct employee authentication
- **Access:** Limited access
  - Check-in/Check-out
  - Request leave
  - View own attendance
  - View events

## Important Notes

### ⚠️ Breaking Changes
1. **Existing admin users will no longer work** - The role `"admin"` no longer exists
2. **Need to re-register HR users** with role `"hr"`
3. **Database collection renamed** to `hrUsers` (MongoDB will create a new collection)

### 🔄 Migration Steps (If Needed)
If you have existing data in the `users` collection:

```javascript
// MongoDB migration script
db.users.updateMany(
  { role: "admin" },
  { $set: { role: "hr" } }
);

// Rename collection
db.users.renameCollection("hrUsers");
```

### 🔐 Two Authentication Systems

You now have flexibility for two authentication approaches:

**Option 1: Both use User model**
- HR users: role = "hr"
- Employees: role = "employee"
- All auth through `/api/auth` endpoints
- Single unified User collection (`hrUsers`)

**Option 2: Separate authentication** ⭐ RECOMMENDED
- HR users: `hrUsers` collection via `/api/auth`
- Employees: `employees` collection via custom employee auth endpoints
- Employees can use their employeeId + password
- More separation between HR and Employee systems

## Testing Checklist

- [ ] Register new HR user with role `"hr"`
- [ ] Test HR user can access admin-only endpoints
- [ ] Test employee user can only access employee endpoints
- [ ] Verify 403 errors show "Not authorized as HR"
- [ ] Run `node test-all-apis.js` to verify all endpoints
- [ ] Test HR Dashboard connects successfully
- [ ] Test Employee App connects successfully

## Next Steps

1. **For HR Dashboard:**
   - Configure to authenticate as HR role
   - Point to `/api/auth/login`
   - Use "hr" role in registration

2. **For Employee App:**
   - Decide authentication strategy (User model or Employee model)
   - If Employee model, create dedicated auth endpoints
   - Point to appropriate login endpoint

3. **CORS Configuration:**
   - Add both frontend URLs to `allowedOrigins` in `server.js`
   - Example already in place for localhost:3000 and 5173

## Files Changed
✅ `src/models/User.js`  
✅ `src/models/Employee.js`  
✅ `src/middleware/adminMiddleware.js`  
✅ `src/controllers/eventController.js`  
✅ `src/controllers/leaveController.js`  
✅ `src/routes/employeeRoutes.js`  
✅ `test-all-apis.js`  
✅ `test-api.rest`  
✅ `POSTMAN_API_COLLECTION.md`
