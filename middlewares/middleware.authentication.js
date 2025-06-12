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


function restrictToLoggedInUser(cookieName) {
    return (req, res, next) => {
        const tokenCookieValue = req.cookies[cookieName];
        
        if (!tokenCookieValue) {
            return res.redirect("/user/signin");
        }

        try {
            const userPayload = validateToken(tokenCookieValue); // Validate the token
            req.user = userPayload; // Attach the user payload to the request
        } catch (err) {
            console.error("Invalid or expired token:", err.message);
            return res.redirect("/user/signin"); // Redirect if the token is invalid
        }

        next(); 
    };
}

module.exports = {
  checkForAuthenticationCookie,
  restrictToLoggedInUser
};
