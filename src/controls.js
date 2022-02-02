// Classe que gera os sinais de controle

class Control {
    // Como durante o desenvolvimento os sinais foram progressivamente adcionados
    // Foi criado a lista abaixo para automatizar o processo de insercao e busca dos sinais de controle
    #signalList = ["memToReg", "regWrite", "memWrite", "memRead", "branch", "bne", "jump", "link", "jr", "shft", "ALUSrc", "opALU1", "opALU0", "regDst"];

    constructor() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 10;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.link = 0;
        this.jr = 0;
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

        switch (opcode) {
            case 0: { // Tipo R
                this._setRTypeState()

                if (funct == 0b0) { // shift left logical
                    this.shft = 1;
                }
                if (funct == 0b001000) { // Jump register
                    this.jr = 1;
                    this.jump = 1;
                    this.regWrite = 0;
                }
                break;
            }
            case 2: { // Jump
                this._setJumpState()
                break;
            }
            case 3: { // Jump and Link
                this._setJumpState();
                this.link = 1;
                this.regWrite = 1;
                break;
            }
            case 4: { // Branch equal
                this._setBEQState();
                break;
            }
            case 5: { // Branch not equal
                this._setBEQState();
                this.bne = 1;
                break;
            }
            case 8: { // addi
                this._setADDIState();
                break;
            }
            case 35: { // Load word
                this._setLWState();
                break;
            }
            case 43: { // Save word
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
                this.link = 0;
                this.jr = 0;
                this.memRead = 0;
                this.memWrite = 0;
                this.regWrite = 0;
                this.memToReg = 0;
                break;
            }
        }
    }

    // Concatena todos sinais de controle como se fosse um numero
    // Para facilitar a implementacao, esse sinal de controle unificado e passado adiante entre os estagios do pipeline
    // Apesar de nao ser muito fiel ao que acontece na pratica
    getConcatedState() {
        let concat = 0b0, test;
        for (let i = 0; i < this.#signalList.length; i++) {
            test = (this.#signalList.length - i);
            concat += this[this.#signalList[i]] << (this.#signalList.length - i - 1)
        }

        return concat;
    }

    // Pega o sinal de controle do numero concatenado dadi o nome do sinal
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
        this.link = 0;
        this.jr = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 0;
    }

    _setADDIState() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.link = 0;
        this.jr = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 0;
    }

    _setLWState() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.link = 0;
        this.jr = 0;
        this.memRead = 1;
        this.memWrite = 0;
        this.regWrite = 1;
        this.memToReg = 1;
    }

    _setSWState() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 0;
        this.ALUSrc = 1;
        this.shft = 0;
        this.branch = 0;
        this.bne = 0;
        this.jump = 0;
        this.link = 0;
        this.jr = 0;
        this.memRead = 0;
        this.memWrite = 1;
        this.regWrite = 0;
        this.memToReg = 0;
    }

    _setBEQState() {
        this.regDst = 0;
        this.opALU1 = 0;
        this.opALU0 = 1;
        this.ALUSrc = 0;
        this.shft = 0;
        this.branch = 1;
        this.bne = 0;
        this.jump = 0;
        this.link = 0;
        this.jr = 0;
        this.memRead = 0;
        this.memWrite = 0;
        this.regWrite = 0;
        this.memToReg = 0;
    }
};