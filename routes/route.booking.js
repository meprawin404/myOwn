const { Router } = require("express");
const booking = require("../models/model.booking");

const router = Router();

router.get("/", (req, res)=>{
    return res.render("booking");
})

router.post("/", async (req, res)=>{
    const {category, description, size, duration} = req.body;
    const newBooking = await booking.create({
        category,
        description,
        size,
        duration,
    })

    res.redirect(`/balling/${newBooking._id}`);
})


module.exports = router;

