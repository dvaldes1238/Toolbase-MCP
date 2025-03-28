import { CreateFileResponseDto } from "../dto/create-file-response.dto";
import { CreateFileDto, UpdateFileDto } from "../dto/file.dto";
import { SearchResultResponseDto } from "../dto/search-result-response.dto";
import { CreateToolBranchDto, ToolBranchDto, UpdateToolBranchDto } from "../dto/tool.dto";
import { ToolbaseApi } from "../toolbase";


const listAllToolBranches = async (options?: { limit?: number, offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = params.toString() ? `tools?${params.toString()}` : 'tools';
    return await ToolbaseApi.config.fetch(url, {
        method: 'GET'
    }) as Promise<ToolBranchDto[]>;
};

const listToolBranchesForFile = async (fileId: number, options?: { limit?: number, offset?: number }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const url = params.toString() ? `tools/${fileId}?${params.toString()}` : `tools/${fileId}`;
    return await ToolbaseApi.config.fetch(url, {
        method: 'GET'
    }) as Promise<ToolBranchDto[]>;
};

const getToolBranch = async (branchId: number) => {
    return await ToolbaseApi.config.fetch(`tools/branches/${branchId}`, {
        method: 'GET'
    }) as Promise<ToolBranchDto>;
};

const newFile = async (file: CreateFileDto) => {
    return await ToolbaseApi.config.fetch(`tools`, {
        method: 'POST',
        body: JSON.stringify(file)
    }) as Promise<CreateFileResponseDto>;
};

const updateFile = async (fileId: number, file: UpdateFileDto) => {
    return await ToolbaseApi.config.fetch(`tools/${fileId}`, {
        method: 'PUT',
        body: JSON.stringify(file)
    }).then(r => Number(r));
};

const deleteFile = async (fileId: number) => {
    return await ToolbaseApi.config.fetch(`tools/${fileId}`, {
        method: 'DELETE'
    }).then(r => Number(r));
};

const newToolBranch = async (fileId: number, tool: CreateToolBranchDto) => {
    return await ToolbaseApi.config.fetch(`tools/${fileId}`, {
        method: 'POST',
        body: JSON.stringify(tool)
    }).then(r => Number(r));
};

const updateToolBranch = async (branchId: number, tool: UpdateToolBranchDto) => {
    return await ToolbaseApi.config.fetch(`tools/branches/${branchId}`, {
        method: 'PUT',
        body: JSON.stringify(tool)
    }).then(r => Number(r));
};


const deleteToolBranch = async (branchId: number) => {
    return await ToolbaseApi.config.fetch(`tools/branches/${branchId}`, {
        method: 'DELETE'
    }).then(r => Number(r));
};

const searchToolBranches = async (query: string) => {
    return await ToolbaseApi.config.fetch(`tools/branches/search/similarity?query=${encodeURIComponent(query)}`, {
        method: 'GET',
    }) as Promise<SearchResultResponseDto[]>;
};


export const tools = {
    newFile,
    updateFile,
    deleteFile,
    listAllToolBranches,
    listToolBranchesForFile,
    getToolBranch,
    newToolBranch,
    updateToolBranch,
    deleteToolBranch,
    searchToolBranches,
}