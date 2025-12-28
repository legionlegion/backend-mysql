import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import * as models from '../models/models.js';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, companyId: user.companyId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// const generateRefreshToken = (user) => {
//   return jwt.sign(
//     { id: user.id, email: user.email, companyId: user.companyId },
//     process.env.JWT_SECRET,
//     { expiresIn: '7d' }
//   );
// }

export const register = async (req, res) => {
  try {
    const { name, email, password, companyName } = req.body;

    const existingUser = await models.findUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'User exists' });

    const password_hash = await bcrypt.hash(password, await bcrypt.genSalt(10));

    let company = await models.findCompanyByName(companyName);
    if (!company) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const companyId = await models.createCompany(companyName);
        await models.createBalance(companyId, 1000, 100000);
        await connection.commit();
        company = await models.findCompanyById(companyId);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    const userId = await models.createUser({
      name,
      email,
      password_hash,
      companyId: company.id
    });

    const user = await models.findUserById(userId);
    const accessToken = generateAccessToken(user);
    // const refreshToken = generateRefreshToken(user);

    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        companyName: company.name
      },
      accessToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await models.findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const company = await models.findCompanyById(user.companyId);
    const accessToken = generateAccessToken(user);
    // const refreshToken = generateRefreshToken(user);

    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        companyId: user.companyId,
        companyName: company?.name
      },
      accessToken
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const refresh = (req, res) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       return res.status(401).json({ message: 'Refresh token required' });
//     }

//     const user = jwt.verify(refreshToken, process.env.JWT_SECRET);
//     const newAccessToken = generateAccessToken({
//       id: user.id,
//       email: user.email,
//       companyId: user.companyId
//     });

//     res.json({ accessToken: newAccessToken });
//   } catch (error) {
//     res.status(403).json({ message: 'Invalid or expired refresh token' });
//   }
// };

export const logout = (req, res) => {
  // res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
};