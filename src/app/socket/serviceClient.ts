/**
 * This is the service provided to the server by the client
 */
export function incrementNumber(query: { num: number }): Promise<{ num: number }> {
    console.log('this code should only run on client');
    return Promise.resolve({ num: ++query.num });
}