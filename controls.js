class Control {
    // #ALUSrc = 0;

    constructor() {
        this.regDst = 0;
        this.opALU = 0;
        this.ALUSrc = 10;
        this.branch = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.memToReg = 0;
    }

    set(instruction) {
        // pega os 6 primeiros bits da instrucao
        let opcode = instruction >>> 26;
        // console.log(opcode.toString(2))

        switch (opcode) {
            case 0: {
                console.log('R-type')
                this._setRTypeState()
                break;
            }
            case 2: {
                console.log('j');
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
                this.memRead = 0;
                this.memWrite = 0;
                this.regWrite = 0;
                this.memToReg = 0;
                break;
            }
        }
    }

    getConcatedState() {
        let concat = (this.memToReg << 8) + (this.regWrite << 7);
        concat += (this.memWrite << 6) + (this.memRead << 5) + (this.branch << 4);
        concat += (this.ALUSrc << 3) + (this.opALU << 1) + (this.regDst << 0);

        return concat;
    }

    _setRTypeState() {
        this.regDst = 1;
        this.opALU = 0b10;
        this.ALUSrc = 0;
        this.branch = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 0;
    }

    _setLWState() {
        this.regDst = 0;
        this.opALU = 0b00;
        this.ALUSrc = 1;
        this.branch = 0;
        this.memRead = 1;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 1;
    }

    _setSWState() {
        this.regDst = 0;
        this.opALU = 0b00;
        this.ALUSrc = 1;
        this.branch = 0;
        this.memRead = 0;
        this.memWrite = 1;
        this.regWrite = 0;
        this.memToReg = 0;
    }

    _setBEQState() {
        this.regDst = 0;
        this.opALU = 0b01;
        this.ALUSrc = 0;
        this.branch = 1;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.memToReg = 0;
    }
};