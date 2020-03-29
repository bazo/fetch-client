export class HttpError extends Error {
	date: Date;
	response: Response;
	code: number;
	statusText: string;
	body: Response["body"];
	url: string;

	constructor(response: Response) {
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		super(`${response.statusText}@${response.url}`);

		this.name = "HttpError";
		// Custom debugging information
		this.code = response.status;
		this.statusText = response.statusText;
		this.response = response;
		this.body = response.body;
		this.date = new Date();
		this.url = response.url;
	}

	async json<T>(): Promise<T> {
		return (await this.response.json()) as T;
	}
}
