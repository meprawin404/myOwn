const { Router } = require("express");
const Booking = require("../models/model.booking");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseFormat");

const router = Router();

const rate = { small: 10, medium: 20, large: 30 };
const itemCategory = {vahicle:50, forniture:30, kitchen_stuff:20, others:10};
const perDay = 10;

router.get("/:id", asyncErrorHandler(async (req, res) => {
    const fetchBooking = await Booking.findById(req.params.id);

    if(!fetchBooking){
        return sendErrorResponse(res, 404, 'Not Found', 'Booking not found');
    }

    const {category, size, duration} = fetchBooking;
    const cost = (perDay*duration) * rate[size] * itemCategory[category];

    fetchBooking.cost = cost;
    await fetchBooking.save();

    return sendSuccessResponse(res, 200, 'Billing calculated successfully', {
        cost,
        booking: fetchBooking,
        calculation: {
            perDay,
            duration,
            rate: rate[size],
            categoryMultiplier: itemCategory[category],
            formula: `(${perDay} * ${duration}) * ${rate[size]} * ${itemCategory[category]} = ${cost}`
        }
    });
}));

module.exports = router; 