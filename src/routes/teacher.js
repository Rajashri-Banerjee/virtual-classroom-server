const express = require ('express')
const router = express.Router()
const Teacher = require('./../db/Models/teacher')
const Room = require('./../db/Models/class')
const teacherAuth = require('./../middlewares/teacherAuth')
const User = require('../db/Models/user')
const Chat = require('./../db/Models/chat')


const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );
const url = require('url')
// S3 object 
const s3 = new aws.S3({
    accessKeyId: 'AKIA3OYGIS7MBPLU7EO2',
    secretAccessKey: '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',
    Bucket: 'rootrskbucket1'
})
// Upload Function 
const profileImgUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'rootrskbucket1',
        acl: 'public-read',
        key: function (req, file, cb) {
            cb(null, path.basename( file.originalname, path.extname( file.originalname ) ) + '-' + Date.now() + path.extname( file.originalname ) )
        }
    }),
    limits:{ fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
    fileFilter: function( req, file, cb ){
        checkFileType( file, cb );
    }
}).single('img')
// Function to check file type 
function checkFileType( file, cb ){
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|pdf/;
    // Check ext
    const extname = filetypes.test( path.extname( file.originalname ).toLowerCase());
    // Check mime
    const mimetype = filetypes.test( file.mimetype );if( mimetype && extname ){
        return cb( null, true );
    } else {
        cb( 'Error: Images Only!' );
    }
}

