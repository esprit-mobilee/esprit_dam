import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DocumentRequestService } from './document-request.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

const VERIFICATION_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vérification de Document - ESPRIT</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'); body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-100">
        <div class="bg-green-600 p-6 text-center text-white">
            <div class="mb-4"><i class="fas fa-check-circle text-5xl"></i></div>
            <h1 class="text-2xl font-bold">Document Authentique</h1>
            <p class="text-green-100 text-sm mt-1">Vérifié par ESPRIT Mobile</p>
        </div>
        <div class="p-6 space-y-4">
            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                <span class="text-gray-500 text-sm">Référence</span>
                <span class="font-mono font-semibold text-gray-800">{{reference}}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                <span class="text-gray-500 text-sm">Étudiant</span>
                <span class="font-semibold text-gray-800">{{studentName}}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                <span class="text-gray-500 text-sm">Type</span>
                <span class="font-semibold text-gray-800">{{documentType}}</span>
            </div>
            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                <span class="text-gray-500 text-sm">Approuvé le</span>
                <span class="font-semibold text-gray-800">{{approvalDate}}</span>
            </div>
            <div class="pt-2">
                <span class="text-gray-500 text-xs uppercase tracking-wider block mb-1">Signé par</span>
                <div class="flex items-center space-x-3">
                    <div class="bg-red-100 text-red-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">AD</div>
                    <div>
                        <p class="text-sm font-bold text-gray-800">{{signerName}}</p>
                        <p class="text-xs text-gray-500">{{signerTitle}}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p class="text-xs text-gray-400">Ce document a été signé électroniquement.<br>Toute modification annule sa validité.</p>
        </div>
    </div>
</body>
</html>`;

const NOT_FOUND_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Non Trouvé - ESPRIT</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'); body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden border border-gray-100 text-center p-8">
        <div class="text-red-500 mb-4 text-5xl">
            <i class="fas fa-times-circle"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Document Non Trouvé</h1>
        <p class="text-gray-500">Le document demandé est introuvable ou invalide.</p>
    </div>
</body>
</html>`;

@ApiTags('Verification')
@Controller('verify')
export class VerificationController {
    constructor(private readonly documentRequestService: DocumentRequestService) { }

    @Get('doc/:reference')
    @ApiOperation({ summary: 'Vérifier l\'authenticité d\'un document (Public)' })
    @ApiResponse({ status: 200, description: 'Page HTML de vérification' })
    @ApiResponse({ status: 404, description: 'Page HTML d\'erreur' })
    async verify(@Param('reference') reference: string, @Res() res: Response) {
        const documentRequest = await this.documentRequestService.findByReference(reference);

        if (!documentRequest) {
            return res.status(404).send(NOT_FOUND_TEMPLATE);
        }

        const user = documentRequest.userId as any;
        const approvalDate = documentRequest.approvedAt
            ? new Date(documentRequest.approvedAt).toLocaleString('fr-FR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : 'Date inconnue';

        let html = VERIFICATION_TEMPLATE
            .replace('{{reference}}', documentRequest.documentReference || reference)
            .replace('{{studentName}}', user ? `${user.firstName} ${user.lastName}` : 'Étudiant Inconnu')
            .replace('{{documentType}}', documentRequest.type.toUpperCase())
            .replace('{{approvalDate}}', approvalDate)
            .replace('{{signerName}}', documentRequest.approvedBy || 'Administration ESPRIT')
            .replace('{{signerTitle}}', 'Chef Département de la scolarité');

        return res.status(200).send(html);
    }
}
