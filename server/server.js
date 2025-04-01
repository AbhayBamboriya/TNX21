const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true 
  }));

console.log(process.env.MONGO_URI);


const connectionToDB=async()=>{
    try{
        // it willproide a instance
        const {connection}=await mongoose.connect(
            process.env.MONGO_URI
        )
        if(connection){
            console.log(`Connected to mongo DB: ${connection.host}`);
        }
        
    }
    catch(e){
        console.log(e);
        // forcefully exit
        process.exit(1);
    }
}
connectionToDB()

app.use('/api/auth', require('./routes/auth'));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/build'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));