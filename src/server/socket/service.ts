export interface Echo {
    echo: any;
    num: number;
}
export function echo(data: Echo): Promise<Echo> {
    console.log('Echo request received:', data);
    return Promise.resolve(data);
}