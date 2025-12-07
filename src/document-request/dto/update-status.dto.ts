import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RequestStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export class UpdateStatusDto {
    @ApiProperty({ enum: RequestStatus, description: 'Nouveau statut de la demande' })
    @IsEnum(RequestStatus)
    status: RequestStatus;

    @ApiProperty({ required: false, description: 'Raison du rejet (obligatoire si REJECTED)' })
    @ValidateIf((o) => o.status === RequestStatus.REJECTED)
    @IsString()
    rejectionReason?: string;
}
