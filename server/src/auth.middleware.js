import { extractAccessToken } from "./utils/extractToken.js"
import jwt from "jsonwebtoken"
import { User } from "./models/user.model.js"

export const VerifyJWT = async (req, res, next) => {
    const cookies = req.headers.cookie
    const accessToken = extractAccessToken(cookies)
    console.log(accessToken)
    if(!accessToken){
        return res.status(500).json({"message": "Please provide access token"})
    }

    const decodeToken = await jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)

    if(!decodeToken){
        throw new ApiError(401, "Something went wrong while verifying access token")
    }

    const user = await User.findById(decodeToken._id)
    req.user = user
    next()
}