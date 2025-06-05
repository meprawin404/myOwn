const { Router } = require("express");
const User = require("../models/model.user");

const router = Router();

router.get('/signup', (req, res) =>{
    return res.render("signup");
})

router.post('/signup', async (req, res)=>{
    const {fullName, email, password} = req.body;
    await User.create({
        fullName,
        email,
        password
    })

    res.redirect("/booking");
})


module.exports = router;