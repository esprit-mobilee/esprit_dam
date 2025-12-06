import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

import { AuthenticationGuard } from 'src/auth/guards/authentication.guard';
import { ChangePasswordDto } from 'src/auth/dtos/change-password.dto';

@Controller('utilisateurs')
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) { }

  @Post()
  create(@Body() createUtilisateurDto: CreateUtilisateurDto) {
    return this.utilisateursService.create(createUtilisateurDto);
  }

  @Get()
  findAll() {
    return this.utilisateursService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.utilisateursService.findOne(id);
  }

  // 👇 garde-le pour l’admin / back-office
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUtilisateurDto: UpdateUtilisateurDto) {
    return this.utilisateursService.update(id, updateUtilisateurDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.utilisateursService.remove(id);
  }

  // ✅ File upload endpoint
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return { message: 'Fichier uploadé', filename: file.originalname };
  }

  // ✅ NEW: user changes *his own* password
  @Patch('me/password')
  @UseGuards(AuthenticationGuard)
  async changeMyPassword(
    @Req() req,
    @Body() dto: ChangePasswordDto,
  ) {
    // selon ton JWT: tu mets userId dans le payload → req.user.userId
    const userId = req.user.userId;
    return this.utilisateursService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }
}
