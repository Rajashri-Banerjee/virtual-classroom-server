const express = require('express')
const User = require('./src/db/Models/user')
const userRouter = require ('./src/routes/user')
const teacherRouter = require ('./src/routes/teacher')
const dotenv = require ('dotenv');
const morgan = require('morgan');
const cors = require('cors');

const app = express()
app.use(express.json())
app.use(morgan('common'))
app.use(cors())
dotenv.config();
// app.use(function (req, res, next) {

//   // Website you wish to allow to connect
//   const allowedOrigins = [
//       "http://localhost:3000",
//   ];
//   const origin = req.headers.origin;
//     if (true) {
//         res.setHeader('Access-Control-Allow-Origin', "*");
//     }
//     res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

//     // Request headers you wish to allow
//     res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Set-Cookie,Authorization,authorization');
//     res.setHeader('Access-Control-Allow-Credentials', true);

//     // Pass to next layer of 
//     next();
//   });

app.use(userRouter)
app.use(teacherRouter)
const port = process.env.PORT || 3001

require ('./src/db/mongoose')

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})