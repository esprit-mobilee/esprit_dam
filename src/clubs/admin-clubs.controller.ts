import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClubsService } from './clubs.service';
import { CreateFullClubDto } from './dto/create-full-club.dto';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { multerOptions } from 'src/common/multer.config';

@ApiTags('Admin - Clubs')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(AuthenticationGuard, RolesGuard)
export class AdminClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post('create-full-club')
  @Roles(Role.Admin)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerOptions('clubs')))
  @ApiOperation({ summary: 'Creer un club et son compte associe (admin)' })
  @ApiBody({
    description:
      'Cree le club puis le compte club. Le backend genere un identifiant unique contenant \"clb\".',
    schema: {
      type: 'object',
      required: ['name', 'password'],
      properties: {
        name: { type: 'string', example: 'Club Robotique' },
        description: {
          type: 'string',
          example: 'Club des passionnes de robotique et dIA.',
        },
        tags: { type: 'string', example: 'robotique, innovation' },
        email: { type: 'string', example: 'robotique@esprit.tn' },
        password: { type: 'string', example: 'ProvidedByAdmin123' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Club et compte club crees avec succes',
    schema: {
      example: {
        clubId: '6730559a21332abc2312dd01',
        userId: '6730559a21332abc2312dd02',
        identifiant: 'robo-clb4912',
        password: 'ProvidedByAdmin123',
        role: 'club',
      },
    },
  })
  async createFullClub(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateFullClubDto,
  ) {
    return this.clubsService.createFullClub(dto, file);
  }
}
