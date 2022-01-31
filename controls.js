class Control {
    #signalList = ["memToReg", "regWrite", "memWrite", "memRead", "branch", "bne", "jump", "shft", "ALUSrc", "opALU1", "opALU0", "regDst"];

    constructor() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 10;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.shft = 0; // shift esta sem a letra i, pois ja existe a funcao shift no javascript
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.special = 0;
        this.memToReg = 0;
    }

    set(instruction) {
        // pega os 6 primeiros bits da instrucao
        let opcode = instruction >>> 26;
        let funct = instruction & 0b0111111;
        // console.log(opcode.toString(2))

        switch (opcode) {
            case 0: {
                console.log('R-type')
                this._setRTypeState()

                if (funct == 0b0) {
                    this.shft = 1;
                }
                break;
            }
            case 2: {
                console.log('j');
                this._setJumpState()
                break;
            }
            case 3: {
                console.log('jal');
                break;
            }
            case 4: {
                console.log('beq')
                this._setBEQState();
                break;
            }
            case 5: {
                console.log('ben');
                this._setBEQState();
                this.bne = 1;
                break;
            }
            case 8: {
                console.log('addi');
                this._setADDIState();
                break;
            }
            case 35: {
                console.log('Load word')
                this._setLWState();
                break;
            }
            case 43: {
                console.log('Save word');
                this._setSWState();
                break;
            }

            default: {
                this.regDst = 0;
                this.opALU = 0;
                this.ALUSrc = 10;
                this.branch = 0;
                this.bne = 0;
                this.jump = 0;
                this.memRead = 0;
                this.memWrite = 0;
                this.regWrite = 0;
                this.memToReg = 0;
                break;
            }
        }
    }

    getConcatedState() {
        let concat = 0b0, test;
        for (let i = 0; i < this.#signalList.length; i++) {
            test = (this.#signalList.length - i);
            concat += this[this.#signalList[i]] << (this.#signalList.length - i - 1)
        }

        return concat;
    }

    getFromConcated(signal, concated) {
        let shift = (this.#signalList.length - this.#signalList.indexOf(signal) - 1);

        if (shift > -1) {
            let bit = (concated >>> shift) & 0b01;
            return bit;
        }
    }

    _setJumpState() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 0;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 1;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.memToReg = 0;
    }

    _setRTypeState() {
        this.regDst = 1;
        this.opALU = 0b10;
        this.opALU1 = 1;
        this.opALU0 = 0;
        this.ALUSrc = 0;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 0;
    }

    _setADDIState() {
        this.regDst = 0;
        // this.opALU = 0b00;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 0;
    }

    _setLWState() {
        this.regDst = 0;
        // this.opALU = 0b00;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.memRead = 1;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 1;
    }

    _setSWState() {
        this.regDst = 0;
        // this.opALU = 0b00;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.memRead = 0;
        this.memWrite = 1;
        this.regWrite = 0;
        this.memToReg = 0;
    }

    _setBEQState() {
        this.regDst = 0;
        // this.opALU = 0b01;
        this.opALU1 = 0;
        this.opALU0 = 1;
        this.ALUSrc = 0;
        this.shft = 0;
        this.branch = 1;
        this.bne = 0;
        this.jump = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.memToReg = 0;
    }
};