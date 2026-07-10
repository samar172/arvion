import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  // NOTE: `role` is intentionally NOT accepted here. Public self-registration
  // must never be able to grant itself elevated privileges. Admin/staff accounts
  // are provisioned via the seed script or by an existing admin only.
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CustomerLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken: string; // Firebase ID Token
}

