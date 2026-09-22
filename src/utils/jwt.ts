import jwt from "jsonwebtoken";


function getSecret(): string {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
    }
    return process.env.JWT_SECRET;
}

export function issueToken(userId: number, roleCode: string) {
    return jwt.sign({ userId, role_code: roleCode }, getSecret(), { expiresIn: "1h" });
}

export function verifyToken(token: string) {
    return jwt.verify(token, getSecret());
}
