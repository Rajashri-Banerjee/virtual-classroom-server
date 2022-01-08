const mongoose = require ('mongoose')
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const JWT_SECRET = 'kfhfhaiqwoubncbxzj'

const teacherSchema = mongoose.Schema({
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
        // ab ye kya khol diye ho kuch nahi tum join kro client  okhokl na hathadaskjhfsalkhfsakjhfok
    },
    email : {
        type : String,
        required : true,
        trim : true,
        lowercase : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
        trim : true,
    },
    contact : {
        type : String,
        trim : true,
    },
    profile:{
        avatar:{
            type: String,
        },
        key: {
            type: String
        }
    }
})

teacherSchema.pre('save',async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password,8)
    }
    next()
})

teacherSchema.methods.getAuthToken = async function(){
    return token = await jwt.sign({_id: this._id},JWT_SECRET)
}

teacherSchema.statics.findByCredentials = async function({id,password}){
    let teacher
    teacher = await Teacher.findOne({email: id})
    if(!teacher) teacher =  await Teacher.findOne({username: id})
    if(!teacher) return {teacher: null,error:'no such user found.'}
    console.log(password)
    const isMatched = await bcrypt.compare(password.toString(),teacher.password)
    console.log(isMatched)
    if(!isMatched){
        return {teacher:null,error:'password is not correct.'}
    }
    return {teacher,error:null}
}

const Teacher = mongoose.model('Teacher',teacherSchema)

module.exports = Teacher