import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/env.js';

import mongoose from 'mongoose';

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, config.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export const register = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            res.status(503);
            throw new Error('Database not connected. Please start MongoDB.');
        }

        const { name, email, password, role } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            res.status(503);
            throw new Error('Database not connected. Please start MongoDB.');
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};
