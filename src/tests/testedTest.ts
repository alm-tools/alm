describe("Level.1 Suite", () => {
    describe("Level.2 Suite", () => {
        it("Level.2.1 should pass", ()=> {

        });

        const alwaysThrow = () => { throw new Error("Hey baby") };

        const callAlwaysThrow = () => alwaysThrow();

        it("Level.2.2 should fail", () => {
            console.log('Your face');
            callAlwaysThrow();
        });

        it.skip("Level.2.3 skipped", ()=> {
            throw new Error("Fail")
        });
    })

    it("Level.1.1 should pass", () => {
        const something = 456;
        console.log('over here as well', { something }, "another","Yeah baby totally");
    });

    it("Level.1.2 should fail", () => {
        /**
         * Instead of return a reject promise of an `error`
         * Return a rejected promise of a `string`.
         * We don't have a stack trace in this case
         */
        return Promise.reject('Error without stack');
    });

    it.skip("Level.1.3 skipped", ()=> {
        throw new Error("Fail")
    });
})
