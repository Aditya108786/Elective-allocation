
const jwt = require('jsonwebtoken')

const adminAuth=(req,res, next)=>{
    
    const token = req.cookies.token

    if(!token){
        return res.status(401).json({error:"access denied. No token provided"})
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded
    next()
}

module.exports = adminAuth