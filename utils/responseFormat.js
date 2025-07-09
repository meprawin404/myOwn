const sendSuccessResponse = (res, statusCode, message, data = null) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

const sendErrorResponse = (res, statusCode, error, message = null, details = null) => {
    res.status(statusCode).json({
        success: false,
        error,
        message: message || error,
        details,
        timestamp: new Date().toISOString()
    });
};

module.exports = { sendSuccessResponse, sendErrorResponse };