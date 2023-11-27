import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const accountSchema = mongoose.Schema(
  {
  accountName:{
    type:String,
    required:true,

  },
  handled:{
    type:mongoose.Schema.Types.ObjectId,
    required:false,
    ref:"User"
  },
  actions:{
    type:Array,
    required:false,
    default:[]
  }
  },
  {
    timestamps: true,
  }
);



const Account = mongoose.model("Account", accountSchema);

export default Account;
