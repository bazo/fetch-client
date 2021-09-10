import { EventEmitter, EventCallback } from "@bazo/event-emitter";
import { HttpError } from "./httpError";
import { AbortToken } from "./abortToken";

interface Config {
	params?: Record<string, string | number> | null;
	body?: BodyInit | null;
	withEvents?: boolean;
	abortToken?: AbortToken;
}

export enum HttpMethod {
	GET = "GET",
	POST = "POST",
	PUT = "PUT",
	DELETE = "DELETE",
	PATCH = "PATCH",
	HEAD = "HEAD",
	TRACE = "TRACE",
	OPTIONS = "OPTIONS",
	CONNECT = "CONNECT",
}

export enum HttpClientEvent {
	REQUEST_CREATE = "REQUEST_CREATE",
	RESPONSE_FETCHED = "RESPONSE_FETCHED",
	RESPONSE_CREATE = "RESPONSE_CREATE",
	RESPONSE_ERROR = "RESPONSE_ERROR",
}

interface StrictRequestBody extends Object {
	[key: string]: any;
}

export type RequestBody = StrictRequestBody | undefined;

const defaultConfig: Config = {
	withEvents: true,
};

export class HttpClient {
	private baseUrl: string;
	private em: EventEmitter;
	private defaultHeaders: Record<string, string | number>;

	constructor(baseUrl: string = "", defaultHeaders: Record<string, string | number> = {}) {
		this.baseUrl = baseUrl;
		this.defaultHeaders = defaultHeaders;
		this.em = new EventEmitter();
	}

	public setDefaultHeader(header: string, value: string | number): void {
		this.defaultHeaders[header] = value;
	}

	private createURL(url: string, config?: Config): string {
		let baseUrl = this.baseUrl;
		try {
			new URL(url);
			baseUrl = "";
		} catch (err) {
			//it's a relative url
		}

		let query = "";

		if (config?.params) {
			let params = new URLSearchParams({});

			Object.entries(config.params).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					params.set(key, value.toString());
				}
			});

			query = config ? "?" + new URLSearchParams(params).toString() : "";
		}

		return `${baseUrl}${url}${query}`;
	}

	private async createRequest(method: string, url: string, config: Config, init?: RequestInit): Promise<Request> {
		const defaultInit = {
			mode: "cors" as RequestMode,
			redirect: "follow" as RequestRedirect,
			method,
			body: config?.body,
			headers: {},
		};

		if (!init) {
			init = defaultInit;
		} else {
			init = { ...defaultInit, ...init };
		}

		init.headers = { ...this.defaultHeaders, ...init.headers } as RequestInit["headers"];

		if (config.abortToken) {
			init.signal = config.abortToken.getSignal();
		}

		let request = new Request(this.createURL(url, config), init);

		if (init.body) {
			request.headers.set("Content-Type", "application/json;charset=utf-8");
		}

		if (config.withEvents) {
			await this.em.dispatch(HttpClientEvent.REQUEST_CREATE, request);
		}

		return request;
	}

	private async checkResponse(res: Response, config: Config) {
		if (!res.ok) {
			let shouldThrow = true;

			if (config.withEvents) {
				const throwContext = {
					throw: true,
				};
				await this.em.dispatch(HttpClientEvent.RESPONSE_ERROR, [res, throwContext]);
				shouldThrow = throwContext.throw;
			}
			if (shouldThrow) {
				throw new HttpError(res);
			}
		}
	}

	private async createResponse<T>(request: Request, config: Config): Promise<T> {
		const response = await fetch(request);

		if (config.withEvents) {
			await this.em.dispatch(HttpClientEvent.RESPONSE_FETCHED, request);
		}
		await this.checkResponse(response, config);

		if (config.withEvents) {
			await this.em.dispatch(HttpClientEvent.RESPONSE_CREATE, request);
		}

		return response.json();
	}

	public async get<T>(
		url: string,
		params?: Record<string, string | number | boolean> | null,
		config: Config | {} = {},
		init?: RequestInit
	): Promise<T> {
		config = {
			...defaultConfig,
			params,
			...config,
		} as Config;
		const request = await this.createRequest(HttpMethod.GET, url, config, init);

		return this.createResponse<T>(request, config);
	}

	public async post<T>(
		url: string,
		body: RequestBody = undefined,
		config: Config = {},
		init?: RequestInit
	): Promise<T> {
		config = {
			...defaultConfig,
			...config,
		} as Config;

		if (!config.hasOwnProperty("body") && body) {
			config.body = JSON.stringify(body);
		}

		const request = await this.createRequest(HttpMethod.POST, url, config, init);
		return this.createResponse<T>(request, config);
	}

	public async put<T>(
		url: string,
		body: RequestBody = undefined,
		config: Config = {},
		init?: RequestInit
	): Promise<T> {
		config = {
			...defaultConfig,
			...config,
		} as Config;

		if (!config.hasOwnProperty("body") && body) {
			config.body = JSON.stringify(body);
		}

		const request = await this.createRequest(HttpMethod.PUT, url, config, init);
		return this.createResponse<T>(request, config);
	}

	public async patch<T>(
		url: string,
		body: RequestBody = undefined,
		config: Config = {},
		init?: RequestInit
	): Promise<T> {
		config = {
			...defaultConfig,
			...config,
		} as Config;

		if (!config.hasOwnProperty("body") && body) {
			config.body = JSON.stringify(body);
		}

		const request = await this.createRequest(HttpMethod.PATCH, url, config, init);
		return this.createResponse<T>(request, config);
	}

	public async delete<T>(
		url: string,
		params?: Record<string, string | number> | null,
		init?: RequestInit
	): Promise<T> {
		const config = {
			...defaultConfig,
			params,
		} as Config;

		const request = await this.createRequest(HttpMethod.DELETE, url, config, init);
		return this.createResponse<T>(request, config);
	}

	public on(event: HttpClientEvent, callback: EventCallback) {
		this.em.on(event, callback);
	}
}
