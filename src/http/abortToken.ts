export type ExecutorFunction = (abort: AbortController) => void;

export class AbortToken {
	executor: ExecutorFunction;

	constructor(executor: ExecutorFunction) {
		this.executor = executor;
	}

	public getSignal(): AbortSignal {
		const controller = new AbortController();
		const signal = controller.signal;

		this.executor(controller);

		return signal;
	}
}
