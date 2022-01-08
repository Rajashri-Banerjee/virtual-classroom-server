const mongoose = require('mongoose');

const dbconnect = async() => {
    await mongoose.connect('mongodb+srv://raj888:Rsbanerjee888_@cluster0.8tkmh.mongodb.net/API?retryWrites=true&w=majority');
    console.log('DB connected')
}

try {
    dbconnect();
}
catch (e)
{
    console.log(e.message)
}
