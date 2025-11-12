import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Application } from './schemas/application.schema';

@ApiTags('Applications')
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle candidature' })
  create(@Body() dto: CreateApplicationDto): Promise<Application> {
    return this.applicationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Afficher toutes les candidatures' })
  findAll(): Promise<Application[]> {
    return this.applicationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Afficher une candidature spécifique' })
  findOne(@Param('id') id: string): Promise<Application> {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une candidature (status, score, etc.)' })
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto): Promise<Application> {
    return this.applicationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une candidature' })
  remove(@Param('id') id: string): Promise<Application> {
    return this.applicationService.remove(id);
  }
}
