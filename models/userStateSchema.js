import mongoose from "mongoose";

const userStateSchema = new mongoose.Schema({
  userId: { type: Number, required: true, unique: true }, // ID пользователя в Telegram
  state: { type: String, required: true }, // Состояние пользователя (например, 'applying')
});

const UserState = mongoose.model('UserState', userStateSchema);

export default UserState
