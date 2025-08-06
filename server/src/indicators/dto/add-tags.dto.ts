import { IsArray, IsUUID, IsOptional } from 'class-validator';

export class AddTagsDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}