import ConnectDB from './db/index.js';
import dotenv from 'dotenv'


dotenv.config({
    path : './env'
})

ConnectDB()


















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