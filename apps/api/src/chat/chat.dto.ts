import {
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
  IsString,
  IsIn,
  IsNotEmpty,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;
}

export class ChatRequestDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  // Optional UI language hint ("fr" | "en"); the model is instructed to mirror
  // the user's language regardless, this is just a soft default.
  @IsOptional()
  @IsString()
  @IsIn(['fr', 'en'])
  lang?: 'fr' | 'en';
}
