import { Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Body, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentosService } from './documentos.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DocumentType } from '@leximetrics/db';
import 'multer';

@ApiTags('Documentos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documentos')
export class DocumentosController {
    constructor(private readonly documentosService: DocumentosService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                type: {
                    type: 'string',
                    enum: Object.values(DocumentType),
                },
                causaId: {
                    type: 'string',
                    format: 'uuid',
                }
            },
        },
    })
    @ApiOperation({ summary: 'Upload a document' })
    upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
                    // new FileTypeValidator({ fileType: '.(pdf|docx|doc|txt|jpeg|jpg|png)' }), // Regex validation can be tricky with FileTypeValidator in some Nest versions, using string or regex
                ],
            }),
        )
        file: Express.Multer.File,

        @Body() createDocumentoDto: CreateDocumentoDto,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        return this.documentosService.upload(file, createDocumentoDto, tenantId);
    }

    @Get()
    @ApiOperation({ summary: 'List documents (by causa or knowledge base)' })
    findAll(
        @Query('causaId') causaId: string,
        @Query('knowledgeBase') knowledgeBase: string,
        @CurrentUser('tenantId') tenantId: string,
    ) {
        if (causaId) {
            return this.documentosService.findAllByCausa(causaId, tenantId);
        } else if (knowledgeBase === 'true') {
            return this.documentosService.findAllKnowledgeBase(tenantId);
        } else {
            throw new BadRequestException('Must provide either causaId or knowledgeBase=true');
        }
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get document details' })
    findOne(@Param('id') id: string, @CurrentUser('tenantId') tenantId: string) {
        return this.documentosService.findOne(id, tenantId);
    }
}
