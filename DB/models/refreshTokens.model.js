import mongoose, { model, Schema } from "mongoose";

const refreshTokenSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

export default mongoose.models.RefreshToken || model('RefreshToken', refreshTokenSchema)
