import mongoose from "mongoose"

const dbConnection = async () => {
    try {
        const dbConnectionInstance = await mongoose.connect(process.env.DATABASE_URL)
        console.log("MongoDB Connection at ", dbConnectionInstance.connection.host)
        
    } catch (error) {
        console.log("MONGODB Connection Failed", error)
    }
}

export default dbConnection