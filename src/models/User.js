import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    profileImageUrl: { type: String, trim: true },
    isEmailVerified: { type: Boolean, default: false },
    roles: {
      type: [String],
      default: ['customer'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.every(v => typeof v === 'string' && v.trim().length > 0),
        message: 'roles must be an array of non-empty strings'
      }
    },
    addresses: {
      type: [
      {
        label: { type: String, trim: true }, // e.g., Home, Work
        line1: { type: String, trim: true },
        line2: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
      }
      ],
      default: [],
    },
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


