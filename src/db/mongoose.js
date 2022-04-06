const mongoose = require('mongoose');

const dbconnect = async() => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('DB connected')
}

try {
    dbconnect();
}
catch (e)
{
    console.log(e.message)
}
