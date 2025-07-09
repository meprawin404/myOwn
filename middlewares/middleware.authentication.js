const { verifyUserToken } = require("../services/services.authentication");
const User = require("../models/model.user");
const CustomError = require("../utils/customError");
const { sendErrorResponse } = require("../utils/responseFormat");

function checkForAuthenticationCookie(cookieName) {
    return async (req, res, next) => {
        try {
            const tokenCookieValue = req.cookies?.[cookieName];
            const authHeader = req.headers.authorization;
            
            let token = null;
            
            // Check for token in Authorization header first
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else if (tokenCookieValue) {
                token = tokenCookieValue;
            }
            
            if (!token) {
                req.user = null;
                return next();
            }
            
            const userPayload = verifyUserToken(token);
            const user = await User.findById(userPayload._id).select('-password -salt');
            
            if (!user) {
                req.user = null;
                return next();
            }
            
            req.user = user;
            next();
        } catch (error) {
            req.user = null;
            next();
        }
    };
}

function restrictToLoggedInUser(cookieName) {
    return async (req, res, next) => {
        try {
            const tokenCookieValue = req.cookies?.[cookieName];
            const authHeader = req.headers.authorization;
            
            let token = null;
            
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            } else if (tokenCookieValue) {
                token = tokenCookieValue;
            }
            
            if (!token) {
                return sendErrorResponse(res, 401, 'Authentication Required', 'Please login to access this resource');
            }
            
            const userPayload = verifyUserToken(token);
            const user = await User.findById(userPayload._id).select('-password -salt');
            
            if (!user) {
                return sendErrorResponse(res, 401, 'Invalid Token', 'User not found. Please login again');
            }
            
            if (!user.isEmailVerified) {
                return sendErrorResponse(res, 403, 'Email Not Verified', 'Please verify your email before accessing this resource');
            }
            
            req.user = user;
            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return sendErrorResponse(res, 401, 'Invalid Token', 'Please login again');
            }
            if (error.name === 'TokenExpiredError') {
                return sendErrorResponse(res, 401, 'Token Expired', 'Your session has expired. Please login again');
            }
            return sendErrorResponse(res, 500, 'Authentication Error', 'Error verifying token');
        }
    };
}

function restrictToRole(...roles) {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return sendErrorResponse(res, 401, 'Authentication Required', 'Please login to access this resource');
            }
            
            if (!req.user.role) {
                return sendErrorResponse(res, 403, 'Role Not Set', 'Please select your role first');
            }
            
            if (!roles.includes(req.user.role)) {
                return sendErrorResponse(res, 403, 'Insufficient Permissions', `Access denied. Required role: ${roles.join(' or ')}`);
            }
            
            next();
        } catch (error) {
            return sendErrorResponse(res, 500, 'Authorization Error', 'Error checking permissions');
        }
    };
}

module.exports = {
    checkForAuthenticationCookie,
    restrictToLoggedInUser,
    restrictToRole
};