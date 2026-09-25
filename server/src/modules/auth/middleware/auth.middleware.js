import jwt from 'jsonwebtoken';
import { findUserById } from '../../identity/index.js';
import { config } from '../../../config/env.js';

export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, config.JWT_SECRET);

            req.user = await findUserById(decoded.id);

            if (!req.user) {
                res.status(401);
                return next(new Error('Not authorized, user not found'));
            }

            return next();
        } catch (error) {
            res.status(401);
            return next(new Error('Not authorized, token failed'));
        }
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};
