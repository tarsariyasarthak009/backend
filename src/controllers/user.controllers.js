import {asyncHandler}from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiRespons} from '../utils/ApiRespons.js'

const registerUser = asyncHandler( async (req,res)=>{
   // get data form frontend
   // add the validation
   // user already exists : username and email
   // image and avtar check 
   // upload and check the image in cloudinay
   // create a user object for db
   // remove the password and refresh token from object 
   // check the use create 
   // return response  

  const {username,fullname,email,password} = req.body
    console.log("emial:",email)

    // if (fullname === "") 
    // {
    //     throw new ApiError(400,"fullName is required")   
    // }

    if ([fullname,username,email,password].some((fields)=>fields?.trim() === "" )) {
        throw new ApiError(400,"all fild are required")   
    }

   const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409,"username and email already exists")
    }
    console.log(req.files)
  
   const avatarLocalPath =  req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   console.log(avatarLocalPath)
   if (!avatarLocalPath) {
    throw new ApiError(400,"avatar image is required")
   }

    const avatar =  await uploadOnCloudinary(avatarLocalPath)
    const coverImage =await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {
         throw new ApiError(400,"avatar image 1111 is required")
    }

    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!createdUser)
   {
    throw new ApiError(500,"Somthing went wrong while registering user")
   }

   return res.status(201).json(
    new ApiRespons(200,createdUser,"register successfully")
   )
})

export {registerUser}