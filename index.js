const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const connectToMongoDb = require("./connect.js");
const bookingRoute = require("./routes/route.booking.js");
const ballingRoute = require("./routes/route.balling.js");

dotenv.config();

const app = express();
const PORT = process.env.PORT;


//middleware for data coming from frontend
app.use(express.urlencoded({extended:false})); //for form data
app.use(express.json()); //for json data or url hits


//middleware for ejs frontend
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use("/booking", bookingRoute);
app.use("/balling", ballingRoute);


//database connection 
connectToMongoDb(process.env.MONGOOSEURL)
.then(()=> console.log("Database Connected"));

app.listen(PORT, ()=>{
    console.log(`Server running at port:${PORT}`);
    
})