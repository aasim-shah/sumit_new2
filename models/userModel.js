const mongoose = require('mongoose')

const userSchema  = mongoose.Schema({
    firstName : String,
    lastName : String,
    phone : {type: String } ,
    wallet1 : {type: Number } ,
    wallet2 : {type: Number } ,
    profilePic : String,
    gameMatching : {type : Boolean , default : false}

})


const userModel = mongoose.model('user', userSchema)
module.exports = userModel;
