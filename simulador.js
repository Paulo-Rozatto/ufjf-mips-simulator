const FIRST_HALF = 0;
const SECOND_HALF = 1;

// Criacao de array tipado em javascript, estao sendo alocados 128 bytes para corresponder os 32 registradores de 32 bits
const registers = new Int32Array(new ArrayBuffer(128));

//operacoes bitwise em javascript convertem numeros para inteiros de 32 bits,
//por isso esta sendo usado o OR aqui e em outras partes do codigo
let pc = 0 | 0;

// A memoria de instrucoes
const instruction_memory = [];

// A memoria de dados precisa ter 512 bytes, cria um vetor de 128 inteiros;
const data_memory = new Int32Array(new ArrayBuffer(512));

// Registradores do pipeline sendo alocados por quantidade de bytes
const if_id = new Int32Array(new ArrayBuffer(8)); // 2 posicoes
const id_ex = new Int32Array(new ArrayBuffer(36)); // 9 posicoes
const ex_mem = new Int32Array(new ArrayBuffer(32)); // 8 posicoes
const mem_wb = new Int32Array(new ArrayBuffer(16)); // 4 posicoes

const control = new Control();
const alu = new ALU();

// Auxiliadores para mostrar qual comando esta sendo executado em assembly
const converter = new BinaryConverter();
const execution_queue = ['-', '-', '-', '-', '-'];
const binary_queue = ['', '', '', '', '']
let lasWasJump = false;

// String de saida
let output = "";

let cycleCount = 0;
function cycle() {
    cycleCount++;
    output += `Ciclo ${cycleCount}\n` + `PC: ${pc}\n`;

    instructionFetch(FIRST_HALF);
    instructionDecode(FIRST_HALF);
    execute(FIRST_HALF);
    memoryRead(FIRST_HALF);
    writeBack(FIRST_HALF);

    instructionFetch(SECOND_HALF);
    instructionDecode(SECOND_HALF);
    execute(SECOND_HALF);
    memoryRead(SECOND_HALF);
    writeBack(SECOND_HALF);

    output += "\n";
    output += "--------------------------------------------------------------"
    output += "\n";
    updateUI();

    // Se o comando executado no estagio 4 for jump, apague da fila
    if (lasWasJump) {
        execution_queue[3] = '-';
        binary_queue[3] = 0;
    }
}

function writeInOutput(name, instruction, binary, controls, regName, reg) {
    output += name + "\n";
    output += "\t- Instrução: " + instruction + "\n";
    output += "\t- Instrução em binario: " + toBin(binary) + "\n"

    output += "\t- Sinais de controle:" + "\n";
    for (let ctr in controls) {
        output += "\t\t- " + ctr + ": " + controls[ctr] + "\n";
    }

    output += "\t- " + regName + ":\n"
    if (reg.length > 0)
        for (let n of reg) {
            output += "\t\t- " + toBin(n) + "\n";
        }

    function toBin(x) {
        return (x >>> 0).toString(2).padStart(32, '0');
    }
}

function instructionFetch(half) { // Busca instrucao
    if (half === FIRST_HALF) { // primeira metada de ciclo apenas leitura

        this.instruction = instruction_memory[pc / 4]; // o array aloca 1 byte em cada posicao e o pc esta em bytes
        this.pcIncremented = pc + 4;

        // para exibir na interface
        let convertedInstruction = converter.convert(this.instruction);
        execution_queue.unshift(convertedInstruction);
        binary_queue.unshift(this.instruction);
    }
    else if (half == SECOND_HALF) {
        if_id[0] = this.instruction;
        if_id[1] = this.pcIncremented;

        pc = this.pcIncremented;
        htmlWrite('pc', pc);
        writeInOutput("Instruction Fetch", execution_queue[0], binary_queue[0], null, "IF/ID", if_id);
    }
}

