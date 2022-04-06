const mongoose = require ('mongoose')

const chatSchema = mongoose.Schema({
    room:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Class'
    },
    messages:[{
        body:{
            type: String,
            trim:true,
            required: true,
        },
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        admin:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
            // default:''
        },
        created_at:{
            type:Date,
            default: new Date()
        }
    }],
    blocked_users:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
})

const Chat = mongoose.model('Chat',chatSchema)

module.exports = Chat