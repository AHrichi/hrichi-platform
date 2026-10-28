import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import type { WhatsAppChannelType } from '@ah/products/dispatch/domain';

export class SendWhatsAppMessageDto {
  @IsString()
  @IsIn(['customers', 'drivers', 'production'])
  channel!: WhatsAppChannelType;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  senderRole?: string;

  @IsOptional()
  @IsBoolean()
  isCoordinator?: boolean;
}
