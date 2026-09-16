import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  @MaxLength(120, { message: 'Title cannot exceed 120 characters' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Job type is required' })
  @MaxLength(60, { message: 'Job type cannot exceed 60 characters' })
  type: string;
}
