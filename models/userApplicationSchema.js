import mongoose from "mongoose";

const userApplicationSchema = mongoose.Schema({
    userId: { type: Number, required: true },
    hasExperience: { type: String, default: false },
    timeAvailable: { type: String, required: false },
    expectations: { type: String, required: false },
    forumLink: { type: String, required: false },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    workerUserName:{
        type:String,
        required:true
    }
});

const UserApplication = mongoose.model(
    "UserApplication",
    userApplicationSchema
);

export default UserApplication;