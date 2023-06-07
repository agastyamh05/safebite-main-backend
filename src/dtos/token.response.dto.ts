export class RefreshTokenPayload {
	uid: string;
	sid: string;
	category: string;
	exp: number;
}

export class AccessTokenPayload {
	uid: string;
	sid: string;
	category: string;
	role: string;
	isFresh: boolean;
	exp: number;
}
