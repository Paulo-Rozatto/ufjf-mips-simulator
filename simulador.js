
// Criacao de array tipado em javascript, estao sendo alocados 128 bytes para corresponder os 32 registradores de 32 bits
const registers = new Int32Array(new ArrayBuffer(32 * 4));
let $pc = 0; 

// A memoria precisa ter 512 bytes;
const memory = new Int32Array(new ArrayBuffer(512));

/*
Operadores bitwise (https://www.w3schools.com/js/js_bitwise.asp)

Operator Name                   Description
&	    AND	                    Sets each bit to 1 if both bits are 1
|	    OR	                    Sets each bit to 1 if one of two bits is 1
^	    XOR	                    Sets each bit to 1 if only one of two bits is 1
~	    NOT	                    Inverts all the bits
<<	    Zero fill left shift    Shifts left by pushing zeros in from the right and let the leftmost bits fall off
>>	    Signed right shift	    Shifts right by pushing copies of the leftmost bit in from the left, and let the rightmost bits fall off
>>>	    Zero fill right shift	Shifts right by pushing zeros in from the left, and let the rightmost bits fall off
*/
// console.log((10).toString(2), parseInt('1010', 2));

