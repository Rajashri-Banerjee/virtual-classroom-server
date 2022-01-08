const mongoose = require ('mongoose')

const classSchema = mongoose.Schema({
    title : {
        type : String,
        required : true,
        trim : true,
    },
    poster : {
        key:{
            type: String,
        },
        uri:{
            type:String
        }
    },
    subtitle : {
        type : String,
        trim : true,
    },
    notes : [{
        title : {
            type : String,
            required : true,
            trim : true,
        },
        link : {
            type : String,
            required : true,
        },
        created_at: {
            type :Date,
            default: Date.now()
        }
    }],
    assignments : [{
        title : {
            type : String,
            required : true,
            trim : true,
        },
        link : {
            type : String,
            required : true,
        },
    }],
    comments : [{
        body : {
            type : String,
            trim : true,
            required : true,
        },
        user : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
        },
    }],
    notifications : [{
        body : {
            type : String,
            trim : true,
            required : true,
        },
        created_at: {
            type :Date,
            default: Date.now()
        }
    }],
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Teacher',
        required : true,
    },
})

const Room = mongoose.model('Class',classSchema)

module.exports = Room