const { Router } = require("express");
const Properties = require("../models/model.property");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseFormat");

const router = Router();

router.get("/", asyncErrorHandler(async (req, res) => {
    const properties = await Properties.find({});
    
    return sendSuccessResponse(res, 200, 'All properties retrieved successfully', {
        count: properties.length,
        properties
    });
}));

module.exports = router;