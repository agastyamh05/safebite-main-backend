export class ErrorValue {
    public field: string;
    public message: string[];
}

export class HttpException extends Error {
	public status: number;
	public statusCode: string;
    public message: string;
	public errors?: ErrorValue[];

	constructor(status: number, statusCode: string , message: string, errors?: ErrorValue[]) {
		super(message);
		this.status = status;
		this.statusCode = statusCode;
		this.errors = errors;
	}
}
