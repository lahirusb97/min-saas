import { PartialType } from '@nestjs/mapped-types';
import { CreateVisionTestDto } from './create-vision-test.dto';

export class UpdateVisionTestDto extends PartialType(CreateVisionTestDto) {}
