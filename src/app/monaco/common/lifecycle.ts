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
