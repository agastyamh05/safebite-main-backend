import {
	IsEmail,
	IsString,
	IsNotEmpty,
	MinLength,
	IsIP,
} from "class-validator";

export class SignUpRequest {
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

export class LogInRequest {
	@IsEmail()
	public email: string;

	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string;
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