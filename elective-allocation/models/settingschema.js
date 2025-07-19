
const mongoose = require('mongoose')

const SettingSchema = new mongoose.Schema({
    maxPreferences:{
        type:Number,
        default:4
    }
})

module.exports = mongoose.model("preferenceMax", SettingSchema)