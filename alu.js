class ALU {
    constructor() { }

    control(opAlu, funct) {
        // se opcode for 0 ou 1, nao precisa olhar campo funct
        switch (opAlu) {
            case 0:
                return 0b0010;
            case 1:
                return 0b0110;
        }

        // porem ser opcode for 2, precisa verficar o campo funct
        if (opAlu == 0b10) {
            switch (funct) {
                case 0b000000: { // sll
                    return 0b0101
                }
                case 0b100000: { // add
                    return 0b0010;
                }
                case 0b100010: { // sub
                    return 0b0110;
                }
                case 0b100100: { // and
                    return 0b0000;
                }
                case 0b100101: { // or
                    return 0b0001;
                }
                case 0b101010: { // stl
                    return 0b0111;
                }
            }
        }

        console.log('Invalid opcode ', opAlu);
        return 0b1111;
    }

    execute(alucode, in1, in2) {
        switch (alucode) {
            case 0b0000: {
                return in1 & in2;
            }
            case 0b0001: {
                return in1 | in2
            }
            case 0b0010: {
                return in1 + in2;
            }
            case 0b0101: {
                return in1 << in2;
            }
            case 0b0110: {
                return in1 - in2;
            }
            case 0b0111: {
                return in1 < in2 ? 1 : 0;
            }
            default:
                console.log('ALU operantion not implemented', alucode.toString(2).padStart(4, '0'))
        }
    }
}