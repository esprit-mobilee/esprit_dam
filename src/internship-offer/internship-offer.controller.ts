// src/internship-offer/internship-offer.controller.ts
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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

import { InternshipOfferService } from './internship-offer.service';
import { InternshipOffer } from './schemas/internship-offer.schema';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

@ApiBearerAuth('access-token')
@ApiTags('Internship Offers')
@Controller('internship-offers')
export class InternshipOfferController {
  constructor(private readonly internshipService: InternshipOfferService) {}

  // ============ LECTURE (étudiant + admin) ============

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Liste de toutes les offres' })
  async findAll(): Promise<InternshipOffer[]> {
    return this.internshipService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Récupérer une offre par id' })
  async findOne(@Param('id') id: string): Promise<InternshipOffer> {
    const offer = await this.internshipService.findOne(id.trim());
    if (!offer) throw new NotFoundException('Offre non trouvée');
    return offer;
  }

  // ============ CRÉATION (admin) ============

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Créer une nouvelle offre de stage (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'company', 'description', 'duration'],
      properties: {
        title: {
          type: 'string',
          example: 'Développeur Web',
        },
        company: {
          type: 'string',
          example: 'ESPRIT',
        },
        description: {
          type: 'string',
          example: 'Développement d’une application mobile Kotlin.',
        },
        location: {
          type: 'string',
          example: 'Ariana',
        },
        duration: {
          type: 'number',
          example: 12,
          description: 'Durée du stage en semaines',
        },
        salary: {
          type: 'number',
          example: 600,
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image du logo (optionnel)',
        },
      },
    },
  })
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
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<InternshipOffer> {
    const dto: any = req.body; // champs du form-data

    console.log('🧾 DTO REÇU =>', dto);
    console.log('📎 FICHIER =>', file?.originalname);

    // Nettoyage & conversion
    if (file) dto.logoUrl = `/uploads/logos/${file.filename}`;
    if (dto.duration) dto.duration = Number(dto.duration);
    if (dto.salary) dto.salary = Number(dto.salary);

    // Validation minimale
    if (!dto.title || !dto.company || !dto.description) {
      throw new NotFoundException(
        'Champs obligatoires manquants (title, company, description)',
      );
    }

    return this.internshipService.create(dto);
  }

  // ============ MISE A JOUR PAR ID (admin) ============

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Modifier une offre par id (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Développeur Web Senior',
        },
        company: {
          type: 'string',
          example: 'ESPRIT',
        },
        description: {
          type: 'string',
          example: 'Mise à jour de la description du stage.',
        },
        location: {
          type: 'string',
          example: 'Tunis',
        },
        duration: {
          type: 'number',
          example: 16,
        },
        salary: {
          type: 'number',
          example: 800,
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Nouveau fichier logo (optionnel)',
        },
      },
    },
  })
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
  async update(
    @Param('id') id: string,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<InternshipOffer> {
    const cleanId = id.trim();
    const dto: any = req.body;

    console.log('✏️ DTO UPDATE =>', dto);
    console.log('📎 FILE =>', file?.originalname);

    if (file) dto.logoUrl = `/uploads/logos/${file.filename}`;
    if (dto.duration) dto.duration = Number(dto.duration);
    if (dto.salary) dto.salary = Number(dto.salary);

    const updated = await this.internshipService.update(cleanId, dto);
    if (!updated) {
      console.warn(`⚠️ Stage non trouvé pour l'id ${cleanId}`);
      throw new NotFoundException('Offre non trouvée');
    }
    return updated;
  }

  // ============ MISE A JOUR PAR TITRE (admin) ============

  @Put('by-title/:title')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Modifier une offre par son titre (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          example: 'Développeur Web',
        },
        company: {
          type: 'string',
          example: 'ESPRIT',
        },
        description: {
          type: 'string',
          example: 'Mise à jour de la description via titre.',
        },
        location: {
          type: 'string',
          example: 'Ariana',
        },
        duration: {
          type: 'number',
          example: 10,
        },
        salary: {
          type: 'number',
          example: 550,
        },
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Nouveau fichier logo (optionnel)',
        },
      },
    },
  })
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
  async updateByTitle(
    @Param('title') title: string,
    @Req() req,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<InternshipOffer> {
    const cleanTitle = title.trim();
    const dto: any = req.body;

    console.log('✏️ UPDATE BY TITLE =>', dto);
    console.log('📎 FILE =>', file?.originalname);

    if (file) dto.logoUrl = `/uploads/logos/${file.filename}`;
    if (dto.duration) dto.duration = Number(dto.duration);
    if (dto.salary) dto.salary = Number(dto.salary);

    const updated = await this.internshipService.updateByTitle(
      cleanTitle,
      dto,
    );
    if (!updated) {
      console.warn(`⚠️ Stage non trouvé pour le titre "${cleanTitle}"`);
      throw new NotFoundException('Offre non trouvée');
    }
    return updated;
  }

  // ============ SUPPRESSION (admin) ============

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Supprimer une offre (admin)' })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    const deleted = await this.internshipService.delete(id.trim());
    if (!deleted) throw new NotFoundException('Offre non trouvée');
    return { message: 'Offre supprimée avec succès' };
  }
}
