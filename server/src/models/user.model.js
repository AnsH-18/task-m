import mongoose from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        lowecase: true,
        trim: true,
        unique: true,
        index: true
    },
    password: {
        type: String,
        required: [true, "Password is Required"]
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true})

userSchema.pre("save", async function (next) {
    if(!this.isModified("password")){
        return next()
    }
    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken =async  function (){
    return await jwt.sign({
        _id : this._id,
        email : this.email,
        userName : this.userName,
        fullName : this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}


userSchema.methods.generateRefreshToken = async function (){
    return await jwt.sign({
        _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}

export const User = mongoose.model("User", userSchema)