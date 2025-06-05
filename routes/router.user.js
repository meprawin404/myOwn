const { Router } = require("express");
const User = require("../models/model.user");

const router = Router();

//handle sigin
router.get('/signin', (req, res)=>{
    return res.render("signin");
})

router.post("/signin", async (req, res)=>{
    const {email, password } = req.body;
    const user = await User.matchPassword(email, password);
    console.log(user);

    return res.redirect("/booking");
})


//handle signup
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

    res.redirect("/user/signin");
})


module.exports = router;