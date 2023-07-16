const mongoose = require('mongoose')

const depositSchema  = mongoose.Schema({
   userId  : {type : mongoose.Schema.Types.ObjectId , ref : "user"},
   amount : {type : Number},
   transactionId : {type : String }
})


const depositModal = mongoose.model('deposit', depositSchema)
module.exports = depositModal;
