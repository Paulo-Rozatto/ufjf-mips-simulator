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

        rs = this._numberToName(rs);
        rt = this._numberToName(rt);
        rd = this._numberToName(rd);

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
                return `sw ${rt} ${rs} 0x${imediate.toString(16)}`
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

    _numberToName(register) {
        switch (register) {
            case 0:
                return '$zero';
            case 1:
                return '$at';
            case 2:
                return '$v0';
            case 3:
                return '$v1';
            case 4:
                return '$a0';
            case 5:
                return '$a1';
            case 6:
                return '$a2';
            case 7:
                return '$a3';
            case 8:
                return '$t0';
            case 9:
                return '$t1';
            case 10:
                return '$t2';
            case 11:
                return '$t3';
            case 12:
                return '$t4';
            case 13:
                return '$t5';
            case 14:
                return '$t6';
            case 15:
                return '$t7';
            case 16:
                return '$r0';
            case 17:
                return '$r1';
            case 18:
                return '$r2';
            case 19:
                return '$r3';
            case 20:
                return '$r4';
            case 21:
                return '$r5';
            case 22:
                return '$r6';
            case 23:
                return '$r7';
            case 24:
                return '$t8';
            case 25:
                return '$t9';
            case 26:
                return '$k0';
            case 27:
                return '$k1';
            case 28:
                return '$gp';
            case 20:
                return '$sp';
            case 30:
                return '$fp';
            case 31:
                return '$ra';
        }
    }
}