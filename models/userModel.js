import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const questions=[
        {
                text:"Вопрос 1",
                answer:"",
                isAnswered:false
        },
        {
                text:"Вопрос 2",
                answer:"",
                isAnswered:false
        },
        {
                text:"Вопрос 3",
                answer:"",
                isAnswered:false
        }
]




const userSchema = mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
   
   
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    
   
    userId: { type: Number, required: true, unique: true }, // ID пользователя в Telegram
    entryAnswers:{
        type:Array,
        required:false,
        default:questions

    },
    forumLink: { type: String, required: false },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
    username:{
        type:String,
        required:true
    }
  },
  {
    timestamps: true,
  }
);

// Login
userSchema.methods.matchPassword = async function (enterPassword) {
  return await bcrypt.compare(enterPassword, this.password);
};

// // Register
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) {
//     next();
//   }
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
// });

const User = mongoose.model("User", userSchema);

export default User;
