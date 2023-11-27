import mongoose from "mongoose";

const userProfileSchema = mongoose.Schema({
    userId: { type: Number, required: true },
    
    referralCode: { type: String, required: true, unique: true },
    profits: {
        type: Object,
        required: false,
        default: {
            amount: 0,
            amountUSD: 0,
        },
    },
    wallet: {
        type: Object,
        required: false,
        default: {
            type: "",
            address: "",
        },
    },
    showProfile:{
        type:Boolean,
        required:false,
        default:true
    },
    workerPercent:{
        type:Number,
        required:false,
        default:70
    },
    workerUserName:{
        type:String,
        required:true,
        
    }
},{
    timestamps: true,
});
const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;
