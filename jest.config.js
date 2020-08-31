module.exports = {
	preset: "ts-jest/presets/js-with-ts",
	testEnvironment: "jsdom",
	silent: false,
	testMatch: ["**/__tests__/**/*.test.ts"],
	setupFilesAfterEnv: ["./src/http/__tests__/setupEnv.ts"],
	transformIgnorePatterns: [
		"/node_modules/(?!@bazo/event-emitter).+\\.js$",
	],
};
