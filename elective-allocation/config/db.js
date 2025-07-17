
const mongoose = require('mongoose')

const connectDB = async () =>{
    try {
        await mongoose.connect(process.env.MONGODB_URI , {
            UseNewUrlParser:true,
            useUnifiedTopology:true
        });
        console.log('mongodb connected')
    } catch (error) {
      console.error('connection failed', error.message) 
      process.exit(1) 
    }
}

module.exports = connectDB