function instructionDecode(half) { // Decodifica instrucoes
    if (half == FIRST_HALF) {
        this.rs = (if_id[0] >>> 21) & 0b11111; // [25-21]
        this.rt = (if_id[0] >>> 16) & 0b11111; // [20-16]
        this.rd = (if_id[0] >>> 11) & 0b11111; // [15 - 11]
        this.shamt = (if_id[0] >>> 6) & 0b11111; // [10-6]
        this.imediate = if_id[0] & 0b1111111111111111; // [15 - 0]
        this.nextPc = if_id[1];
        this.jumpAddress = if_id[0] & 0b00000011111111111111111111111111; // [25-0]

        control.set(if_id[0]);

        this.controlConcat = control.getConcatedState();

        // extender o sinal: zero fill para a esquerda e depois  sigend shift para a direita
        this.imediate = (this.imediate << 16) >> 16;
    }
    else if (half == SECOND_HALF) {
        id_ex[0] = this.controlConcat;
        id_ex[1] = this.nextPc; // salva PC + 4
        id_ex[2] = registers[this.rs];
        id_ex[3] = registers[this.rt];
        id_ex[4] = this.imediate;
        id_ex[5] = this.shamt;
        id_ex[6] = this.rt; // salva endereco para escrever load word
        id_ex[7] = this.rd;
        id_ex[8] = this.jumpAddress;

        writeInOutput("Instruction Decode", execution_queue[1], binary_queue[1], null, "ID/EX", id_ex);
    }
}

function execute(half) { // execucao ou calculo de endereco
    if (half == FIRST_HALF) {
        let regDst = control.getFromConcated('regDst', id_ex[0]);
        let op1 = control.getFromConcated('opALU1', id_ex[0]);
        let op0 = control.getFromConcated('opALU0', id_ex[0]);
        let aluSrc = control.getFromConcated('ALUSrc', id_ex[0]);
        let shift = control.getFromConcated('shft', id_ex[0]);
        let jr = control.getFromConcated('jr', id_ex[0]);
        let opAlu = (op1 << 1) + op0;

        this.pcNext = id_ex[1];

        if (jr) {
            this.jAddress = id_ex[2];
        }
        else {
            // 4 bits mais significativos de PC + 4
            let mostSig = id_ex[1] & 0b11110000000000000000000000000000;
            // 4 bits mais significativos de PC + 4 concatenados com o endereco do campo imediate da instrucao deslocado 2x para esquerda
            this.jAddress = mostSig + (id_ex[8] << 2);
        }

        // Guarda os sinais de controle restantes para passar para etapa seguinte
        this.memoryControls = id_ex[0];

        // Calcula valor de pc desvio: valor de proximo pc + (campo offset deslocado 2 para esquerda)
        this.branchAdress = id_ex[1] + (id_ex[4] << 2);

        // Operandos da ALU
        let firstOperand;
        let secondOperand;

        if (shift === 1) {
            firstOperand = id_ex[3];
            secondOperand = id_ex[5]; // shamt
        }
        else {
            firstOperand = id_ex[2];
            secondOperand = aluSrc === 0 ? id_ex[3] : id_ex[4]; // escolhe entre rt e imediate
        }

        // Obter qual operacao sera executada na alu
        let funct = id_ex[4] & 0b111111; // pega ultimos 6 bits do 
        let aluCode = alu.control(opAlu, funct);

        this.result = alu.execute(aluCode, firstOperand, secondOperand) // rs + imediate

        // Salva valor guradado em rt para passar adiante e possivelmente ser escrito
        this.rtValue = id_ex[3];

        // Escolhe entre endercos de rt e rd para decidir qual o registrador escrito
        this.writeAddress = regDst === 0 ? id_ex[6] : id_ex[7];

        // Salva sinais de controle em objeto para exibir no arquivo de saida
        this.exControls = { regDst, op1, op0, aluSrc, shift, jr, opAlu }
    }
    else if (half == SECOND_HALF) {
        ex_mem[0] = this.memoryControls;
        ex_mem[1] = this.pcNext;
        ex_mem[2] = this.branchAdress;
        ex_mem[3] = (this.result === 0); // Faz a mesmca coisa que a saida zero da Alu
        ex_mem[4] = this.result;
        ex_mem[5] = this.rtValue;
        ex_mem[6] = this.writeAddress;
        ex_mem[7] = this.jAddress;

        writeInOutput("Execute", execution_queue[2], binary_queue[2], this.exControls, "EX/MEM", ex_mem);
    }
}

