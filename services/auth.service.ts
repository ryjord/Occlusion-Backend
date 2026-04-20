// Libs
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

// Utils
import { prisma } from '@/lib/prisma';

// Interfaces
import { Technician } from '@prisma/client';

export class AuthService {
  static async authenticateUser(employeeId: string, passwordPlain: string, hardwareId: string): Promise<Technician | null> {
    try {
      const user = await prisma.technician.findUnique({
        where: { employeeId }
      });

      if (!user) {
        return null;
      }

      // Hardware ID Security Check (DB-FR14)
      if (user.registeredHardwareId !== hardwareId) {
        throw new Error('Hardware ID mismatch. Unauthorized device.');
      }

      // Argon2 Password Verification
      const isPasswordValid = await argon2.verify(user.passwordHash, passwordPlain);

      if (!!isPasswordValid) {
        return user;
      }

      return null;
    } catch(error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  static generateToken(user: Technician): string {
    const payload = {
      sub: user.id,
      role: user.role,
      employeeId: user.employeeId
    };

    // Ensure JWT_SECRET exists
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    return jwt.sign(payload, secret, { expiresIn: '12h' });
  }
}