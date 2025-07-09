const { Router } = require("express");
const User = require("../models/model.user");
const passport = require("../config/passport");
const { createHmac, randomBytes } = require("crypto");
const sendEmail = require("../services/email");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const CustomError = require("../utils/customError");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseFormat");
const {
    validateSignup,
    validateSignin,
    validateOTP,
    validateResetPassword,
    validateEmail,
    validateRole
} = require("../middlewares/middleware.validation");

const router = Router();

// Signup
router.post("/signup", validateSignup, asyncErrorHandler(async (req, res) => {
    const { fullName, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return sendErrorResponse(res, 409, 'Email Already Registered', 'Please sign in or use another email');
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create user
    const user = await User.create({
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        password,
        role,
        emailVerificationOTP: otp,
        emailVerificationExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
    });
    
    // Send OTP email
    await sendEmail({
        email: user.email,
        subject: "Email Verification - Rento",
        message: `Hi ${user.fullName},\n\nWelcome to Rento! Your email verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nRento Team`
    });
    
    sendSuccessResponse(res, 201, 'Registration successful. Please check your email for verification code.', {
        email: user.email
    });
}));

// Sign in
router.post("/signin", validateSignin, asyncErrorHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return sendErrorResponse(res, 401, 'Invalid Credentials', 'Email or password is incorrect');
    }
    
    if (!user.isEmailVerified) {
        // Resend OTP if email not verified
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.emailVerificationOTP = otp;
        user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
        await user.save();
        
        await sendEmail({
            email: user.email,
            subject: "Email Verification Required - Rento",
            message: `Hi ${user.fullName},\n\nPlease verify your email with this code: ${otp}\n\nThis code will expire in 10 minutes.`
        });
        
        return sendErrorResponse(res, 403, 'Email Not Verified', 'Please verify your email. New verification code sent to your email.');
    }
    
    try {
        const token = await User.matchPasswordandGenerateToken(email.toLowerCase(), password);
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        
        sendSuccessResponse(res, 200, 'Login successful', {
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profileImageUrl: user.profileImageUrl
            }
        });
    } catch (error) {
        return sendErrorResponse(res, 401, 'Invalid Credentials', 'Email or password is incorrect');
    }
}));

// Verify OTP
router.post("/verify-otp", validateOTP, asyncErrorHandler(async (req, res) => {
    const { email, otp } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return sendErrorResponse(res, 404, 'User Not Found', 'No account found with this email');
    }
    
    if (user.isEmailVerified) {
        return sendErrorResponse(res, 400, 'Already Verified', 'Email is already verified');
    }
    
    if (!user.emailVerificationOTP) {
        return sendErrorResponse(res, 400, 'No OTP Found', 'Please request a new verification code');
    }
    
    if (user.emailVerificationOTP !== otp) {
        return sendErrorResponse(res, 400, 'Invalid OTP', 'The verification code is incorrect');
    }
    
    if (Date.now() > user.emailVerificationExpires) {
        return sendErrorResponse(res, 400, 'OTP Expired', 'Verification code has expired. Please request a new one');
    }
    
    // Verify user
    user.isEmailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Send welcome email
    await sendEmail({
        email: user.email,
        subject: "Welcome to Rento!",
        message: `Hi ${user.fullName},\n\nYour email has been verified successfully! Welcome to Rento.\n\nYou can now access all features of our platform.\n\nBest regards,\nRento Team`
    });
    
    sendSuccessResponse(res, 200, 'Email verified successfully', {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        }
    });
}));

// Resend OTP
router.post("/resend-otp", validateEmail, asyncErrorHandler(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return sendErrorResponse(res, 404, 'User Not Found', 'No account found with this email');
    }
    
    if (user.isEmailVerified) {
        return sendErrorResponse(res, 400, 'Already Verified', 'Email is already verified');
    }
    
    // Check if last OTP was sent less than 1 minute ago
    if (user.emailVerificationExpires && (Date.now() - (user.emailVerificationExpires - 10 * 60 * 1000)) < 60000) {
        return sendErrorResponse(res, 429, 'Too Many Requests', 'Please wait at least 1 minute before requesting a new code');
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOTP = otp;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();
    
    await sendEmail({
        email: user.email,
        subject: "New Verification Code - Rento",
        message: `Hi ${user.fullName},\n\nYour new verification code is: ${otp}\n\nThis code will expire in 10 minutes.`
    });
    
    sendSuccessResponse(res, 200, 'New verification code sent to your email');
}));

