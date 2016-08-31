describe("Level.1 Suite", () => {
    describe("Level.2 Suite", () => {
        it("Level.2.1 should pass", ()=> {

        });

        it("Level.2.2 should fail", () => {
            console.log('Over here bud');
            throw new Error("Fail")
        });

        it.skip("Level.2.3 skipped", ()=> {
            throw new Error("Fail")
        });
    })

    it("Level.1.1 should pass", () => {
        const something = 456;
        console.log('over here as well', {something});
    });

    it("Level.1.2 should fail", () => {
        throw new Error("Fail")
    });

    it.skip("Level.1.3 skipped", ()=> {
        throw new Error("Fail")
    });
})
