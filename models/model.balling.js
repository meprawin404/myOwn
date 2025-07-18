const { Schema, model } = require("mongoose");

const ballingSchema = new Schema({
    category:{
        type:String,
        required:true,
        enum:['vahicle', 'forniture', 'kitchen_stuff', 'others']
    },
    size:{
        type:String,
        enum:['small', 'medium', 'large']
    },
    duration:{
        type:Number
    },
    createdBy:{
        type:Schema.Types.ObjectId,
        ref: "booking"
    }
});

const Balling = model("balling", ballingSchema);

module.exports = Balling;