const mongoose = require('mongoose')

const withdrawlSchema  = mongoose.Schema({
   userId  : {type : mongoose.Schema.Types.ObjectId , ref : "user"},
   amount : {type : Number},
   upiId : {type : String }
})


const withdrawModal = mongoose.model('withdraw', withdrawlSchema)
module.exports = withdrawModal;
