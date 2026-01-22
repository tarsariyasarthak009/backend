import {asyncHandler}from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiRespons} from '../utils/ApiRespons.js'
import jwt from 'jsonwebtoken'
import { use } from 'react'

const generateAccessAndRefreshTokens = async (userId)=>{
    try {
       const user =  await User.findById(userId)
       const accessToken = user.generateAccessToken()
       const refreshToken = user.generateRefreshToken()
       console.log(user)
       user.refreshToken = refreshToken
       await user.save({validateBeforeSave: false })
       console.log(refreshToken)
       return{refreshToken,accessToken}

    } catch (error) {
        throw new ApiError(500,"Somithing went  wrong while genrating referesh and access token")
    }
}

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

const loginUser = asyncHandler(async (req,res)=>{   
    // req.body=>data
    // username and email
    // find the user
    // password check
    // access the refresh token
    // send the cookies

    const {email,username,password} = req.body

    if (!username && !email) {
        throw new ApiError(400,"username and pssword is required")
    }

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if (!user) {
        throw new ApiError(400,"user does not exist")
    }
   const isPasswordValid =  await user.isPasswordCorrect(password)

   if(!isPasswordValid){
    throw new ApiError(404,"Invalid user candidate")
   }
   
   const{accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   const options = {
    httpOnly : true,
    secure : true
   }

   return res.status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(new ApiRespons(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully ") )

})

const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiRespons(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken)
   {
    throw new ApiError(401,"unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
   )

  const user = await User.findById(decodedToken?._id)

  if(!user)
   {
    throw new ApiError(401,"Invalid refresh token")
   }

   if(incomingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"refresh token is expired or use")
   }

   const options = {
    httpOnly : true,
    secure : true
   }

 const{accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newRefreshToken,options)
  .json(new ApiRespons(200,{accessToken,refreshToken:newRefreshToken},"Access token refresh successfully"))

   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh Token")
   }
})

const changeCurrentUserPassword = asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword,confPassword} = req.body

    if(!(newPassword === confPassword))
    {
        throw new ApiError(400,"newpasswod and confpassword not a same")
    }

    const user= await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"invaloid password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiRespons(200,{},"Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(200,req.user,"current user successfully")
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body
     
    if(!fullname || !email)
    {
        throw new ApiError(400,"fullname and email is required")
    }

    const user =await User.findByIdAndUpdate(req.user?._id,{
        $set : {
            fullname,
            email
        }
    },{new : true}).select("-password")

    return res.status(200).json(new ApiRespons(200,user,"Acoount details update successfull"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
   const avatarLocalPath =  req.file?.path
   if (!avatarLocalPath) {
     throw new ApiError(400,"Avatar file is missing")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }

   const user =  await User.findByIdAndUpdate(
    req.user?._id,{$set : {avatar:avatar.url}},{new:true}
   ).select("-password")

   return res.status(200).json(new ApiRespons(200,user,"Avatar update successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLocalPath =  req.file?.path
   if (!coverImageLocalPath) {
     throw new ApiError(400,"coverimage file is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on avatar")
   }

   const user = await User.findByIdAndUpdate(
    req.user?._id,{$set : {coverImage:coverImage.url}},{new:true}
   ).select("-password")

   return res.status(200).json(new ApiRespons(200,user,"coverImage update successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}