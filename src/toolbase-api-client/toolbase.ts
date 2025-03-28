import { auth, refreshTokenPromise } from "./endpoints/auth.endpoint";
import { chat } from "./endpoints/chat.endpoint";
import { data } from "./endpoints/data.endpoint";
import { directories } from "./endpoints/directory.endpoint";
import { mcp } from "./endpoints/mcp.endpoint";
import { tools } from "./endpoints/tool.endpoint";
import { util } from "./endpoints/util.endpoint";


export class ApiError extends Error {
    constructor(public messages: string[], public statusCode: number) {
        super(messages.join('\n'));
        this.name = 'ApiError';
    }
}

export const handleResponse = async (response: Response, raw?: boolean) => {
    const contentType = response.headers.get('Content-Type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
        let r: any;
        if (isJson) {
            r = await response.json();
            let messages = typeof r.message !== 'string' ? r.message : [r.message];
            throw new ApiError(messages, response.status);
        } else {
            r = await response.text();
            throw new Error(r);
        }
    }

    if (raw) {
        return response;
    } else if (isJson) {
        return await response.json();
    } else {
        return await response.text();
    }
}

const authenticatedApiFetch = (baseUrl?: string) => async (url: string, options: RequestInit & { raw?: boolean } = {}) => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${ToolbaseApi.config.apiToken}`);

    const response = await fetch(`${baseUrl}/${url}`, {
        ...options,
        headers,
    });

    return handleResponse(response, options.raw);
};

const authenticatedClientFetch = (baseUrl?: string) => async (url: string, options: RequestInit & { raw?: boolean } = {}) => {
    const accessToken = auth.getAccessToken();

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Authorization', `Bearer ${accessToken}`);

    if (refreshTokenPromise) await refreshTokenPromise;
    const response = accessToken ? await fetch(`${baseUrl}/${url}`, {
        ...options,
        headers,
    },) : undefined;

    if (!response || (response.status === 401)) {
        console.log('Refreshing token');
        const user = await auth.refresh();
        if (user) {
            headers.set('Authorization', `Bearer ${auth.getAccessToken()}`);
            return handleResponse(await fetch(`${baseUrl}/${url}`, {
                headers,
                ...options,
            }), options.raw);
        } else {
            throw new Error('Log in first.');
        }
    }

    return handleResponse(response, options.raw);
};

function configure(config: Partial<typeof ToolbaseApi.config>) {
    ToolbaseApi.config = { ...ToolbaseApi.config, fetch: config.apiToken ? authenticatedApiFetch(config.baseUrl ?? ToolbaseApi.config.baseUrl) : authenticatedClientFetch(config.baseUrl ?? ToolbaseApi.config.baseUrl), ...config };
}

export const ToolbaseApi = {
    configure,
    config: {
        apiToken: undefined as string | undefined,
        baseUrl: 'https://api.toolbase.com',
        fetch: authenticatedClientFetch('https://api.toolbase.com') as ((url: string, options: RequestInit & { raw?: boolean }) => Promise<any>),
        store: typeof localStorage !== 'undefined' ? localStorage : {
            _data: new Map<string, string>(),
            clear: function (): void {
                this._data.clear();
            },
            getItem: function (key: string): string | null {
                return this._data.get(key) ?? null;
            },
            key: function (index: number): string | null {
                if (index >= this.length) return null;
                const keys = Array.from(this._data.keys());
                return keys[index] as string | null;
            },
            removeItem: function (key: string): void {
                this._data.delete(key);
            },
            setItem: function (key: string, value: string): void {
                this._data.set(key, value);
            },
            get length(): number {
                return this._data.size;
            },
        } satisfies Storage,
    },
    chat,
    directories,
    tools,
    auth,
    util,
    data,
    mcp,
};