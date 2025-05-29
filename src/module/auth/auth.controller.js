 // import { emailTemplate } from "../../utilities/emailTemplate.js"
import {generateToken, verifyToken} from "../../utilities/tokenFunctions.js"
import { nanoid } from "nanoid"
import pkg from 'bcrypt'

import catchError from "../../middleware/ErrorHandeling.js"
import CustomError from "../../utilities/customError.js"
import jwt from "jsonwebtoken"
import crypto from 'crypto';
import { userModel } from "../../../DB/models/user.js"



export const signup = catchError(async(c) => {
   
    const {
        userName,
        email,
        password,
        phoneNumber,
        role
    } = await c.req.json();
    
    if(!password) {
        throw new CustomError('Password is required', 400);
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
    const {email, password} = await c.req.json();
          
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


export const getAllUser = async(req,res,next) => {
    const users = await userModel.find().select('-password');

    res.status(201).json({message:"Users",users})
}

export const getSingleUser = async(req,res,next) => {
    const {id} = req.params
    const user = await userModel.findById(id).select('-password');
    res.status(201).json({message:"User",user})
}

export const addUser = catchError(async (req, res, next) => {
  const { userName, email, password, phoneNumber, role, isActive } = req.body;

  // Validate required fields
  if (!userName || !email || !password || !phoneNumber || !role) {
    return next(new CustomError("All fields are required", 400));
  }

  // Check if email already exists
  const isExist = await userModel.findOne({ email });
  if (isExist) {
    return next(new CustomError("Email is already existed", 400));
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
  if (req.file) {
    const uploadResult = await imagekit.upload({
      file: req.file.buffer,
      fileName: req.file.originalname,
      folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${customId}`,
    });

    user.image = {
      secure_url: uploadResult.url,
      public_id: uploadResult.fileId,
    };
  }

  await user.save();

  res.status(201).json({ message: "User created successfully", user });
});




export const UpdateUser = async(req,res,next) => {
    const {userName,phoneNumber,email,password,
        role,
        isActive,} = req.body
    // console.log(req.body);
    // console.log(req.file);
    console.log(req.authUser);
    
    const {id} = req.params
    const user = await userModel.findById(id)

    console.log(user);
    

    if(!user) {
        return next(new Error("user Didn't Found",{cause:400}))
      }
        // Check if file is uploaded
        if (req.file) {
            // Upload image to ImageKit
            const uploadResult = await imagekit.upload({
              file: req.file.buffer,
              fileName: req.file.originalname,
              folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${user.customId}`,
            });
            user.image.secure_url = uploadResult.url
            user.image.public_id = uploadResult.fileId
          }
          
          if(userName) user.userName = userName
          if(phoneNumber) user.phoneNumber = phoneNumber
          if(email) user.email = email
          if(role) user.role = role
          if(isActive) user.isActive = isActive

          if(password) {
            const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)
            user.password = hashedPassword
          }

          // save the user 
          await user.save()
          res.status(200).json({message : "user updated successfully",user})      
}

export const updateProfile = async (req,res,next) => {
   const {userName,phoneNumber,email,password} = req.body

    const {id} = req.params
    const user = await userModel.findById(id)    
  console.log(user);
  
    if(!user) {
        return next(new Error("user Didn't Found",{cause:400}))
      }
        // Check if file is uploaded
        if (req.file) {
            // Upload image to ImageKit
            const uploadResult = await imagekit.upload({
              file: req.file.buffer,
              fileName: req.file.originalname,
              folder: `${process.env.PROJECT_FOLDER || 'MMAF'}/User/${user.customId}`,
            });
            user.image.secure_url = uploadResult.url
            user.image.public_id = uploadResult.fileId
          }
          
          if(userName) user.userName = userName
          if(phoneNumber) user.phoneNumber = phoneNumber
          if(email) user.email = email

          if(password) {
            const hashedPassword = pkg.hashSync(password, +process.env.SALT_ROUNDS)
            user.password = hashedPassword
          }

          // save the user 
          await user.save()
          res.status(200).json({message : "user updated successfully",user})      
}

export const deleteUser = async(req,res,next) => {
    const {id} = req.params
    
    const user = await userModel.findById(id)
  if (user) {
    const uploadedimage = user.image.public_id
    if(uploadedimage){
        await destroyImage(uploadedimage)
    }
  }
  await userModel.findByIdAndDelete(id)
    res.status(201).json({message:"User",user})
}



export const forgetPassword = async (req, res, next) => {
    const { email } = req.body;
    const verificationCode = crypto.randomInt(100000, 999999);
    // console.log(verificationCode);
    
    // First check if email already exists
    const existingUser = await userModel.findOne({ email });
    if (!existingUser) {
        return next(new Error('Email not registered'));
    }
    // console.log(existingUser);
    
    existingUser.verificationCode = verificationCode;
    await existingUser.save();
    // Store verification code in database
    await tempVerificationModel.create({
        email,
        code: verificationCode,
        // expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
  
    await sendVerificationEmail(email, verificationCode);
    res.status(200).json({ message: 'Verification code sent successfully' });
  };


  export const resetPassword = async(req,res,next) => {
    const {verificationCode, newPassword, email} = req.body;
    
    const user = await userModel.findOne({email});
    if(!user) {
        return res.status(400).json({message: "User not found"});
    }
  
    if (!user.verificationCode || user.verificationCode !== parseInt(verificationCode)) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }
  
    // if (user.codeExpiresAt < Date.now()) {
    //     return res.status(400).json({ error: 'Verification code expired' });
    // }

    const hashedPassword = pkg.hashSync(newPassword, +process.env.SALT_ROUNDS)
    user.password = hashedPassword;
    user.verificationCode = null;
    user.codeExpiresAt = null;
  
    const updatedUser = await user.save();
    res.status(200).json({message: "Password reset successfully", updatedUser});
  };

export const verifyUserToken = async (req, res, next) => {
  try {
    const { authorization } = req.headers;
    if (!authorization) {
      return next(new CustomError('Please login first', 400));
    }

    const token = authorization.split(' ')[1];
    
      const decodedData = verifyToken({
        token,
        signature: process.env.SIGN_IN_TOKEN_SECRET || "Login",
      });

      const user = await userModel.findById(decodedData._id);
      
      if (!user) {
        return next(new CustomError('User not found', 404));
      }


      res.status(200).json({ user: userData });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new CustomError('Token expired', 401));
      }
      return next(new CustomError('Invalid token', 401));
    }
};

  