import { CreateDirectoryDto, UpdateDirectoryDto } from "../dto/directory.dto";
import { FileDto } from "../dto/file.dto";
import { ProjectDto } from "../dto/project.dto";
import { ToolbaseApi } from "../toolbase";

const listProjects = async () => {
    return await ToolbaseApi.config.fetch(`directory`, {
        method: 'GET',
    }) as Promise<ProjectDto[]>;
};

const listFilesAndDirectories = async (projectId: number) => {
    return await ToolbaseApi.config.fetch(`directory/${projectId}`, {
        method: 'GET',
    }) as Promise<FileDto[]>;
};

const newDirectory = async (directory: CreateDirectoryDto) => {
    return await ToolbaseApi.config.fetch(`directory`, {
        method: 'POST',
        body: JSON.stringify(directory)
    }).then(r => Number(r));
};

const updateDirectory = async (directoryId: number, directory: UpdateDirectoryDto) => {
    return await ToolbaseApi.config.fetch(`directory/${directoryId}`, {
        method: 'PUT',
        body: JSON.stringify(directory)
    }).then(r => Number(r));
};

const deleteDirectory = async (directoryId: number) => {
    return await ToolbaseApi.config.fetch(`directory/${directoryId}`, {
        method: 'DELETE'
    }).then(r => Number(r));
};


export const directories = {
    listProjects,
    listFilesAndDirectories,
    newDirectory,
    updateDirectory,
    deleteDirectory,
}