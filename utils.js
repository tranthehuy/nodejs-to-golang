const fs = require('fs');
const _ = require('lodash');

const TYPES = {
  Program: 'Program',
  VariableDeclaration: 'VariableDeclaration',
  ExpressionStatement: 'ExpressionStatement',
  CallExpression: 'CallExpression',
}

const ERRORS = {
  wrongCode: 'Wrong code!'
}

const logger = {
  info: console.log
}

const convertElementToLine = (element) => {
  let result = '';
  switch (element && element.type) {
    case TYPES.ExpressionStatement: 
      const objectName = _.get(element, 'expression.callee.object.name', '');
      const propertyName = _.get(element, 'expression.callee.property.name', '');
      if (objectName === 'console' && propertyName === 'log') {
        const argument0 = _.get(element, 'expression.arguments[0].value', '');
        result = `fmt.Println("${argument0}")`;
      }
      break;      
  }
  return result;
};

const convertProgramElementToCode = (element) => {
  if (element.type !== TYPES.Program) {
    logger.info(ERRORS.wrongCode);
    return;
  }

  const elements = element.body;
  const lines = elements.map(e => convertElementToLine(e));
  lines.unshift('  // main code here');
  const sourceCode = lines.join("\n  ");

  const result = `
package main
import "fmt"
func main() {
${sourceCode}
}
  `;

  return result;
}

const convertToFile  = (astTree, outputFile) => {
  let outputCode = "// created by Johnny Chen tools\n";
  
  const sourceCode = convertProgramElementToCode(astTree);
  outputCode += sourceCode;

  fs.writeFile(outputFile, outputCode, function (err) {
    if (err) throw err;
    console.log('Write output file done!');
  });

  return outputCode;
}

module.exports = {
  convertToFile
}