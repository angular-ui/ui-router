declare namespace jasmine {
    interface Matchers {
        toEqualData(expected: any, expectationFailOutput?: any): boolean;
        toEqualValues(expected: any, expectationFailOutput?: any): boolean;
        toBeResolved(): boolean;
    }
}
