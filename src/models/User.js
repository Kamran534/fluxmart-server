import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    // When incremented, previously issued refresh tokens become invalid
    tokenVersion: { type: Number, default: 0 },
    sessions: [
      {
        jti: { type: String, required: true },
        tokenHash: { type: String, required: true },
        userAgent: { type: String },
        ip: { type: String },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true },
      }
    ],
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;


