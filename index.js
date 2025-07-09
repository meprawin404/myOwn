const express = require("express");
require('dotenv').config();
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");

const connectToMongoDb = require("./connect.js");
const bookingRoute = require("./routes/route.booking.js");
const ballingRoute = require("./routes/route.balling.js");
const userRoute = require("./routes/router.user.js");
const landlordRoute = require("./routes/route.landlordProperty.js");
const listAllProperties = require("./routes/route.listProperties.js");
const { checkForAuthenticationCookie, restrictToLoggedInUser, restrictToRole } = require("./middlewares/middleware.authentication");
const passport = require('./config/passport.js');
const session = require("express-session");
const { sendErrorResponse } = require("./utils/responseFormat");

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too Many Requests',
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Too Many Auth Attempts',
        message: 'Too many authentication attempts, please try again later.'
    }
});
app.use('/api/user/signin', authLimiter);
app.use('/api/user/signup', authLimiter);
app.use('/api/user/forgot-password', authLimiter);

// Database connection 
connectToMongoDb(process.env.MONGOOSEURL)
.then(() => console.log("Database Connected"))
.catch(err => {
    console.error("Database connection failed:", err);
    process.exit(1);
});

// Body parsing middleware
app.use(express.urlencoded({extended: false, limit: '10mb'}));
app.use(express.json({limit: '10mb'}));

// Cookie and authentication middleware
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));

// Session and passport configuration
app.use(session({ 
    secret: process.env.SECRET || 'default-secret', 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// API routes
app.use("/api/properties", restrictToLoggedInUser("token"), listAllProperties);
app.use("/api/booking", restrictToLoggedInUser("token"), bookingRoute);
app.use("/api/balling", restrictToLoggedInUser("token"), ballingRoute);
app.use("/api/landlord", restrictToLoggedInUser("token"), restrictToRole("Landlord"), landlordRoute);
app.use("/api/user", userRoute);

// Health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({ 
        success: true,
        message: "Welcome to Rento API", 
        version: "1.0.0",
        status: "active",
        timestamp: new Date().toISOString(),
        endpoints: {
            users: "/api/user",
            properties: "/api/properties",
            bookings: "/api/booking",
            balling: "/api/balling",
            landlord: "/api/landlord"
        }
    });
});

// Handle undefined routes
app.use('*', (req, res) => {
    sendErrorResponse(res, 404, 'Route Not Found', `Cannot ${req.method} ${req.originalUrl}`);
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error Stack:', err.stack);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return sendErrorResponse(res, 400, 'Validation Error', 'Please check your input', errors);
    }
    
    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        return sendErrorResponse(res, 400, 'Invalid ID Format', 'Please provide a valid ID');
    }
    
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return sendErrorResponse(res, 409, 'Duplicate Error', `${field} '${value}' already exists`);
    }
    
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return sendErrorResponse(res, 401, 'Invalid Token', 'Please login again');
    }
    
    if (err.name === 'TokenExpiredError') {
        return sendErrorResponse(res, 401, 'Token Expired', 'Your session has expired. Please login again');
    }
    
    // Multer errors (file upload)
    if (err.code === 'LIMIT_FILE_SIZE') {
        return sendErrorResponse(res, 400, 'File Too Large', 'File size exceeds the limit');
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return sendErrorResponse(res, 400, 'Invalid File', 'Unexpected file field');
    }
    
    // Custom operational errors
    if (err.isOperational) {
        return sendErrorResponse(res, err.statusCode, 'Application Error', err.message);
    }
    
    // Programming or other unknown errors
    if (process.env.NODE_ENV === 'development') {
        return sendErrorResponse(res, 500, 'Internal Server Error', err.message, err.stack);
    }
    
    // Production error (don't leak error details)
    sendErrorResponse(res, 500, 'Internal Server Error', 'Something went wrong on our end. Please try again later.');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

const server = app.listen(PORT, () => {
    console.log(`Server running at port:${PORT}`);
});

module.exports = app;