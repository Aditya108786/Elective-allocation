
const mongoose = require('mongoose')


const SubjectSchema = new mongoose.Schema({
      name:{type:String, required:true, unique:true},
      seatLimit:{type:Number, required:true},
      seatsFilled:{type:Number, default:0}
})

module.exports = mongoose.model("Subject", SubjectSchema)