export function dispose<T extends IDisposable>(...disposables: T[]): T;
export function dispose<T extends IDisposable>(disposables: T[]): T[];
export function dispose<T extends IDisposable>(...disposables: T[]): T[] {
	const first = disposables[0];

	if (Array.isArray(first)) {
		disposables = first as any as T[];
	}

	disposables.forEach(d => d && d.dispose());
	return [];
}

export abstract class Disposable implements IDisposable {

	private _toDispose: IDisposable[];

	constructor() {
		this._toDispose = [];
	}

	public dispose(): void {
		this._toDispose = dispose(this._toDispose);
	}

	protected _register<T extends IDisposable>(t:T): T {
		this._toDispose.push(t);
		return t;
	}
}
