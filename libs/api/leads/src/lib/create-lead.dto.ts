import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  type LeadIntent,
  leadIntents,
  leadLimits,
  type LeadRequest,
} from '@ah/shared/contracts';

/** Validates `POST /leads`; unknown fields are rejected by the global pipe. */
export class CreateLeadDto implements LeadRequest {
  @IsString()
  @IsNotEmpty()
  @MaxLength(leadLimits.name)
  name!: string;

  @IsEmail()
  @MaxLength(leadLimits.email)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(leadLimits.message)
  message!: string;

  @IsIn(leadIntents)
  intent!: LeadIntent;

  @IsOptional()
  @IsIn(['recruiter', 'engineer', 'client'])
  audience?: LeadRequest['audience'];

  @IsUUID('4')
  idempotencyKey!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  turnstileToken!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
