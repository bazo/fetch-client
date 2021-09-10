import { rest } from "msw";
import { setupServer } from "msw/node";

const handlers = [
	rest.get("/test/get", async (req, res, ctx) => {
		const result = {...req, headers: req.headers.all()}
		return res(ctx.json(result));
	}),
	rest.get("/test/error", async (req, res, ctx) => {
		return res(ctx.status(500), ctx.json({ message: "Internal Server Error" }));
	}),
	rest.post("/test/post", async (req, res, ctx) => {
		const result = {...req, headers: req.headers.all()}
		return res(ctx.json(result));
	}),
	rest.put("/test/put", async (req, res, ctx) => {
		const result = {...req, headers: req.headers.all()}
		return res(ctx.json(result));
	}),
	rest.patch("/test/patch", async (req, res, ctx) => {
		const result = {...req, headers: req.headers.all()}
		return res(ctx.json(result));
	}),
	rest.delete("/test/delete", async (req, res, ctx) => {
		const result = {...req, headers: req.headers.all()}
		return res(ctx.json(result));
	}),
];

const server = setupServer(...handlers);
export { server, rest };
