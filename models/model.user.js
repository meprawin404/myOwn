const {Schema, model} = require("mongoose");

const userSchema = new Schema({
    fullName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    profileImageUrl:{
        type:String,
        default: "/images/default.png"
    },
    salt:{
        type:String
    },
    password:{
        type:String,
        required:true
    }
}, {timestamps: true})




const User = model("user",userSchema);

module.exports = User;