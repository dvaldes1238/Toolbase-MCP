import { IntersectionType, PartialType, PickType } from "@nestjs/mapped-types";
import { DataDto } from "../dto/data.dto";

export class SlimDataDto extends IntersectionType(PartialType(PickType(DataDto, ['id', 'datasetId', 'generatedByToolBranchId', 'runId', 'output', 'tags', 'wasRunResponder'])), PickType(DataDto, ['input'])) { }
