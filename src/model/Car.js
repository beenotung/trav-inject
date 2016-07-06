class Car {
    name() {
        return this.myName
    }

    setName(s) {
        this.myName = s
    }

    constructor() {
        this.myName = 'default name'
    }

    static type() {
        return "CarType"
    }
}
