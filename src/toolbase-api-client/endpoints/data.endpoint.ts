import { DataDto, UpdateDataDto } from "../dto/data.dto";
import { MoveRunDto } from "../dto/move-run.dto";
import { ToolbaseApi } from "../toolbase";

const listDataForDataset = async (datasetId: number, options: { limit?: number; offset?: number; } = {}) => {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    return await ToolbaseApi.config.fetch(`data/${datasetId}?limit=${limit}&offset=${offset}`, {
        method: 'GET'
    }) as Promise<DataDto[]>;
};

const getData = async (dataId: number) => {
    return await ToolbaseApi.config.fetch(`data/single/${dataId}`, {
        method: 'GET'
    }) as Promise<DataDto>;
};

const updateData = async (dataId: number, updateDto: UpdateDataDto) => {
    return await ToolbaseApi.config.fetch(`data/${dataId}`, {
        method: 'PUT',
        body: JSON.stringify(updateDto)
    }) as Promise<DataDto>;
};

const deleteData = async (dataId: number) => {
    return await ToolbaseApi.config.fetch(`data/${dataId}`, {
        method: 'DELETE'
    }) as Promise<DataDto>;
};

const moveRun = async (moveRunDto: MoveRunDto) => {
    return await ToolbaseApi.config.fetch(`data`, {
        method: 'PUT',
        body: JSON.stringify(moveRunDto)
    }) as Promise<Pick<DataDto, 'id'>[]>;
};

export const data = {
    listDataForDataset,
    getData,
    updateData,
    deleteData,
    moveRun
}