 // import { emailTemplate } from "../../utilities/emailTemplate.js"
import {generateToken, verifyToken} from "../../utilities/tokenFunctions.js"
import { nanoid } from "nanoid"
import pkg from 'bcrypt'

import catchError from "../../middleware/ErrorHandeling.js"
import CustomError from "../../utilities/customError.js"
import jwt from "jsonwebtoken"
import crypto from 'crypto';
import { userModel } from "../../../DB/models/user.js"
import { log } from "console"



export const signup = catchError(async(c) => {
   
    const {
        userName,
        email,
        password,
        phoneNumber,
        role
    } = await c.req.json();
    
    if(!email || !password) {
        throw new CustomError('Email & Password is required', 400);
    }
    
    // Check if email exists
    const isExisted = await userModel.findOne({email});
    if(isExisted){
        throw new CustomError('Email already exists', 400);
    }

    // Hash password
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 8;
    const hashedPassword = pkg.hashSync(password, saltRounds);
    
    const user = new userModel({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        role
    });
    
    const saveUser = await user.save();
    return c.json({message:'User created successfully', saveUser}, 201);
});



export const login = catchError(async(c) => {
    const {email, password} = await c.req.parseBody();
          
    if(!email || !password){
        throw new CustomError('Email And Password Is Required', 422);
    }
    
    const userExist = await userModel.findOne({email});
    if(!userExist){
        throw new CustomError('user not found', 401);
    }
    
    if(userExist.isActive == false){
        throw new CustomError('user is not active', 401);
    }
       
    const passwordExist = pkg.compareSync(password, userExist.password);
    if(!passwordExist){
        throw new CustomError('password incorrect', 401);
    }
    
    const token = generateToken({
        payload:{
            email,
            _id: userExist._id,
            role: userExist.role
        },
        signature: process.env.SIGN_IN_TOKEN_SECRET || "Login",
        expiresIn: '1w',
    });
          
    const userUpdated = await userModel.findOneAndUpdate(               
        {email},
        {
            token,
            isActive: true,
        },
        {new: true},
    );
     
    return c.json({message: 'Login Success', userUpdated}, 200);
});



export const logout = catchError(async (c) => {
    try {
      const { token } = c.req.json();
      if (!token) {
        throw new CustomError('Token is required', 404)
      }
  
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SIGN_IN_TOKEN_SECRET || "Login");
      } catch (error) {
        if (error.name === "TokenExpiredError") {
          // إذا انتهت صلاحية التوكن، نقوم فقط بفك تشفيره بدون التحقق منه
          decoded = jwt.decode(token);
        } else {
            console.log(error);
            
          return res.status(401).json({ message: "Invalid token" });
        }
      }
  
      if (!decoded || !decoded.email) {
        return res.status(401).json({ message: "Invalid token" });
      }
  
      const email = decoded.email;
  
      // console.log("Decoded email:", email);
  
      // البحث عن المستخدم
      const user = await userModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // تحديث حالة المستخدم إلى "offline" حتى لو كان التوكن منتهي الصلاحية
      await userModel.findOneAndUpdate(
        { email },
        { token: null, isActive:false },
        { new: true }
      );
  
      res.status(200).json({ message: "Logout successful" });
    } catch (error) {
      console.error("Logout Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


export const getAllUser = catchError(async(c) => {
    // ! update before each update
    const users = await userModel.find().select('-password');
    return c.json({message:"Users", users}, 200);
});

export const getSingleUser = catchError(async(c) => {
    // ! update before each update
    const {id} = c.req.param('id');
    const user = await userModel.findById(id).select('-password');
    
    if(!user) {
        throw new CustomError("User not found", 404);
    }
    
    return c.json({message:"User", user}, 200);
});

export const addUser = catchError(async (c) => {
    // ! update before each update
    const { userName, email, password, phoneNumber, role, isActive } = c.get('requestBody') || {};
    
    // Validate required fields
    if (!userName || !email || !password || !phoneNumber || !role) {
        throw new CustomError("All fields are required", 400);
    }
    
    // Check if email already exists
    const isExist = await userModel.findOne({ email });
    if (isExist) {
        throw new CustomError("Email is already existed", 400);
    }
    
    // Hash the password
    const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS);
    
    // Generate custom ID for image folder
    const customId = nanoid();
    
    // Prepare user object
    const user = new userModel({
        userName,
        email,
        password: hashedPassword,
        phoneNumber,
        role,
        isActive,
        customId,
    });
    
    // Handle file upload if image exists
    const file = await c.req.parseBody();
    if (file && file.image) {
        const uploadResult = await imagekit.upload({
            file: file.image,
            fileName: file.image.name,
            folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${customId}`,
        });
        user.image = {
            secure_url: uploadResult.url,
            public_id: uploadResult.fileId,
        };
    }
    
    await user.save();
    return c.json({ message: "User created successfully", user }, 201);
});

export const UpdateUser = catchError(async(c) => {
    // ! update before each update
    const {userName, phoneNumber, email, password, role, isActive} = c.get('requestBody') || {};
    const {id} = c.req.param('id');
    const authUser = c.get('authUser'); // From auth middleware
    
    console.log(authUser);
    
    const user = await userModel.findById(id);
    console.log(user);
    
    if(!user) {
        throw new CustomError("User not found", 404);
    }
    
    // Check if file is uploaded
    const file = await c.req.parseBody();
    if (file && file.image) {
        // Upload image to ImageKit
        const uploadResult = await imagekit.upload({
            file: file.image,
            fileName: file.image.name,
            folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${user.customId}`,
        });
        user.image.secure_url = uploadResult.url;
        user.image.public_id = uploadResult.fileId;
    }
    
    if(userName) user.userName = userName;
    if(phoneNumber) user.phoneNumber = phoneNumber;
    if(email) user.email = email;
    if(role) user.role = role;
    if(isActive !== undefined) user.isActive = isActive;
    if(password) {
        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS);
        user.password = hashedPassword;
    }
    
    // save the user
    await user.save();
    return c.json({message: "user updated successfully", user}, 200);
});

export const updateProfile = catchError(async (c) => {
    // ! update before each update
    const {userName, phoneNumber, email, password} = c.get('requestBody') || {};
    const {id} = c.req.param('id');
    
    const user = await userModel.findById(id);
    console.log(user);
    
    if(!user) {
        throw new CustomError("User not found", 404);
    }
    
    // Check if file is uploaded
    const file = await c.req.parseBody();
    if (file && file.image) {
        // Upload image to ImageKit
        const uploadResult = await imagekit.upload({
            file: file.image,
            fileName: file.image.name,
            folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${user.customId}`,
        });
        user.image.secure_url = uploadResult.url;
        user.image.public_id = uploadResult.fileId;
    }
    
    if(userName) user.userName = userName;
    if(phoneNumber) user.phoneNumber = phoneNumber;
    if(email) user.email = email;
    if(password) {
        const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS);
        user.password = hashedPassword;
    }
    
    // save the user
    await user.save();
    return c.json({message: "user updated successfully", user}, 200);
});

export const deleteUser = catchError(async(c) => {
    // ! update before each update
    const {id} = c.req.param('id');
    
    const user = await userModel.findById(id);
    
    if(!user) {
        throw new CustomError("User not found", 404);
    }
    
    if (user.image && user.image.public_id) {
        const uploadedimage = user.image.public_id;
        await destroyImage(uploadedimage);
    }
    
    await userModel.findByIdAndDelete(id);
    return c.json({message: "User deleted successfully", user}, 200);
});
