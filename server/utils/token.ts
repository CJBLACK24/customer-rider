// server /utils/token.ts
import crypto from 'crypto';
import { UserProps } from '../types';
import jwt from 'jsonwebtoken';

/**
 * Main JWT generator (unchanged)
 */
export const generateToken = (user: UserProps) => {
  const payload = {
    user: {
      id: user._id.toString(),
      name:   user.name,
      email:  user.email,
      phone:  user.phone,
      avatar: user.avatar,
    },
  };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: '30d',
  });
};

/**
 * New: cryptographically‑secure reset token generator
 */
export const generateResetToken = (): string => {
  // 20 bytes → 40‑char hex string
  return crypto.randomBytes(20).toString('hex');
};
