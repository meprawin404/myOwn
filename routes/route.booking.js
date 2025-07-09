const { Router } = require("express");
const Booking = require("../models/model.booking");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseFormat");

const router = Router();

// Get booking form requirements
router.get("/", (req, res) => {
    return sendSuccessResponse(res, 200, 'Booking form requirements', {
        requiredFields: ['category', 'description', 'size', 'duration'],
        categories: ['vahicle', 'forniture', 'kitchen_stuff', 'others'],
        sizes: ['small', 'medium', 'large'],
        durationUnit: 'days'
    });
});

// Create new booking
router.post("/", asyncErrorHandler(async (req, res) => {
    const {category, description, size, duration} = req.body;
    
    const newBooking = await Booking.create({
        category,
        description,
        size,
        duration,
        createdBy: req.user._id
    });

    return sendSuccessResponse(res, 201, 'Booking created successfully', {
        booking: newBooking,
        nextStep: {
            message: 'You can now calculate billing for this booking',
            endpoint: `/api/balling/${newBooking._id}`,
            method: 'GET'
        }
    });
}));

module.exports = router;

