import { PartialType } from '@nestjs/swagger';
import { CreateGestionDto } from './create-gestion.dto';

export class UpdateGestionDto extends PartialType(CreateGestionDto) { }
