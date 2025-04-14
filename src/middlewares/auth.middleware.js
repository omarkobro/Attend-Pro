import jwt from "jsonwebtoken";
import User from "../../DB/models/user.model.js";

export const auth = async (req, res, next) => {
    try {
        const { accesstoken } = req.headers;

        // 1. Check if token exists
        if (!accesstoken) {
            return res.status(401).json({ message: "Authentication required. Please log in." });
        }

        // 2. Validate token format (with prefix)
        if (!accesstoken.startsWith(process.env.TOKEN_PREFIX)) {
            return res.status(400).json({ message: "Invalid token format." });
        }

        // 3. Extract actual token
        const token = accesstoken.replace(process.env.TOKEN_PREFIX, "").trim();

        // 4. Verify JWT
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.LOGIN_SECRET);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Session expired. Please log in again." });
            }
            return res.status(400).json({ message: "Invalid or tampered token." });
        }

        // 5. Validate token payload
        if (!decodedToken || !decodedToken.user_id) {
            return res.status(400).json({ message: "Invalid authentication token." });
        }

        // 6. Check if user exists
        const user = await User.findById(decodedToken.user_id);
        if (!user) {
            return res.status(404).json({ message: "User not found. Please register first." });
        }

        // 7. Attach user data to request
        req.authUser = user;

        next(); // Proceed to the next middleware/controller
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(500).json({ message: "Internal server error during authentication." });
    }
};
