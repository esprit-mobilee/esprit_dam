import { PartialType } from '@nestjs/mapped-types';
import { CreateUtilisateurDto } from './create-utilisateur.dto';
import { IsOptional, IsString, IsEmail, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUtilisateurDto extends PartialType(CreateUtilisateurDto) {
  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  avatar?: string;
}
