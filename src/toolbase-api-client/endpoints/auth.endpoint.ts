import { CreateUserDto, UserDto } from "../dto/user.dto";
import { ToolbaseApi, handleResponse } from "../toolbase";


export let refreshTokenPromise: Promise<UserDto | null> | undefined;

export const auth = {
    isLoggedIn: () => {
        return !!ToolbaseApi.config.store.getItem('accessToken') && !!ToolbaseApi.config.store.getItem('user');
    },
    getUser: () => {
        const userString = ToolbaseApi.config.store.getItem('user');
        return userString ? JSON.parse(userString) as UserDto : undefined;
    },
    getAccessToken: () => {
        return ToolbaseApi.config.store.getItem('accessToken') ?? undefined;
    },
    login: async (email: string, password: string) => {
        return fetch(`${ToolbaseApi.config.baseUrl}/auth/login`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            }).then(handleResponse).then(response => {
                let { accessToken, refreshToken, ...user } = response;

                ToolbaseApi.config.store.setItem('user', JSON.stringify(user));
                ToolbaseApi.config.store.setItem('accessToken', accessToken);
                ToolbaseApi.config.store.setItem('refreshToken', refreshToken);

                return user;
            }) as Promise<UserDto>;
    },
    register: async (user: CreateUserDto) => {
        return fetch(`${ToolbaseApi.config.baseUrl}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(user)
        }).then(handleResponse).then(response => {
            ToolbaseApi.config.store.setItem('user', JSON.stringify(response));
            return response;
        }) as Promise<UserDto>;
    },
    refresh: async () => {
        if (refreshTokenPromise) {
            return refreshTokenPromise;
        }

        const refreshToken = ToolbaseApi.config.store.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No token found. Log in first.');
        }

        return refreshTokenPromise = refreshToken ? fetch(`${ToolbaseApi.config.baseUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken })
        }).then(handleResponse).then(response => {
            let { accessToken, refreshToken, ...user } = response;
            ToolbaseApi.config.store.setItem('user', JSON.stringify(user));
            ToolbaseApi.config.store.setItem('accessToken', accessToken);
            ToolbaseApi.config.store.setItem('refreshToken', refreshToken);

            return user;
        }).catch(error => {
            console.error('Error refreshing token:', error);
            alert('You\'ve been logged out due to inactivity. Please login again.');
            auth.logout();
            window.location.reload();
        }).finally(() => {
            refreshTokenPromise = undefined;
        }) as Promise<UserDto> : Promise.resolve(null as UserDto | null);
    },
    logout: () => {
        ToolbaseApi.config.store.removeItem('user');
        ToolbaseApi.config.store.removeItem('accessToken');
        ToolbaseApi.config.store.removeItem('refreshToken');
        //what else needed to log out? would likely need to remove tokens from backend
    },
    generateApiToken: async (email: string, password: string) => {
        return await ToolbaseApi.config.fetch(`auth/generate-api-token`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }).then(response => {
            let { apiToken } = response;
            return apiToken;
        }) as Promise<string>;
    },
    generateMcpToken: async (projectId: number) => {
        return await ToolbaseApi.config.fetch(`auth/generate-mcp-token/${projectId}`, {
            method: 'POST'
        }).then(response => {
            let { mcpToken } = response;
            return mcpToken;
        }) as Promise<string>;
    }
}