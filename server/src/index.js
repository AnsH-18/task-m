import express from "express"
import dbConnection from "./db.js"
import dotenv from "dotenv"
import { User } from "./models/user.model.js"
import ApiResponse from "./utils/Apiresponse.js"
import { VerifyJWT } from "./auth.middleware.js"
import { Task } from "./models/task.model.js"
import mongoose from "mongoose"
import cors from "cors"

const app = express()



dotenv.config({
    path: "./.env"
})

app.use(cors())

// app.use(cors({
//     origin: "https://task-m-frontend-bay.vercel.app", // The exact frontend URL
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
//     allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
//   }));
  
  // Handle preflight requests
//   app.options('*', cors());
  

const options = {
    httpOnly: true,
}

dbConnection()
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log("App running on: ", process.env.PORT)
        })
    })
    .catch((err) => {
        console.log(err)
    })


const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
    
        const accessToken = await  user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        // console.log("Access Token", accessToken)
        // console.log("\nRefresh Token", refreshToken)


        if(!accessToken){
            throw new ApiError(402, "Error while generating Acess and Refresh Tokens")
        }
    
        user.refreshToken = refreshToken
        await user.save()
    
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, error?.message)
    }
}

app.post("/signin", async (req, res) => {
    const {userName, password} = req.query
    const checkUser = await User.findOne({
        userName
    })

    if(checkUser){
        return res.status(500).json({"message": "UserName Already Taken"})
    }

    const user = await User.create({
        userName,
        password
    })

    if(!user){
        return res.status(500).json({"message": "Registration Failed"})
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Registration Successfull")
    )
})

app.post("/login", async (req, res) => {
    const {userName, password} = req.query

    const checkUser = await User.findOne({
        userName
    })

    if(!checkUser){
        return res.status(500).json({"message": "User Doesn't Exists"})
    }

    const isPasswordCorrect = await checkUser.isPasswordCorrect(password)

    if(!isPasswordCorrect){
        return res.status(500).json({"messsage": "Password is incorrect"})
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(checkUser._id)
    
    if(!accessToken){
        return res.status(500).json({"message" : "Login Failed"})
    }

    const loggedUser = await User.findById(checkUser._id).select("-password -refreshToken")

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, loggedUser, "Login Successfull")
    )
   
})

app.post("/logout",VerifyJWT, async(req, res) => {
  const user = req.user
    
    await User.findByIdAndUpdate(user._id, {
        $set: {
            refreshToken : undefined
        }
    })

    res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Successfully Logged Out")
    )
})

app.post("/create-task",VerifyJWT, async(req, res) => {
    const {tittle, description, dueDate, priority} = req.query
    const user = req.user
    console.log(req.query   )
    if(!tittle ){
        return res.status(500).json({"message" : "Please provide field values"})
    }
    const task = await Task.create({
        tittle,
        description : description ? description: "",
        author: user?._id,
        dueDate,
        priority
    })

    if(!task){
        return res.status(500).json({"message" : "task cannot be created"})
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task created successfully")
    )
})


app.post("/update-task", VerifyJWT, async (req, res) => {
    const user = req.user
    const {taskid, progress, priority, tittle, description, status} = req.query
    console.log(taskid) 
    if(!taskid){
        return res.status(500).json({"message" : "Please provide field values"})
    }
    const task = await Task.findByIdAndUpdate(taskid, {
        $set: {
            progress,
            priority,
            description,
            tittle,
            status
        }
    })
    if(!task){
        return res.status(500).json({"message": "Task not updated"})
    }

    return res.status(200).json(
        new ApiResponse(200, task, "Task Updated Successfully")
    )

})

app.get("/get-user-tasks", VerifyJWT, async(req, res) => {
    const user = req.user

    const tasks = await Task.aggregate([
        {$match: {author: new mongoose.Types.ObjectId(user._id)}},
        {$lookup: {
            from: "users",
            localField: "author",
            foreignField: "_id",
            as: "created_by",
            pipeline: [{
                $project: {
                    userName: 1
                }
            }]
        }}
    ])

    if(!tasks){
        return res.status(200).json({"message": "cannot fetch tasks"})
    }

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks Fetched Successfully")
    )
})

app.delete("/delete-task", VerifyJWT, async (req, res) => {
    
    const user = req.user
    const {taskid} = req.query

    if(!taskid){
        return res.status(500).json({"message" :" Provide all the fields"})
    }

    const deleteTask = await Task.findByIdAndDelete(taskid)

    if(!deleteTask){
        res.status(500).json({"message" :" Cannot Delete the task"})
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Task Deleted Successfully")
    )
})