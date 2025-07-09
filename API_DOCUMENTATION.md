# Rento API Documentation

## Base URL
```
http://localhost:4000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "details": [...], // Optional validation errors
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

## 📊 Status Codes

| Status Code | Description | When Used |
|-------------|-------------|-----------|
| 200 | OK | Successful GET requests, login, logout |
| 201 | Created | Registration, property creation, booking creation |
| 400 | Bad Request | Validation errors, invalid OTP, already verified |
| 401 | Unauthorized | Invalid credentials, missing/invalid token |
| 403 | Forbidden | Email not verified, insufficient permissions |
| 404 | Not Found | User not found, booking not found |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Authentication errors, server errors |

## Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

---

## 🏠 Health Check

### GET /
Check if the API is running.

**Request:**
```
GET /
```

**Status Codes:**
- `200 OK` - API is running

**Response (200):**
```json
{
  "success": true,
  "message": "Welcome to Rento API",
  "version": "1.0.0",
  "status": "active",
  "timestamp": "2025-07-10T10:30:00.000Z",
  "endpoints": {
    "users": "/api/user",
    "properties": "/api/properties",
    "bookings": "/api/booking",
    "balling": "/api/balling",
    "landlord": "/api/landlord"
  }
}
```

---

## 👤 User Authentication

### POST /api/user/signup
Register a new user.

**Request:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "Tenant" // or "Landlord", "Enterprise"
}
```

**Validation Rules:**
- `email`: Valid email format
- `password`: Min 6 chars, must contain uppercase, lowercase, and number
- `fullName`: 2-50 characters
- `role`: Must be "Tenant", "Landlord", or "Enterprise"

**Status Codes:**
- `201 Created` - Registration successful
- `400 Bad Request` - Validation errors
- `409 Conflict` - Email already registered
- `500 Internal Server Error` - Server error

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "email": "john@example.com"
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (409):**
```json
{
  "success": false,
  "error": "Email Already Registered",
  "message": "Please sign in or use another email",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/verify-otp
Verify email with OTP.

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Status Codes:**
- `200 OK` - Email verified successfully
- `400 Bad Request` - Invalid OTP, expired OTP, already verified, no OTP found
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "Tenant"
    }
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid OTP",
  "message": "The verification code is incorrect",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/resend-otp
Resend OTP for email verification.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Status Codes:**
- `200 OK` - New verification code sent
- `400 Bad Request` - Email already verified
- `404 Not Found` - User not found
- `429 Too Many Requests` - Rate limit exceeded (wait 1 minute)
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "New verification code sent to your email",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (429):**
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Please wait at least 1 minute before requesting a new code",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/signin
Login user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "Password123"
}
```

**Status Codes:**
- `200 OK` - Login successful
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Email not verified (new OTP sent)
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "Tenant",
      "profileImageUrl": "/images/default.png"
    }
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "Email Not Verified",
  "message": "Please verify your email. New verification code sent to your email.",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/signout
Logout user.

**Headers:** `Authorization: Bearer TOKEN`

