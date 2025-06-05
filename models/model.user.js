const {Schema, model} = require("mongoose");
const {createHmac, randomBytes} = require("crypto");

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
    },
    role:{
        type:String,
        enum:["Tanent", "Landlord", "Enterprise"],
        default: "Tanent"
    }
}, {timestamps: true});


userSchema.pre('save', function(next){
    const user = this;
    if(!user.isModified("password")) return;

    const salt = randomBytes(16).toString();
    const hashPassword = createHmac("sha256", salt)
        .update(user.password)
        .digest("hex")

    this.salt = salt;
    this.password = hashPassword;

    next();
 
})



const User = model("user",userSchema);

module.exports = User;