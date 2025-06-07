const { validateToken } = require("../services/services.authentication");

function checkForAuthenticationCookie(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];

        if (!tokenCookieValue) {
            return next(); 
        }

        try {
            const userPayload = validateToken(tokenCookieValue);
            req.user = userPayload; 
        } catch (err) {
            console.error("Invalid token:", err.message);
        }

        next(); 
    };
}

module.exports = {
    checkForAuthenticationCookie
};