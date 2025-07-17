
require('dotenv').config();


const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const connectDB = require('./config/db')
const studentRoutes = require('./routes/StudentRoute')

const cookieParser = require('cookie-parser')

const app = express()
const port = process.env.PORT || 3000

connectDB()

app.use(cors({
    origin: process.env.FRONTEND_URL ||'http://localhost:5173',
    credentials:true
}))
app.use(bodyParser.json())
app.use(cookieParser())
app.use('/api', studentRoutes)

app.listen(port, ()=>{
    console.log("server running ",port)
})
