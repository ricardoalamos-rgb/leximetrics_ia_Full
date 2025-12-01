"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
            Cerrar Sesión
        </button>
    );
}
