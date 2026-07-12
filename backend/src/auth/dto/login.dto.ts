import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  contactNumber!: string;

  @IsNotEmpty()
  password!: string;
}