router.post( '/teacher/profile-img',teacherAuth,async(req,res)=>{
    try{
        profileImgUpload( req, res, ( error ) => {
            if(error){
                return res.json({
                    error: error
                })
            }
            if(req.file === undefined){
                return res.json({
                    error:'No File Selected.',
                    status:'failed'
                })
            }
            const imageName = req.file.key;
            const imageLocation = req.file.location;// Save the file name into database into profile model
            console.log(req.user)
            if(req.user.profile && req.user.profile.key){
                // deleting 
                console.log('deleing')
                s3.deleteObject({ Bucket: 'rootrskbucket1', Key: req.user.profile.key }, (err, data) => {
                    console.error(err);
                    console.log(data);
                });
            }
            
            req.user.profile = {
                avatar: imageLocation,
                key: imageName
            };
            req.user.save()
            res.json({
                image: imageName,
                location: imageLocation,
                status:'success',
                error:null,
                teacher: req.user

            });

            // if( error ){
            //     console.log( 'errors', error );
            //     res.json( { error: error } );
            // }else {
            //     // If File not found

            //         if( req.file === undefined ){
            //             res.json( 'Error: No File Selected' );
            //         } else {
            //     // If Success
            //         const imageName = req.file.key;
            //         const imageLocation = req.file.location;// Save the file name into database into profile model
            //         res.json({
            //             image: imageName,
            //             location: imageLocation
            //         });
            //     }
            // }
        });
    }catch(e){
        res.json({
            error:e.message,
            status:'failed'
        })
    }
    
})
// Router for new teacher teacher to create new accout.
router.post('/teacher/signup',async(req,res) =>{
    try {
        console.log(req.body)
        const teacher = new Teacher(req.body)
        await teacher.save()
        console.log(teacher)
        const token = await teacher.getAuthToken()
        res.json({
            teacher,
            token,
        })
    }catch(e){
        res.json({
            status : 'failed',
            error  : e.message
        })
    }
})
// Router for teacher to login
router.post('/teacher/login',async(req,res) =>{
    try {
        console.log(req.body)
        if (!req.body.id || !req.body.password){
            return res.json({
                status : 'failed',
                error : 'Teacher email / Teachername & password is required',
            })
        }
        const {teacher,error} = await Teacher.findByCredentials({
            id : req.body.id,
            password : req.body.password,
        })
        console.log(teacher)
        if(error)
        {
            return res.json({
                error : error,
                status : 'failed',
            })
        }
        const token = await teacher.getAuthToken()
        res.json({
            teacher,
            token,
        })
    } catch (e) {
        res.json({
            status : 'failed',
            error : e.message
        })
    }
})
// Router to get All teachers
router.get('/teachers',async(req,res)=>{
    try {
        const teachers= await Teacher.find()
        res.json(teachers)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

// Route for creating  new class
router.post('/teacher/class',teacherAuth,async(req,res) =>{
    try {
        console.log(req.body)
        const room = new Room({...req.body,owner:req.user._id})
        await room.save()
        console.log(room)
        res.json(room)
    }
    catch(e) {
        res.json({
            status : 'failed',
            error  : e.message
        })
    }
})

//Route for updating class
router.patch('/teacher/class',teacherAuth,async(req,res) => {
    console.log(req.body)
    try {
        const _id = req.body._id
        if(!_id){
            return res.json({
                error : 'Provide a valid ID',
                status : 'failed'
            })
        }
        const room = await Room.findByIdAndUpdate(_id,req.body)
        res.json(room)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// Router for deleting class
router.delete('/teacher/class',teacherAuth,async(req,res) => {
    try {
        const _id = req.body._id
        if(!_id){
            return res.json({
                error : 'Provide a valid ID',
                status : 'failed'
            })
        }
        const r = await Room.findById(_id)
        console.log(r)
        console.log(req.user)
        if(req.user._id.toString() !== r.owner.toString()){
            return res.json({
                error:'Your are not the owner of this class.'
            })
        }
        const room = await Room.findByIdAndDelete(_id,req.body)
        res.json(room)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// Router to get single class for teacher by providing class id
router.get('/teacher/class',async(req,res) => {
    try {
        if(!req.query.id){
            
            return res.json({
                status:'Failed',
                error:'Class ID is required'
            })
        }
        const room = await Room.findById(req.query.id).populate('assignments.submissions.user','fullname')
        const users = await User.find({'classes.class':room._id}).select('username fullname')

        if(!room){
            return res.json({
                status:'failed',
                error:'This class does not exist'
            })
        }
        return res.json({
            status:'success',
            room,
            users
        })
    }   catch (error) {
            return res.json({
                status:'failed',
                error:error.message
            })
    }
})

//Route for teacher's details
router.get('/teacher/me',teacherAuth,async(req,res)=>{
    try {
        const users= req.user
        res.json(users)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

//Route for teacher's all classes
router.get('/teacher/classes',teacherAuth,async(req,res)=>{
    try {
        console.log(req.user.username)
        const classes = await Room.find({
            owner : req.user._id
        })
        res.json({
            user : req.user,
            classes : classes
        })
    }
    catch(e){
        res.json({
            status : 'failed',
            error : e.message
        })
    }
})
// routes for updiang profile details
router.patch('/teacher/profile',teacherAuth,async(req,res) => {
    try {
        req.user.fullname = req.body.fullname
        req.user.email = req.body.email
        req.user.contact = req.body.contact
        await req.user.save()
         const token = await req.user.getAuthToken()
        res.json({
            teacher: req.user,
            token,
            status:'success'
        })
    }catch(e){
        res.json({
            status : 'failed',
            error : e.message  
        })
    }
})
// update poster route
router.post('/teacher/class-poster',teacherAuth,async(req,res)=>{
    try{

        if(!req.query.id){
            return res.json({
                status:'Failed',
                error:'Class ID is required'
            })
        }
        const room = await Room.findById(req.query.id)
        if(!room){
            return res.json({
                status:'Failed',
                error:'This class dosn\'t exist'
            })
        }
        if(room.owner.toString() !== req.user._id.toString()){
            return res.json({
                status:'Failed',
                error:'You are not the owner of this class'
            })
        }
        profileImgUpload( req, res, ( error ) => {
            if(error){
                return res.json({
                    error: error
                })
            }
            if(req.file === undefined){
                return res.json({
                    error:'No File Selected.',
                    status:'failed'
                })
            }
            const imageName = req.file.key;
            const imageLocation = req.file.location;// Save the file name into database into profile model
            console.log(req.user)
            if(room.poster && room.poster.key){
                // deleting 
                console.log('deleing')
                s3.deleteObject({ Bucket: 'rootrskbucket1', Key: req.user.profile.key }, (err, data) => {
                    console.error(err);
                    console.log(data);
                });
            }
            
            room.poster = {
                uri: imageLocation,
                key: imageName
            };
            room.save()
            res.json({
                image: imageName,
                location: imageLocation,
                status:'success',
                error:null,
                room
            });
        });
    } catch (error) {
        
    }
})

// 
router.post('/teacher/document-upload',teacherAuth,async(req,res) => {
    try {
        profileImgUpload( req, res, ( error ) => {
            if(error){
                return res.json({
                    error: error
                })
            }
            if(req.file === undefined){
                return res.json({
                    error:'No File Selected.',
                    status:'failed'
                })
            }
            const imageName = req.file.key;
            const imageLocation = req.file.location;// Save the file name into database into profile model

            res.json({
                id: imageName,
                uri: imageLocation,
            })
        });
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

/** For testing */
router.get('/classes',async(req,res)=>{
    const classes = await Room.find({})
    res.json({
        classes
    })
})
router.get('/chats',async(req,res)=>{
    const chat = await Chat.find({})
    res.json({
        chat
    })
})

router.post('/teacher/message',teacherAuth,async(req,res)=>{
    try {
        console.log(req.body)
        const {room_id,body } = req.body
        console.log(room_id,body)
        if(!room_id){
            return res.json({
                error:"Room is required.",
                status:'falied'
            })
        }
        const room = await Room.findById(room_id.toString())
        if(!room){
            return res.json({
                error:"No Such Room Exist.",
                status:'falied'
            })
        }
        let chatRoom = await Chat.findOne({room:room._id})
        if(!chatRoom){
            const newChatRoom = new Chat({
                room:room._id,
            })
            await newChatRoom.save()
            chatRoom = await Chat.findOne({room:room._id})
            if(!chatRoom) {
                return res.json({
                    error : "Something went wrong",
                    status : 'failed'
                })
            }
        }
        const message ={
            body,
            admin:req.user._id
        }
        chatRoom.messages = chatRoom.messages.concat(message)
        await chatRoom.save()
        chatRoom = await Chat.findOne({room:room._id})
        .populate('room messages.user messages.admin','title fullname')
        
        res.json({
            status:'Success',
            chatRoom
        })
    } catch (error) {
        res.json({
            error: error.message
        })
    }
})

router.get('/teacher/message',async(req,res)=>{
    try {
        const { room_id } = req.query
        console.log(room_id)
        if(!room_id){
            return res.json({
                error:"No Such Room Exist.",
                status:'falied'
            })
        }
        const chatRoom = await Chat.findOne({room:room_id})
        .populate('room messages.user messages.admin','title fullname')
        res.json({
            chatRoom
        })

    } catch (error) {
        res.json({
            error:error.message
        })
    }
})

router.delete('/teacher/message',teacherAuth,async(req,res)=>{
    try {
        console.log(req.body)
        const {_id,body } = req.body
        console.log(_id,body)
        if(!_id){
            return res.json({
                error:"Room is required.",
                status:'falied'
            })
        }
        // const room = await Room.findById(room_id.toString())
        let chatRoom = await Chat.findOne({'messages._id':_id})
        if(!chatRoom){
            return res.json({
                error : "Message already deleted",
                status : 'failed'
            })
        }
        chatRoom.messages = chatRoom.messages.filter((message)=> {
            return message._id.toString()!==_id.toString()
        })
        await chatRoom.save()
        chatRoom = await Chat.findOne({_id:chatRoom._id})
        .populate('room messages.user messages.admin','title fullname')
        
        res.json({
            status:'Success',
            chatRoom
        })
    } catch (error) {
        res.json({
            error: error.message
        })
    }
})

//Assignment Routes

router.post('/teacher/assignment',teacherAuth,async(req,res)=> {
    try{

    }
    catch(error){

    }
})

module.exports = router