// Signout
router.post("/signout", (req, res) => {
    req.logout?.((err) => {
        if (err) {
            return sendErrorResponse(res, 500, 'Logout Failed', 'Unable to logout. Please try again');
        }
        res.clearCookie('token');
        sendSuccessResponse(res, 200, 'Logout successful');
    });
});

// Forgot Password
router.post("/forgot-password", validateEmail, asyncErrorHandler(async (req, res) => {
    const { email } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        // Don't reveal if email exists or not for security
        return sendSuccessResponse(res, 200, 'If an account with this email exists, a password reset link has been sent');
    }
    
    // Check if reset token was sent less than 5 minutes ago
    if (user.resetPasswordExpires && (Date.now() - (user.resetPasswordExpires - 10 * 60 * 1000)) < 5 * 60 * 1000) {
        return sendErrorResponse(res, 429, 'Too Many Requests', 'Please wait at least 5 minutes before requesting another password reset');
    }
    
    const resetToken = randomBytes(32).toString("hex");
    user.resetPasswordToken = createHmac("sha256", process.env.SECRET || 'default-secret')
        .update(resetToken)
        .digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    
    const resetURL = `${req.protocol}://${req.get("host")}/api/user/reset-password?token=${resetToken}`;
    
    await sendEmail({
        email: user.email,
        subject: "Password Reset Request - Rento",
        message: `Hi ${user.fullName},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetURL}\n\nThis link will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nRento Team`
    });
    
    sendSuccessResponse(res, 200, 'If an account with this email exists, a password reset link has been sent');
}));

// Reset Password
router.post("/reset-password", validateResetPassword, asyncErrorHandler(async (req, res) => {
    const { token, password } = req.body;
    
    const hashedToken = createHmac("sha256", process.env.SECRET || 'default-secret')
        .update(token)
        .digest("hex");
    
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    });
    
    if (!user) {
        return sendErrorResponse(res, 400, 'Invalid or Expired Token', 'Password reset token is invalid or has expired');
    }
    
    user.password = password; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    // Send confirmation email
    await sendEmail({
        email: user.email,
        subject: "Password Reset Successful - Rento",
        message: `Hi ${user.fullName},\n\nYour password has been successfully reset.\n\nIf you didn't make this change, please contact our support immediately.\n\nBest regards,\nRento Team`
    });
    
    sendSuccessResponse(res, 200, 'Password reset successful. You can now login with your new password');
}));

// Select Role (for OAuth users)
router.post("/select-role", validateRole, asyncErrorHandler(async (req, res) => {
    const { role } = req.body;
    
    if (!req.user) {
        return sendErrorResponse(res, 401, 'Authentication Required', 'Please login to select a role');
    }
    
    if (req.user.role) {
        return sendErrorResponse(res, 400, 'Role Already Set', 'You have already selected a role');
    }
    
    const user = await User.findByIdAndUpdate(
        req.user._id, 
        { role }, 
        { new: true, runValidators: true }
    ).select('-password -salt');
    
    sendSuccessResponse(res, 200, 'Role updated successfully', {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl
        }
    });
}));

// Google OAuth routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/api/user/auth/failure" }),
    asyncErrorHandler(async (req, res) => {
        if (!req.user) {
            return res.redirect('/api/user/auth/failure');
        }
        
        // Generate token for frontend
        const token = require("../services/services.authentication").generateUserToken(req.user);
        
        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        
        // Redirect to frontend with success
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}`);
    })
);

router.get("/auth/failure", (req, res) => {
    sendErrorResponse(res, 401, 'Google Authentication Failed', 'Unable to authenticate with Google');
});

module.exports = router;