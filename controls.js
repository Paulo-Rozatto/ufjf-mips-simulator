export default class Control {

    constructor() {
        this.regDst = 0;
        this.opALU = 0;
        this.ALUSrc = 0;
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
                break;
            }
            case 5: {
                console.log('ben');
                break;
            }
            case 35: {
                console.log('Load word')
                break;
            }
            case 43: {
                console.log('Save word');
                break;
            }
        }
    }
};