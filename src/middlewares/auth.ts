import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";


export function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ status: false, error: "No token provided" });

    const token = authHeader.split(" ")[1];
    try {
        const decoded = verifyToken(token) as any;
        (req as any).user = decoded;
        next();
    } catch {
        res.status(401).json({ status: false, error: "Invalid token" });
    }
}

export function authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) return res.status(401).json({ status: false, error: "Unauthorized" });
        console.log("decoded user:", user, "| checking role_code:", user.role_code, "| against:", allowedRoles);
        if (!allowedRoles.includes(user.role_code)) {
            return res.status(403).json({ status: false, error: "Forbidden: insufficient role" });
        }

        next();
    };
}

export function restrictAgentChat(req: any, res: Response, next: NextFunction) {
    // Assuming authenticate middleware sets req.user.role_code
    if (req.user?.role_code === "GUEST") {
        return res.status(403).json({
            status: false,
            message: "Guest users are not allowed to access Agent Chat."
        });
    }
    next();
}

