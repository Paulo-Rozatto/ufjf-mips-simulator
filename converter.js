// Classe para transformar o comando em binario em texto para mostrar no na User interface

class BinaryConverter {
    constructor() { }

    convert(instruction) {
        if (typeof instruction === 'undefined' || instruction === 0) return `-`;

        let opcode, rs, rt, rd, shamt, imediate, funct, address;

        opcode = instruction >>> 26;
        rs = (instruction >>> 21) & 0b11111; // [25-21]
        rt = (instruction >>> 16) & 0b11111; // [20-16]
        rd = (instruction >>> 11) & 0b11111; // [15 - 11]
        shamt = (instruction >>> 6) & 0b11111; // [10-6]
        funct = instruction & 0b0111111; // [5 - 0]
        imediate = instruction & 0b1111111111111111; // [15 - 0]
        address = instruction & 0b00000011111111111111111111111111;

        switch (opcode) {
            case 0: { // Tipo R
                return this._getRType(rs, rt, rd, shamt, funct)
            }
            case 2: { // Jump

                return `j 0x${address.toString(16)}`
            }
            case 3: { // Jump and Link
                return `jal 0x${address.toString(16)}`;
            }
            case 4: { // Branch equal
                return `beq ${rs} ${rt} 0x${imediate.toString(16)}`
            }
            case 5: { // Branch not equal
                return `bne ${rs} ${rt} 0x${imediate.toString(16)}`
            }
            case 8: { // addi
                return `addi ${rt} ${rs} 0x${imediate.toString(16)}`
            }
            case 35: { // Load word
                return `lw ${rt} ${rs} 0x${imediate.toString(16)}`
            }
            case 43: { // Save word
                return `lw ${rt} ${rs} 0x${imediate.toString(16)}`
            }

            default: {
                return `-`;
            }
        }
    }

    _getRType(rs, rt, rd, shamt, funct) {
        switch (funct) {
            case 0b000000: { // sll
                return `sll ${rd} ${rt} 0x${shamt.toString(16)}`
            }
            case 0b100000: { // add
                return `add ${rd} ${rs} ${rt}`
            }
            case 0b100010: { // sub
                return `sub ${rd} ${rs} ${rt}`
            }
            case 0b100100: { // and
                return `and ${rd} ${rs} ${rt}`
            }
            case 0b100101: { // or
                return `or ${rd} ${rs} ${rt}`
            }
            case 0b101010: { // stl
                return `stl ${rd} ${rs} ${rt}`
            }
            case 0b001000: { // jr
                return `jr ${rs}`;
            }
        }
    }
}