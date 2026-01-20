import ConnectDB from './db/index.js';
import dotenv from 'dotenv'
import {app} from './app.js'

dotenv.config({
    path : './env'
})

ConnectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`server is runing on port ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("mongoDB connection fail !!!",err)
})


















// (async ()=>{
//     try {
//        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME} `)
//         app.listen(process.env.PORT,()=>{
//             console.log("app is listen on port :8000")
//         })

//     } catch (error) {
//         console.log("ERROR", error);
//         throw error
//     }
// })()