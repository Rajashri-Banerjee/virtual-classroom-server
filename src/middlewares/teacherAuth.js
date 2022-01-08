const Teacher = require("../db/Models/teacher")
const jwt = require('jsonwebtoken')
const ObjectId = require('mongoose').Types.ObjectId
const JWT_SECRET = 'kfhfhaiqwoubncbxzj'

//const { authError } = require("./errorHandler")
const userAuth = async(req,res, next)=>{
try {
        const {authorization} = req.headers
        if(!authorization) throw new Error('auth token is required')
        console.log(authorization)
        console.log(JWT_SECRET)
        const {_id} = await jwt.verify(authorization,JWT_SECRET)
        if(!_id) throw new Error('invalid token')
        if (!ObjectId.isValid(_id)) throw new Error('invalid token')
        const user = await Teacher.findById(_id)
        if (!user) throw new Error('invalid token')
        req.user = user
        next()
    } catch (e) {
        console.log(e)
        //const {error,status_code} = authError(e.message)
        res.json({
            error : e.message,
        })
    }
}
module.exports = userAuth