function memoryRead(half) { // acesso a memoria
    if (half == FIRST_HALF) {
        let branch = control.getFromConcated('branch', ex_mem[0]);
        let bne = control.getFromConcated('bne', ex_mem[0]);
        let jump = control.getFromConcated('jump', ex_mem[0]);
        let link = control.getFromConcated('link', ex_mem[0]);
        let memRead = control.getFromConcated('memRead', ex_mem[0]);
        let memWrite = control.getFromConcated('memWrite', ex_mem[0]);

        this.wbControls = ex_mem[0];

        if (bne === 1)
            ex_mem[3] = !ex_mem[3];

        this.PCSrc = (branch && ex_mem[3]) || jump; // (branch AND alu_zero) OR jump

        this.branchAddress
        if (jump === 1) {
            this.branchAddress = ex_mem[7];
        }
        else {
            this.branchAddress = ex_mem[2];
        }

        // data_memory guarda words, entao precisa dividir o endereco por 4
        let address = Math.floor(ex_mem[4] / 4);

        if (memRead === 1) {
            this.memContent = data_memory[address];
        }

        if (memWrite === 1) {
            data_memory[address] = ex_mem[5]
        }

        // Se for link, mande PC + 4 para a escrita no registrador $ra, senao mande o resultado da ALU para escrita no registrador guardado
        if (link === 1) {
            this.writeValue = ex_mem[1];
            this.regAddress = 31;
        }
        else {
            this.writeValue = ex_mem[4];
            this.regAddress = ex_mem[6];
        }

        // auxiliar para exibicao na interface com o usuaio
        // se a instrucao e jump que nao e jal, a execucao dela termina aqui
        // avisa a proxima funcao para remover o jum da fila
        lasWasJump = (jump === 1 && link === 0) || branch || bne;

        // Salva sinais de controle em objeto para exibir no arquivo de saida
        this.memControls = { branch, bne, jump, link, memRead, memWrite };

    }
    else if (half == SECOND_HALF) {
        mem_wb[0] = this.wbControls;
        mem_wb[1] = this.memContent;
        mem_wb[2] = this.writeValue;
        mem_wb[3] = this.regAddress;

        if (this.PCSrc) {
            pc = this.branchAddress;
        }

        writeInOutput("Memory Read", execution_queue[3], binary_queue[3], this.memControls, "MEM/WB", mem_wb);
    }
}

function writeBack(half) { // escrita do resultado
    if (half == FIRST_HALF) {
        this.regWrite = control.getFromConcated('regWrite', mem_wb[0]);
        this.memToReg = control.getFromConcated('memToReg', mem_wb[0]);

        this.value = this.memToReg === 1 ? mem_wb[1] : mem_wb[2];
        this.dst = mem_wb[3];

        // Salva sinais de controle em objeto para exibir no arquivo de saida
        this.wbControl = { regWrite: this.regWrite, memToReg: this.memToReg }
    }
    else if (half == SECOND_HALF) {
        if (this.regWrite === 1) {
            registers[this.dst] = this.value;
        }

        // remove ultimo elemento ja que acabou sua execucao
        execution_queue.pop();
        binary_queue.pop();


        writeInOutput("Write Back", execution_queue[4], binary_queue[4], this.wbControl, "Nao tem registrador", []);
    }
}

// --- Comunicacao com a user interface --- //

document.getElementById('btn-load').addEventListener('click', loadFromTextArea, false);
document.getElementById('btn-run').addEventListener('click', run, false);
document.getElementById('btn-next').addEventListener('click', cycle, false);
document.getElementById('btn-reset').addEventListener('click', reset, false);
document.getElementById('btn-download').addEventListener('click', dowloadFile, false)

function loadFromTextArea() {
    // Pega conteudo do text area, separa por quebra de linha e guarda num array
    const text = document.getElementById("text-input").value.split('\n');

    for (let instruction of text) {
        // Desconsidera instrucoes com tamanho invalido
        if (instruction.length < 32)
            continue;

        // passa a instrucao para inteiro levando em consideracao que esta escrita na base 2
        instruction_memory.push(parseInt(instruction, 2) | 0);
    }

    document.getElementById('btn-next').classList.remove('w3-disabled')
    document.getElementById('btn-run').classList.remove('w3-disabled')
}

const delay = 900; // delay ao executar uma instrucao e outra
let timeOut; // guarda a referecia do timeou para poder cancela-lo
function run() {
    cycle();

    let i = 0;
    let isComand = false;

    while (isComand == false && i < 5) {
        i++;
        isComand = execution_queue[i] != '-';
    }

    if (isComand) {
        timeOut = setTimeout(run, delay);
    }
    else {
        clearTimeout(timeOut);
    }
}

