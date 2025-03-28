import { PartialType } from '@nestjs/mapped-types';
import { BaseToolConfigDto } from '../dto/base-tool-config.dto';
import { ToolType } from '../dto/tool-type.enum';


export class WorkflowConfigDto extends BaseToolConfigDto {

}

export class UpdateWorkflowConfigDto extends PartialType(WorkflowConfigDto) {//don't use IntersectionType with BaseToolConfigDto as it causes an error in the browser
    
    
    readonly type: ToolType;
}
