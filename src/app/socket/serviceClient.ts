/**
 * This is the service provided to the server by the client
 */
export function incrementNumber(query: { num: number }): Promise<{ num: number }> {
    return Promise.resolve({ num: ++query.num });
}