function reset() {
    clearTimeout(timeOut);

    resetArray(registers);
    resetArray(if_id);
    resetArray(id_ex);
    resetArray(ex_mem);
    resetArray(mem_wb);
    resetArray(execution_queue, '-')

    pc = 0 | 0;
    cycleCount = 0;
    output = "";


    updateUI();

    function resetArray(array, value = 0) {
        for (let i = 0; i < array.length; i++) {
            array[i] = value;
        }
    }
}

function dowloadFile(e) {
    let blob = new Blob([output], {type: 'text/plain'});
    e.target.download = "log-simulador.txt";
    e.target.href = window.URL.createObjectURL(blob);
}


function updateUI() {
    // Comandos
    document.getElementById('lbl-if').innerText = execution_queue[0];
    document.getElementById('lbl-id').innerText = execution_queue[1];
    document.getElementById('lbl-exec').innerText = execution_queue[2];
    document.getElementById('lbl-mem').innerText = execution_queue[3];
    document.getElementById('lbl-wb').innerText = execution_queue[4];

    // contador de cyclo
    document.getElementById('cycle').innerHTML = `${cycleCount}`;

    // Text area de saida
    document.getElementById('text-output').value = output;

    // PC
    htmlWrite('pc', pc);

    // Banco de registradores
    htmlWrite('v0', registers[2]);
    htmlWrite('v1', registers[3]);

    for (let i = 0; i < 4; i++) {
        htmlWrite('a' + i, registers[4 + i]);
    }

    for (let i = 0; i < 8; i++) {
        htmlWrite('t' + i, registers[8 + i]);
    }
    htmlWrite('t8', registers[24]);
    htmlWrite('t9', registers[25]);

    for (let i = 0; i < 8; i++) {
        htmlWrite('r' + i, registers[15 + i]);
    }

    htmlWrite('gp', registers[28]);
    htmlWrite('sp', registers[29]);
    htmlWrite('fp', registers[20]);
    htmlWrite('ra', registers[31]);

    // Pipeline
    for (let i = 0; i < if_id.length; i++) {
        htmlWrite('if-id', if_id[i], i > 0);
    }

    for (let i = 0; i < id_ex.length; i++) {
        htmlWrite('id-ex', id_ex[i], i > 0);
    }

    for (let i = 0; i < ex_mem.length; i++) {
        htmlWrite('ex-mem', ex_mem[i], i > 0);
    }

    for (let i = 0; i < mem_wb.length; i++) {
        htmlWrite('mem-wb', mem_wb[i], i > 0);
    }
}

function htmlWrite(id, value, additive) {
    // - Na hora de mostrar os numeros negativos, o javascript usa sinal, 
    //   por exemplo, o -2 e mostrado como -10 ao inves de 11111111111111111111111111111110
    //   Usar o deslocamento para direita >>> com 0 deslocamentos corrige a exibicao

    // - O parametro 2 no toString se refere a base numerica

    // - O pad start preenche a string com o caractere informado ate que ela tenha o tamanho do informado
    //   So sera preciso o padStart em numeros positivos, entao pode-se preencher com zeros apenas
    let text = (value >>> 0).toString(2).padStart(32, '0');
    if (additive)
        document.getElementById(id).innerHTML += '<br>' + text;
    else
        document.getElementById(id).innerHTML = text
}

updateUI();

/**
 * Operadores bitwise (https://www.w3schools.com/js/js_bitwise.asp)
 * Operator Name                   Description
 * &	    AND	                    Sets each bit to 1 if both bits are 1
 * |	    OR	                    Sets each bit to 1 if one of two bits is 1
 * ^	    XOR	                    Sets each bit to 1 if only one of two bits is 1
 * ~	    NOT	                    Inverts all the bits
 * <<	    Zero fill left shift    Shifts left by pushing zeros in from the right and let the leftmost bits fall off
 * >>	    Signed right shift	    Shifts right by pushing copies of the leftmost bit in from the left, and let the rightmost bits fall off
 * >>>	    Zero fill right shift	Shifts right by pushing zeros in from the left, and let the rightmost bits fall off
*/
