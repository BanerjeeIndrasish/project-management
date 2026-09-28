import { createUser, findUserByEmail } from "./user.service";
import { issueToken } from "../utils/jwt";
import { comparePassword } from "../utils/bcrypt";
import { getRolePermissions } from "./permission.service";

export async function registerUser(
    name: string,
    email: string,
    plainPassword: string,
    roleId: number
) {
    const result = await createUser(name, email, plainPassword, roleId);
    return result;
}

export async function loginUser(email: string, plainPassword: string) {
    const user = await findUserByEmail(email);
    if (!user) throw new Error("User not found");

    const { password, ...safeUser } = user;

    const isValid = await comparePassword(plainPassword, user.password);
    if (!isValid) throw new Error("Invalid credentials");

    const permissions = await getRolePermissions(user.role_code);
    console.log('Permissions.........', permissions)
    const token = issueToken(user.id, user.role_code);
    return { user: safeUser, token, permissions };
}

export async function guestLoginUser() {
    const permissions = await getRolePermissions("guest");

    const token = issueToken(0, "guest");

    return {
        user: {
            id: 0,
            name: "Guest",
            role_code: "guest",
        },
        token,
        permissions
    };
}
