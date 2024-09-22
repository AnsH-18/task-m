import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    tittle: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ['To Do', 'In-Progress', 'Completed'],
        default: 'To Do'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Low'
    },
    dueDate: {
        type: Date,
        required: true,
        min: '2024-09-01',
        max: '2025-12-31'
    },
}, {timestamps: true})

export const Task = mongoose.model("Task", taskSchema)