**Status Codes:**
- `200 OK` - Logout successful
- `500 Internal Server Error` - Logout failed

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/forgot-password
Request password reset.

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Status Codes:**
- `200 OK` - Reset link sent (or email doesn't exist - security)
- `429 Too Many Requests` - Rate limit exceeded (wait 5 minutes)
- `400 Bad Request` - Validation errors
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account with this email exists, a password reset link has been sent",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (429):**
```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Please wait at least 5 minutes before requesting another password reset",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/reset-password
Reset password with token.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewPassword123"
}
```

**Status Codes:**
- `200 OK` - Password reset successful
- `400 Bad Request` - Invalid or expired token, validation errors
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now login with your new password",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid or Expired Token",
  "message": "Password reset token is invalid or has expired",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/user/select-role
Set role for OAuth users.

**Headers:** `Authorization: Bearer TOKEN`

**Request:**
```json
{
  "role": "Landlord"
}
```

**Status Codes:**
- `200 OK` - Role updated successfully
- `400 Bad Request` - Role already set, validation errors
- `401 Unauthorized` - Authentication required
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "user": {
      "id": "607f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "Landlord",
      "profileImageUrl": "https://lh3.googleusercontent.com/..."
    }
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Role Already Set",
  "message": "You have already selected a role",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## 🏢 Properties

### GET /api/properties
Get all properties.

**Headers:** `Authorization: Bearer TOKEN`

**Status Codes:**
- `200 OK` - Properties retrieved successfully
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Email not verified
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "All properties retrieved successfully",
  "data": {
    "count": 2,
    "properties": [
      {
        "_id": "607f1f77bcf86cd799439012",
        "address": "123 Main St, New York",
        "size": "2BHK",
        "rent": 2500,
        "listedBy": "607f1f77bcf86cd799439011",
        "available": true,
        "photo": ["/uploads/1234567890-house1.jpg"],
        "contact": "+1234567890",
        "createdAt": "2025-07-10T10:30:00.000Z"
      }
    ]
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Authentication Required",
  "message": "Please login to access this resource",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## 🏠 Landlord Operations

*Requires role: "Landlord"*

### GET /api/landlord/add-property
Get property form requirements.

**Headers:** `Authorization: Bearer TOKEN`

**Status Codes:**
- `200 OK` - Form requirements retrieved
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not a landlord or email not verified
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Property form requirements",
  "data": {
    "requiredFields": ["address", "size", "rent", "contact"],
    "optionalFields": ["images"],
    "imageLimit": 5,
    "allowedImageTypes": ["jpg", "jpeg", "png"],
    "maxImageSize": "5MB"
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/landlord/add-property
Add a new property.

**Headers:** 
- `Authorization: Bearer TOKEN`
- `Content-Type: multipart/form-data`

**Form Data:**
```
address: "123 Main St, New York"
size: "2BHK" // 1BHK, 2BHK, 3BHK, 4BHK, Villa
rent: 2500
contact: "+1234567890"
images: [file1.jpg, file2.jpg] // Optional, max 5 files
```

**Status Codes:**
- `201 Created` - Property added successfully
- `400 Bad Request` - Validation errors, file upload errors
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not a landlord or email not verified
- `500 Internal Server Error` - Server error

**Success Response (201):**
```json
{
  "success": true,
  "message": "Property added successfully",
  "data": {
    "_id": "607f1f77bcf86cd799439012",
    "address": "123 Main St, New York",
    "size": "2BHK",
    "rent": 2500,
    "listedBy": "607f1f77bcf86cd799439011",
    "available": true,
    "photo": ["/uploads/1234567890-house1.jpg"],
    "contact": "+1234567890",
    "createdAt": "2025-07-10T10:30:00.000Z"
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### GET /api/landlord/properties
Get landlord's properties.

**Headers:** `Authorization: Bearer TOKEN`

**Status Codes:**
- `200 OK` - Properties retrieved successfully
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Not a landlord or email not verified
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Properties retrieved successfully",
  "data": {
    "count": 1,
    "properties": [
      {
        "_id": "607f1f77bcf86cd799439012",
        "address": "123 Main St, New York",
        "size": "2BHK",
        "rent": 2500,
        "listedBy": "607f1f77bcf86cd799439011",
        "available": true,
        "photo": ["/uploads/1234567890-house1.jpg"],
        "contact": "+1234567890"
      }
    ]
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## 📅 Booking Management

### GET /api/booking
Get booking form requirements.

**Headers:** `Authorization: Bearer TOKEN`

**Status Codes:**
- `200 OK` - Form requirements retrieved
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Email not verified
- `500 Internal Server Error` - Server error

**Success Response (200):**
```json
{
  "success": true,
  "message": "Booking form requirements",
  "data": {
    "requiredFields": ["category", "description", "size", "duration"],
    "categories": ["vahicle", "forniture", "kitchen_stuff", "others"],
    "sizes": ["small", "medium", "large"],
    "durationUnit": "days"
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### POST /api/booking
Create a new booking.

**Headers:** 
- `Authorization: Bearer TOKEN`
- `Content-Type: application/json`

**Request:**
```json
{
  "category": "vahicle", // vahicle, forniture, kitchen_stuff, others
  "description": "Storage for my car",
  "size": "large", // small, medium, large
  "duration": 30 // days
}
```

**Status Codes:**
- `201 Created` - Booking created successfully
- `400 Bad Request` - Validation errors
- `401 Unauthorized` - Missing or invalid token
- `403 Forbidden` - Email not verified
- `500 Internal Server Error` - Server error

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking": {
      "_id": "607f1f77bcf86cd799439013",
      "category": "vahicle",
      "description": "Storage for my car",
      "size": "large",
      "duration": 30,
      "createdBy": "607f1f77bcf86cd799439011",
      "createdAt": "2025-07-10T10:30:00.000Z"
    },
    "nextStep": {
      "message": "You can now calculate billing for this booking",
      "endpoint": "/api/balling/607f1f77bcf86cd799439013",
      "method": "GET"
    }
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## 💰 Billing

### GET /api/balling/:id
Calculate billing for a booking.

**Headers:** `Authorization: Bearer TOKEN`

**URL Parameters:**
- `id`: Booking ID

**Example:** `GET /api/balling/607f1f77bcf86cd799439013`

**Response:**
```json
{
  "success": true,
  "message": "Billing calculated successfully",
  "data": {
    "cost": 45000,
    "booking": {
      "_id": "607f1f77bcf86cd799439013",
      "category": "vahicle",
      "description": "Storage for my car",
      "size": "large",
      "duration": 30,
      "cost": 45000,
      "createdBy": "607f1f77bcf86cd799439011"
    },
    "calculation": {
      "perDay": 10,
      "duration": 30,
      "rate": 30,
      "categoryMultiplier": 50,
      "formula": "(10 * 30) * 30 * 50 = 45000"
    }
  },
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

**Pricing Formula:**
```
Cost = (perDay * duration) * sizeRate * categoryMultiplier

Where:
- perDay = 10
- sizeRate: { small: 10, medium: 20, large: 30 }
- categoryMultiplier: { vahicle: 50, forniture: 30, kitchen_stuff: 20, others: 10 }
```

---

## 🔐 Google OAuth

### GET /api/user/auth/google
Initiate Google OAuth.

**Response:** Redirects to Google OAuth consent screen.

### GET /api/user/auth/google/callback
OAuth callback (handled automatically).

**Response:** Redirects to frontend with token.

### GET /api/user/auth/failure
OAuth failure endpoint.

**Response:**
```json
{
  "success": false,
  "error": "Google Authentication Failed",
  "message": "Unable to authenticate with Google",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## ❌ Error Codes

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Bad Request | Invalid request data or validation error |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Access denied or insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists (e.g., email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## 🔄 Common Error Scenarios

### Validation Error
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Please check your input",
  "details": [
    {
      "type": "field",
      "value": "invalid-email",
      "msg": "Please provide a valid email",
      "path": "email",
      "location": "body"
    }
  ],
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### Authentication Error
```json
{
  "success": false,
  "error": "Authentication Required",
  "message": "Please login to access this resource",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

### Role Permission Error
```json
{
  "success": false,
  "error": "Insufficient Permissions",
  "message": "Access denied. Required role: Landlord",
  "timestamp": "2025-07-10T10:30:00.000Z"
}
```

---

## 💡 Development Notes

### Environment Variables
```env
NODE_ENV=development
PORT=4000
MONGOOSEURL=mongodb://127.0.0.1:27017/myOwn
SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GMAIL_USER=your-gmail
GMAIL_PASS=your-gmail-app-password
```

### CORS Configuration
- Frontend URL: `http://localhost:3000`
- Credentials: Enabled

### Cookie Settings
- Name: `token`
- HttpOnly: `true`
- Secure: `true` (production only)
- SameSite: `strict`
- MaxAge: 7 days

### File Upload
- Path: `/public/uploads/`
- Max files: 5
- Allowed types: jpg, jpeg, png
- Max size: 5MB per file

---

## 🚀 Quick Start Example

### 1. Register User
```javascript
const response = await fetch('http://localhost:4000/api/user/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    fullName: 'John Doe',
    email: 'john@example.com',
    password: 'Password123',
    role: 'Tenant'
  })
});
```

### 2. Verify Email
```javascript
const response = await fetch('http://localhost:4000/api/user/verify-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    otp: '123456'
  })
});
```

### 3. Login
```javascript
const response = await fetch('http://localhost:4000/api/user/signin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'Password123'
  })
});

const data = await response.json();
const token = data.data.token;
```

### 4. Make Authenticated Request
```javascript
const response = await fetch('http://localhost:4000/api/properties', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 📞 Support

For any issues or questions, please contact the development team.

**API Version:** 1.0.0  
**Last Updated:** July 10, 2025
