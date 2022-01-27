class ALU {
    constructor() { }

    execute(opcode, in1, in2) {
        switch (opcode) {
            case 0b10: {
                return in1 + in2;
            }
            default:
                console.log('ALU operantion not implemented', opcode.toString(2).padStart(4, '0'))
        }
    }
}