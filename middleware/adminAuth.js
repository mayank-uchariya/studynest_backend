// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Admin from '../schemas/adminSchema.js';

export const protectAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.admin = await Admin.findById(decoded.id);

      if (req.admin) {
        next();
      } else {
        return res.status(404).json({ message: 'Admin not found' });
      }
    } catch (error) {
      res.status(401).json({ message: 'Invalid token or expired' });
    }
  } else {
    res.status(401).json({ message: 'No token, authorization denied' });
  }
};
