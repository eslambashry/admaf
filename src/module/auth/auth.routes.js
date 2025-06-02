// import { Router } from "express";
import {  login, logout, signup, getSingleUser, UpdateUser, addUser, getAllUser, deleteUser, updateProfile } from "./auth.controller.js";
// import { multerCloudFunction } from "../../../services/multerCloud.js";
// import { allowedExtensions } from "../../utilities/allowedExtensions.js";
import { addUsersEndpoints } from "./authEndpoints.js";
import { isAuth } from "../../middleware/isAuth.js";
import { Hono } from "hono";

const userRouter = new Hono();

userRouter.post('/register', signup)
userRouter.post('/login', login)
userRouter.post('/logout', logout)
userRouter.get('/getUser/:id', getSingleUser)

userRouter.put('/updateProfile/:id',  updateProfile)

userRouter.get('/getAll', getAllUser)






// ! Authorized
userRouter.post('/addUser', isAuth(addUsersEndpoints.ADD_USER) , addUser)
userRouter.put('/update/:id', isAuth(addUsersEndpoints.UPDATE_USER), UpdateUser)
userRouter.delete('/:id',isAuth(addUsersEndpoints.DELETE_USER), deleteUser)
export default userRouter