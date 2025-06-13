const { Router } = require("express");
const upload = require("../middlewares/middleware.upload");
const Property = require("../models/model.property");

const router = Router()


//render frontEnd for the add property route
router.get("/add-property", (req, res) => {
    res.render("addProperty"); // Render the addProperty.ejs file
});


//handle property listing
router.post("/add-property", upload.array("images", 5), async (req, res) =>{

    const { address, size, rent } = req.body;

    try{
        const imagepath = req.files.map(file => `/uploads/${file.filename}`);

        await Property.create({
            address,
            size,
            rent,
            listedBy: req.user._id,
            photo: imagepath
        });

        res.redirect("/properties");

    }catch(err){
        res.status(500).send("Error adding property");
    }
})

router.get("/properties", async (req, res)=>{
    try{
        const properties = await Property.find({ listedBy: req.user._id});
        res.render("properties", { properties });
    }catch(err){
        res.status(500).send("Error listing properties");
    }
})


module.exports = router;

