import { IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  contactNumber!: string;

  @IsNotEmpty()
  password!: string;
}
