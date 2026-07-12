import { IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  shopName!: string;

  @IsNotEmpty()
  contactNumber!: string;

  @IsNotEmpty()
  password!: string;
}
