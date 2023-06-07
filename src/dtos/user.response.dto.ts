import { ingredients, profiles, users } from "@prisma/client";

export class SignUpResponse {
	public uuid: string;

	constructor(users: users) {
		this.uuid = users.id;
	}
}

export class TokenPayload {
	public uuid: string;
	public access: {
		token: string;
		expiredAt: number;
	};
	public refresh: {
		token: string;
		expiredAt: number;
	};

	constructor(
		uuid: string,
		access: {
			token: string;
			expiredAt: number;
		},
		refresh: {
			token: string;
			expiredAt: number;
		}
	) {
		this.uuid = uuid;
		this.access = access;
		this.refresh = refresh;
	}
}

export class VerifyResetPasswordOTPResponse {
    public token: string;

    constructor(token: string) {
        this.token = token;
    }
}

export class UserDetailResponse {
	public id: string;
	public email: string;
	public role: string;
	public alergens: {
		id: number;
		name: string;
		icon: string | null;
		isMainAlergen: boolean;
	}[];
	public name: string | null;
	public avatar: string | null;
	public createdAt: Date;
	public updatedAt: Date;

    constructor(user: users & {
        alergens: ingredients[],
        profile: profiles
    }) {
        this.id = user.id;
        this.email = user.email;
        this.role = user.role;
        this.alergens = user.alergens.map((alergen) => {
            return {
                id: alergen.id,
                name: alergen.name,
                icon: alergen.icon,
                isMainAlergen: alergen.isMainAlergen,
            };
        });
        this.name = user.profile.name;
        this.avatar = user.profile.avatar;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }
}
