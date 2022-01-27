
import Control from "./controls.js";
import ALU from "./alu.js";

// Criacao de array tipado em javascript, estao sendo alocados 128 bytes para corresponder os 32 registradores de 32 bits
const registers = new Int32Array(new ArrayBuffer(128));

//operacoes bitwise em javascript convertem numeros para inteiros de 32 bits,
//por isso esta sendo usado o OR aqui e em outras partes do codigo
let pc = 0 | 0;

// A memoria de instrucoes
const instruction_memory = [];

// A memoria de dados precisa ter 512 bytes, cria um vetor de 128 inteiros;
const data_memory = new Int32Array(new ArrayBuffer(512));

// Registradores do pipeline
const if_id = new Int32Array(new ArrayBuffer(8)); // 64 bits ou 32 bytes
const id_ex = new Int32Array(new ArrayBuffer(16)); // 128 bits ou 16 bytes
const ex_mem = new Int32Array(new ArrayBuffer(12)); // 104 bits ou 13 bytes (precisa de apenas 97 bits, porem a alocacao precisa ser feita em bytes)
const mem_wb = new Int32Array(new ArrayBuffer(8)); // 64 bits ou 32 bytes

const control = new Control();
const alu = new ALU();

function loadFromTextArea() {
    // Pega conteudo do text area, separa por quebra de linha e guarda num array
    const text = document.getElementById("text-input").value.split('\n');

    for (let instruction of text) {
        // Desconsidera instrucoes com tamanho invalido
        if (instruction.length < 32) {
            continue;
        }

        // passa a instrucao para inteiro levando em consideracao que esta escrita na base 2
        instruction_memory.push(parseInt(instruction, 2) | 0);
    }

    // console.log('Instruction memory: ')
    // for(let i of instruction_memory) {
    //     console.log(i);
    // }
}
loadFromTextArea();

function cycle() {
    instruction_fetch();
    instruction_decode();
    execute();
    memory_read();
    write_back();
}
cycle();

// todo: trocar nome das funcoes
function instruction_fetch() { // Busca instrucao
    // console.log('IF')
    // console.log(`pc: ${pc}, inst: ${instruction_memory[pc]}`)

    if_id[0] = instruction_memory[pc / 4]; // o array aloca 1 byte em cada posicao e o pc esta em bytes
    pc += 4;
    if_id[1] = pc;

    htmlWrite('pc', pc);

    // console.log(if_id);
}

function instruction_decode() { // Decodifica instrucoes
    control.set(if_id[0]);

    let rs = (if_id[0] >>> 21) & 0b00000000000000000000000000011111; // [25-21]
    let rt = (if_id[0] >>> 15) & 0b00000000000000000000000000011111; // [20-16]
    let imediate = if_id[0] & 0b00000000000000001111111111111111; // [15 - 0]

    // extender o sinal: zero fill para a esquerda e depois  sigend shift para a direita
    imediate = (imediate << 16) >> 16;

    id_ex[0] = registers[rs];
    id_ex[1] = registers[rt]
    id_ex[2] = imediate;
    id_ex[3] = if_id[1]; // salva PC + 4

    // console.log(rs, rt);
    // console.log(id_ex);
}

function execute() { // execucao ou calculo de endereco

    let result = alu.execute(0b10, id_ex[0], id_ex[2]) // rs + imediate

    ex_mem[0] = result;

    console.log(result);
}

function memory_read() { // acesso a memoria
    data_memory[1] = 0b00000000000000000000000010000010

    // data_memory guarda words, entao precisa dividir o endereco por 4
    let address = Math.floor(ex_mem[0] / 4);

    console.log('memory read')
    console.log(address, data_memory[address])

    mem_wb[0] = data_memory[address];

}

function write_back() { // escrita do resultado
    let rt = (if_id[0] >>> 15) & 0b00000000000000000000000000011111; // [20-16]

    registers[rt] = mem_wb[0];

    console.log('write back')
    console.log(rt.toString(2), registers[rt])

    updateUI();
}

function updateUI() {
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
}

function htmlWrite(id, value) {
    // - Na hora de mostrar os numeros negativos, o javascript usa sinal, 
    //   por exemplo, o -2 e mostrado como -10 ao inves de 11111111111111111111111111111110
    //   Usar o deslocamento para direita >>> com 0 deslocamentos corrige a exibicao

    // - O parametro 2 no toString se refere a base numerica

    // - O pad start preenche a string com o caractere informado ate que ela tenha o tamanho do informado
    //   So sera preciso o padStart em numeros positivos, entao pode-se preencher com zeros apenas

    document.getElementById(id).innerHTML = (value >>> 0).toString(2).padStart(32, '0');
}



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
