import { HeadersObject } from "msw/lib/types/context/set";
import "whatwg-fetch";
import { HttpClient, HttpClientEvent, HttpMethod } from "../httpClient";
import { HttpError } from "../httpError";

const defaultHeaders = {
	"X-TEST-HEADER": "TEST",
};

function createClient(): HttpClient {
	const http = new HttpClient("/test", defaultHeaders);

	return http;
}

type TestRequest = Partial<Request> & {
	headers: {
		[key: string]: string;
	};
};

type TestResponse = Partial<Response> & {
	headers: {
		[key: string]: string;
	};
};

type ErrorTestResponse = Partial<Response> & {
	headers?: {
		map: {
			[key: string]: string;
		};
	};
};

describe("HttpClient", () => {
	test("makes a GET request", async () => {
		const http = createClient();
		const res = await http.get<TestRequest>(
			"/get",
			{
				a: "a",
				b: "b",
			},
			{},
			{
				headers: {
					test: "yes",
				},
			}
		);

		expect(res.headers["x-test-header"]).toEqual(defaultHeaders["X-TEST-HEADER"]);
		expect(res.headers["test"]).toEqual("yes");

		expect(res.url?.toString()).toEqual("http://localhost/test/get?a=a&b=b");
		expect(res.method).toEqual(HttpMethod.GET);
	});

	test("makes a POST request", async () => {
		const http = createClient();
		const body = {
			test: "yes",
		};
		const res = await http.post<TestRequest>("/post", body);

		expect(res.headers["x-test-header"]).toEqual(defaultHeaders["X-TEST-HEADER"]);
		expect(res.headers["content-type"]).toEqual("application/json;charset=utf-8");

		expect(res.url?.toString()).toEqual("http://localhost/test/post");
		expect(res.method).toEqual(HttpMethod.POST);

		expect(res.body).toEqual(body);
	});

	test("makes a PUT request", async () => {
		const http = createClient();
		const res = await http.put<TestRequest>("/put");

		expect(res.url?.toString()).toEqual("http://localhost/test/put");
		expect(res.method).toEqual(HttpMethod.PUT);
	});

	test("makes a PATCH request", async () => {
		const http = createClient();
		const res = await http.patch<TestRequest>("/patch");

		expect(res.url?.toString()).toEqual("http://localhost/test/patch");
		expect(res.method).toEqual(HttpMethod.PATCH);
	});

	test("makes a DELETE request", async () => {
		const http = createClient();
		const res = await http.delete<TestRequest>("/delete");

		expect(res.url?.toString()).toEqual("http://localhost/test/delete");
		expect(res.method).toEqual(HttpMethod.DELETE);
	});
});

describe("HttpClient with events", () => {
	const events = [HttpClientEvent.REQUEST_CREATE, HttpClientEvent.RESPONSE_FETCHED, HttpClientEvent.RESPONSE_CREATE];

	test.each(events)(`fires %s`, async (event) => {
		const mockEventHandler = jest.fn();
		const http = createClient();
		http.on(event, mockEventHandler);

		const res = await http.put<TestRequest>("/put");

		expect(mockEventHandler).toBeCalled();
	});

	test(`fires ${HttpClientEvent.RESPONSE_ERROR}`, async () => {
		const mockEventHandler = jest.fn();
		const http = createClient();
		http.on(HttpClientEvent.RESPONSE_ERROR, mockEventHandler);

		try {
			await http.get<TestRequest>("/error");
		} catch (e) {
			expect(e).toBeInstanceOf(HttpError);
		}

		const res: ErrorTestResponse = {
			//_bodyInit: '{"message":"Internal Server Error"}',
			//_bodyText: '{"message":"Internal Server Error"}',
			bodyUsed: false,
			//headers: { map: { "content-type": "application/json", "x-powered-by": "msw" } },
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
			type: "default",
			url: "",
		};

		const throwContext = {
			throw: true,
		};
		const expected: [ErrorTestResponse, typeof throwContext] = [res, throwContext];

		expect(mockEventHandler).toHaveBeenCalled()
	});

	test(`fires ${HttpClientEvent.RESPONSE_ERROR} but doesn't throw`, async () => {
		const eventHandler = ([res, throwContext]: [res: any, throwContext: { throw: boolean }]) => {
			throwContext.throw = false;
		};
		const http = createClient();
		http.on(HttpClientEvent.RESPONSE_ERROR, eventHandler);

		await http.get<TestRequest>("/error");
	});
});
