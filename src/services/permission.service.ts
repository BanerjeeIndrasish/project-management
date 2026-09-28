import { db } from "../configs/db";

export async function getRolePermissions(roleCode: string) {
    const [rows]: any = await db.query(
        `
    SELECT p.name
    FROM roles r
    JOIN role_permissions rp
      ON rp.role_id = r.id
    JOIN permissions p
      ON p.id = rp.permission_id
    WHERE r.role_code = ?
    `,
        [roleCode]
    );

    const permissions: Record<string, string[]> = {};

    for (const row of rows) {
        // Example: "edit_users" → ["edit", "users"]
        const [action, module] = row.name.split("_");

        if (!permissions[module]) {
            permissions[module] = [];
        }

        permissions[module].push(action);
    }

    return permissions;
}
