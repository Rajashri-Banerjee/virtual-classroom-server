const mongoose = require ('mongoose')
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const JWT_SECRET = 'kfhfhaiqwoubncbxzj'

const userSchema = mongoose.Schema({
    username : {
        type : String,
        required : true,
        lowercase : true,
        trim : true,
        unique : true,
    },
    fullname : {
        type : String,
        required : true,
        trim : true,
    },
    email : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        unique : true,
    },
    contact:{
        type:String
    },
    password : {
        type : String,
        required : true,
        trim : true,
    },
    profile:{
        avatar:{
            type: String,
        },
        key: {
            type: String
        }
    },
    classes : [{
        class : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Class',
        },
        teacher : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Teacher',
        },
        _id : false
    }]
})

userSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,8)
    }
    next()
})

userSchema.methods.getAuthToken = async function(){
    return token = await jwt.sign({_id: this._id},JWT_SECRET)
}

userSchema.statics.findByCredentials = async function({id,password}){
    let user
    user = await User.findOne({email: id})
    if(!user) user =  await User.findOne({username: id})
    if(!user) return {user: null,error:'no such user found.'}
    console.log(password)
    const isMatched = await bcrypt.compare(password.toString(),user.password)
    console.log(isMatched)
    if(!isMatched){
        return {user:null,error:'password is not correct.'}
    }
    return {user,error:null}
}

const User = mongoose.model('User',userSchema)

module.exports = User