import { IsDateString, IsEmail, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ScheduleInterviewDto {
    @IsDateString()
    scheduledAt: string;

    @IsEmail()
    studentEmail: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsInt()
    @Min(15)
    @Max(180)
    duration: number; // en minutes (15-180)
}
