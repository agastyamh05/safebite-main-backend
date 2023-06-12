import {
	IsEmail,
	IsString,
	IsNotEmpty,
	MinLength,
	IsIP,
    IsNumber,
    IsOptional
} from "class-validator";

export class SignUpRequest {
    @IsString()
	@IsEmail()
	public email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string;

    @IsString()
    @IsNotEmpty()
    public name: string;
}

export class SendOtpRequest {
    @IsEmail()
    public email: string;

    public purpose: string;
}

export class VerifyOTPRequest {
    @IsNumber()
    @IsNotEmpty()
    public code: number;

    @IsString()
    @IsNotEmpty()
    public email: string;
}

export class LogInRequest {
	@IsEmail()
	public email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string;
}

export class PasswordResetRequest {
    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    @IsNotEmpty()
    public email: string;

    @IsString()
    @IsNotEmpty()
    public token: string;
}

export class DeviceMeta {
	@IsString()
	public deviceName: string;

	@IsString()
	public deviceId: string;

	@IsIP()
	@IsNotEmpty()
	public ip: string;
}

export class RefreshTokenRequest {
	@IsString()
	@IsNotEmpty()
	public refreshToken: string;
}

export class GetUserInfoRequest {
    public id: string;
}

export class UpdateUserPictureRequest {
    public id: string;
    public picture: Express.Multer.File;
}

export class UpdateProfileRequest {
    public id: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    public name: string;
    
    @IsOptional()
    @IsNumber({}, { each: true})
    public alergens: number[];
}

export class UpdateAuthRequest {
    public id: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    public email: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    public password: string;
}