export class ApiError extends Error {
    constructor(public status: number, public message: string, public data?: any) {
        super(message);
        this.name = "ApiError";
    }
}

const BASE_URL = "/api/proxy";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
        ...init,
        headers,
    });

    if (!response.ok) {
        let errorMessage = "An error occurred";
        let errorData;

        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                errorData = await response.json();
                errorMessage = errorData.message || response.statusText;
            } else {
                errorMessage = await response.text();
            }
        } catch (e) {
            // Ignore parsing errors
        }

        console.error(`API Error [${response.status}] ${path}:`, errorMessage);
        throw new ApiError(response.status, errorMessage, errorData);
    }

    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (error) {
        return {} as T;
    }
}

export const apiClient = {
    get: <T>(path: string, init?: RequestInit) =>
        request<T>(path, { ...init, method: "GET" }),

    post: <T>(path: string, body?: unknown, init?: RequestInit) =>
        request<T>(path, { ...init, method: "POST", body: JSON.stringify(body) }),

    put: <T>(path: string, body?: unknown, init?: RequestInit) =>
        request<T>(path, { ...init, method: "PUT", body: JSON.stringify(body) }),

    patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
        request<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) }),

    delete: <T>(path: string, init?: RequestInit) =>
        request<T>(path, { ...init, method: "DELETE" }),
};
