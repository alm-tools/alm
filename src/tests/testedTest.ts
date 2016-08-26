describe("Level.1 Suite", () => {
    describe("Level.2 Suite", () => {
        it("Level.2.1 should pass", ()=> {

        });

        it("Level.2.2 should fail", ()=> {
            throw new Error("Fail")
        });
    })

    it("Level.1.1 should pass", ()=> {

    });

    it("Level.1.2 should fail", ()=> {
        throw new Error("Fail")
    });
})
