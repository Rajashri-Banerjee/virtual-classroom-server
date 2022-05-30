const express = require ('express')
const Room = require('../db/Models/class')
const router = express.Router()
const User = require('./../db/Models/user')
const userAuth = require('./../middlewares/userAuth')
const Chat = require('./../db/Models/chat')
const Teacher = require('./../db/Models/teacher')
const aws = require( 'aws-sdk' );
const multerS3 = require( 'multer-s3' );
const multer = require('multer');
const path = require( 'path' );
const url = require('url')
// S3 object 
// const s3 = new aws.S3({
//     accessKeyId: process.env.AWS_BUCKET_KEY,
//     secretAccessKey: process.env.AWS_BUCKET_SECRET,
//     Bucket: 'rootrskbucket1'
// })
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
router.get('/',(req,res)=>{
    res.json({
        status: 'Welcome to classroom api',
    })
})

//Router for new users to singup  
router.post('/signup',async(req,res) =>{
    try {
        console.log(req.body)
        const user = new User(req.body)
        await user.save()
        console.log(user)
        const token = await user.getAuthToken()
        res.json({
            user,
            token,
        })
    }catch(e){
        console.log(e.message)
        var  error
        if (e.message.includes('index: email_1 dup key:')){
            error='Email ID already taken.'
        }else if(e.message.includes('index: username_1 dup key:')){
            error='Username already taken.'
        }else{
            error: e.message
        }
        res.json({
            status : 'failed',
            error  : error
        })
    }
})
// for loggin user
router.post('/login',async(req,res) =>{
    try {
        console.log(req.body)
        if (!req.body.id || !req.body.password){
            return res.json({
                status : 'failed',
                error : 'User email id / username & password is required',
            })
        }
        const {user,error} = await User.findByCredentials({
            id : req.body.id,
            password : req.body.password,
        })
        if(error)
        {
            return res.json({
                error : error,
                status : 'failed',
            })
        }
        console.log(user)
        const token = await user.getAuthToken()
        res.json({
            user,
            token,
        })
    } catch (e) {
        res.json({
            status : 'failed',
            error : e.message
        })
    }
})
// for getting all registered users
router.get('/users',async(req,res)=>{
    try {
        const users= await User.find()
        res.json(users)
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// For getting user details
router.get('/user/me',userAuth,async(req,res)=>{
    try {
        const user= req.user
        const token = await user.getAuthToken()
        res.json({
            user,
            token
        })
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// for user to join class
router.post('/user/class/join',userAuth,async(req,res)=>{
    try {
        const class_id = req.body.class_id
        const user = req.user
        if(!class_id) {
            return res.json({
                error : 'Provide a valid class ID',
                status : 'failed'
            })
        }
        const room = await Room.findById(class_id).populate('owner')
        const updatedUser = await User.updateOne({_id : req.user._id},
            {$addToSet: { classes: {
                class : room._id,
                teacher : room.owner._id
            } }}
        )
        res.json({room,user})
    }
    catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

//Route for updating profile details
router.patch('/user/profile',userAuth,async(req,res) => {
    try {
        req.user.fullname = req.body.fullname
        req.user.email = req.body.email
        req.user.contact = req.body.contact
        await req.user.save()
        const token = await req.user.getAuthToken()
        res.json({
            user: req.user,
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

router.post( '/user/profile-img',userAuth,async(req,res)=>{
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
            const imageLocation = req.file.location; // Save the file name into database into profile model
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
                user: req.user

            });

        });
    }catch(e){
        res.json({
            error:e.message,
            status:'failed'
        })
    }
    
})

// Route for user to exit form a class
router.delete('/user/class/join',userAuth,async(req,res)=>{
    try {
        const class_id = req.body.class_id
        const user = req.user
        if(!class_id) {
            return res.json({
                error : 'Provide a valid class ID',
                status : 'failed'
            })
        }
        const room = await Room.findById(class_id).populate('owner')
        const updatedUser = await User.updateOne({_id : req.user._id},
            {$pull: { classes: {
                class : room._id,
                teacher : room.owner._id
            } }}
        )
        res.json({room,user})
    }
    catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

router.get('/student/class',async(req,res) => {
    try {
        if(!req.query.id){
            
            return res.json({
                status:'Failed',
                error:'Class ID is required'
            })
        }
        const room = await Room.findById(req.query.id).populate('owner')
        const users = await User.find({'classes.class':room._id}).select('username fullname profile')

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

// Router for getting all classes in which user has joined
router.get('/user/classes',userAuth,async(req,res)=>{
    try{
        const user = await User.findById(req.user._id).populate('classes.class classes.teacher')
        res.json({
            user
        })
    }
    catch(e){
            res.json({
            status : 'failed',
            error : error.message
        })
    }
})
// Route for geting single class details by providing id
router.get('/user/class',async(req,res) => {
    try {
        if(!req.query.id){
            
            return res.json({
                status:'Failed',
                error:'Class ID is required'
            })
        }
        const room = await Room.findById(req.query.id).populate('owner')
        const users = await User.find({'classes.class':room._id}).select('username fullname profile')
        const teacher = room.owner
        let chatRoom = await Chat.findOne({room:room._id})
        .populate('room messages.user messages.admin','title fullname')
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

        if(!room){
            return res.json({
                status:'failed',
                error:'This class does not exist'
            })
        }
        return res.json({
            status:'success',
            room,
            users,
            teacher,
            chat:chatRoom
        })
    }   catch (error) {
            return res.json({
                status:'failed',
                error:error.message
            })
    }
})

/**
 * ChatBox Routers
 */
// send message
router.post('/user/message',userAuth,async(req,res)=>{
    try {
        console.log(req.body)
        const {room_id,body,created_at } = req.body
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
            user:req.user._id,
            created_at
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

router.get('/user/message',async(req,res)=>{
    try {
        const { room_id } = req.query
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

router.delete('/user/message',userAuth,async(req,res)=>{
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

router.post('/user/document-upload',userAuth,async(req,res) => {
    try {
        const room = await Room.findOne({'assignments._id':req.query._id})
        const index = room.assignments.findIndex(i=>i._id.toString() === req.query._id.toString())
        var assignment 
        if (index > -1){
            assignment = room.assignments[index]
        }
        if (assignment){
            const deadline = Date.parse(assignment.deadline)
            const currline = Date.now()
            console.log(deadline,currline)
            if (currline > deadline){
                return res.json({
                    index,
                    assignment,
                    deadline: Date.parse(assignment.deadline),
                    error:`You can't submit this assignment since the deadline was at `+ 
                    new Date(assignment.deadline).toLocaleString()
                })
            }
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

router.post('/user/assignment-submission', userAuth, async(req,res) => {
    console.log(req.body)
    try {
        const room = await Room.findOne({'assignments._id':req.body._id})
        room.assignments = room.assignments.map((assignment)=>{
            if(assignment._id.toString()===req.body._id.toString()){
                assignment.submissions = assignment.submissions.concat({
                    submitted_at: Date.now(),
                    doclink: req.body.doclink,
                    user: req.user._id
                })
                return assignment
            }
            return assignment
        })
        await room.save()
        res.json({
            status: 'success',
            room
        })
    }
    catch(error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})

router.get('/profile/:id',async(req,res)=>{
    try {
        var user =  await User.findById(req.params.id)
        .select('username email fullname profile contact')
        if (!user) {
            user = await Teacher.findById(req.params.id)
            .select('username email fullname profile contact')
        }
        
        res.json({
            status:'success',
            user
        })
    } catch (error) {
        res.json({
            status : 'failed',
            error : error.message
        })
    }
})
module.exports = router