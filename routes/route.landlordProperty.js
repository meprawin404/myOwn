const { Router } = require("express");
const upload = require("../middlewares/middleware.upload");
const Property = require("../models/model.property");
const asyncErrorHandler = require("../utils/asyncErrorHandler");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/responseFormat");

const router = Router();

// Get property form requirements
router.get("/add-property", (req, res) => {
    return sendSuccessResponse(res, 200, 'Property form requirements', {
        requiredFields: ['address', 'size', 'rent', 'contact'],
        optionalFields: ['images'],
        imageLimit: 5,
        allowedImageTypes: ['jpg', 'jpeg', 'png'],
        maxImageSize: '5MB'
    });
});

// Handle property listing
router.post("/add-property", upload.array("images", 5), asyncErrorHandler(async (req, res) => {
    const { address, size, rent, contact } = req.body;

    const imagepath = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const newProperty = await Property.create({
        address,
        size,
        rent,
        listedBy: req.user._id,
        photo: imagepath,
        contact
    });

    return sendSuccessResponse(res, 201, 'Property added successfully', newProperty);
}));

// Get landlord's properties
router.get("/properties", asyncErrorHandler(async (req, res) => {
    const properties = await Property.find({ listedBy: req.user._id });
    
    return sendSuccessResponse(res, 200, 'Properties retrieved successfully', {
        count: properties.length,
        properties
    });
}));

module.exports = router;

