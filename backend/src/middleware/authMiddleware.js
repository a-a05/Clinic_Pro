import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({
            message: "Access denied"
        });
    }

    try {
        const token = authHeader.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    }catch (error) {
        res.status(500).json({
            message: "Invalid token or the Token is expired"
        });
    }
};

export const authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try{
            const userId = req.user.userId;

            const roleQuery = await pool.query(
                `SELECT r.RoleName
                FROM Users u
                JOIN Roles r ON u.RoleID = r.RoleID
                WHERE u.UserID = $1`,
                [userId]
            );

            if (roleQuery.rows.length === 0) {
                return res.status(403).json({
                    error: 'User not fount!'
                });
            }

            const userRole = roleQuery.rows[0].rolename;

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    error: `Access denied! Your role ${userRole} is not authorized to perform this action`
                });
            }

            next();
        }catch (err){
            console.error(err.message);
            res.status(500).json({
                error: 'Server error during role verification'
            });
        }
    };
};