// src/internship-offers/internship-offer.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  NotFoundException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { InternshipOfferService } from './internship-offer.service';
import { CreateInternshipOfferDto } from './dto/create-internship-offer.dto';
import { UpdateInternshipOfferDto } from './dto/update-internship-offer.dto';
import { InternshipOffer } from './schemas/internship-offer.schema';
import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@ApiBearerAuth('access-token')
@UseGuards(AuthenticationGuard, RolesGuard)
@ApiTags('Internship Offers')
@Controller('internship-offers')
export class InternshipOfferController {
  constructor(private readonly internshipService: InternshipOfferService) {}

  // --------- CREATE (ADMIN) + upload logo ----------
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Créer une nouvelle offre de stage (admin uniquement)' })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const unique = uuid();
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async create(
    @Body() dto: CreateInternshipOfferDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<InternshipOffer> {
    // si on a un fichier, on écrit le chemin public
    if (file) {
      dto.logoUrl = `/uploads/logos/${file.filename}`;
    }
    return this.internshipService.create(dto);
  }

  // --------- READ (tous les rôles) ----------
  @Get()
  @ApiOperation({ summary: 'Afficher toutes les offres de stage' })
  async findAll(): Promise<InternshipOffer[]> {
    return this.internshipService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Afficher une offre spécifique' })
  async findOne(@Param('id') id: string): Promise<InternshipOffer> {
    const offer = await this.internshipService.findOne(id);
    if (!offer) throw new NotFoundException('Offre non trouvée');
    return offer;
  }

  // --------- UPDATE (ADMIN) ----------
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Modifier une offre existante (admin uniquement)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInternshipOfferDto,
  ): Promise<InternshipOffer> {
    const updated = await this.internshipService.update(id, dto);
    if (!updated) throw new NotFoundException('Offre non trouvée');
    return updated;
  }

  // --------- DELETE (ADMIN) ----------
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Supprimer une offre de stage (admin uniquement)' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.internshipService.delete(id);
    if (!deleted) throw new NotFoundException('Offre non trouvée');
    return { message: 'Offre supprimée avec succès' };
  }
}
