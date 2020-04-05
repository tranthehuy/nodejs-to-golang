const fs = require('fs');
const _ = require('lodash');

const TYPES = {
  Program: 'Program',
  Literal: 'Literal',
  Identifier: 'Identifier',
  VariableDeclaration: 'VariableDeclaration',
  VariableDeclarator: 'VariableDeclarator',
  FunctionDeclaration: 'FunctionDeclaration',
  ExpressionStatement: 'ExpressionStatement',
  CallExpression: 'CallExpression',
  BinaryExpression: 'BinaryExpression',
  Literal: 'Literal'
}

const ERRORS = {
  wrongCode: 'Wrong code!'
}

const logger = {
  info: console.log
}

const buildLogExpression = (element) => {
  const objectName = _.get(element, 'expression.callee.object.name', '');
  const propertyName = _.get(element, 'expression.callee.property.name', '');
  if (objectName === 'console' && propertyName === 'log') {
    const arguments = _.get(element, 'expression.arguments', []);
    const argument = arguments.map(arg => arg.type === TYPES.Literal ? `"${arg.value}"` : arg.name);
    return `fmt.Println(${argument.join(', ')})`;
  }
  return '';
}

const buildCallExpression = (element) => {
  const objectName = _.get(element, 'expression.callee.name', '');
  const arguments = _.get(element, 'expression.arguments', []);
  const argument = arguments.map(arg => arg.type === TYPES.Literal ? `"${arg.value}"` : arg.name);
  return `${objectName}(${argument.join(', ')})`;
}

const convertElementToLine = (element, options = {}, parent) => {
  const { indent = '' } = options;
  let result = indent;
  let objectName, objectType, propertyName;
  switch (element && element.type) {
    case TYPES.Literal:
      objectValue = _.get(element, 'value', '');
      return isNaN(element.value) ? `"${objectValue}"` : objectValue;
      break;
    case TYPES.Identifier:
      objectName = _.get(element, 'name', '');
      return objectName;
    case TYPES.BinaryExpression: 
      objectOperator = _.get(element, 'operator', '');
      leftObject = _.get(element, 'left', {});
      leftStr = convertElementToLine(leftObject, options, element);
      rightObject = _.get(element, 'right', {});
      rightStr = convertElementToLine(rightObject, options, element);
      return `${leftStr} ${objectOperator} ${rightStr}`;
      break;
    case TYPES.ExpressionStatement:
      // detect console.log
      objectName = _.get(element, 'expression.callee.object.name', '');
      propertyName = _.get(element, 'expression.callee.property.name', '');
      if (objectName === 'console' && propertyName === 'log') {
        result = buildLogExpression(element);
        break;
      }
      result = buildCallExpression(element);
      break;
    case TYPES.VariableDeclarator:
      objectName = _.get(element, 'id.name', '');
      objectInit = _.get(element, 'init', {});
      objectType = _.get(element, 'init.type', '');
      objectKind = _.get(parent, 'kind', '');
      defType = objectKind === 'let' ? 'var' : 'const';
      valStr = convertElementToLine(objectInit, options, element);
      if (objectName && objectValue) {
        result = `${defType} ${objectName} = ${valStr}`;
      }
      break;
    case TYPES.VariableDeclaration:
      const declarations = _.get(element, 'declarations', []);
      result = declarations.map(e => convertElementToLine(e, options, element)).join('\n' + indent);
      break;
    case TYPES.FunctionDeclaration:
      result = convertFunctionElementCode(element, options, parent);
      break;
  }
  return result;
};

const convertFunctionElementCode = (element, options, parent) => {
  const { indent = '' } = options;
  const mIndent = indent + '  ';
  const objectName = _.get(element, 'id.name', '');
  const objectParams = _.get(element, 'params', []);
  const elements = _.get(element, 'body.body', []);
  const codes = elements.map(e => mIndent + convertElementToLine(e, { indent: mIndent }));
  const paramsStr = objectParams.map(p => p.name + ' string').join(', ');
  const defineLine = indent + `func ${objectName}(${paramsStr}) {`
  const noteLine = mIndent + '// TODO: please update types of params'
  const lines = ['', defineLine, noteLine, ...codes, indent + '}'];

  return lines.join("\n");
}

const convertProgramElementToCode = (element) => {
  if (element.type !== TYPES.Program) {
    logger.info(ERRORS.wrongCode);
    return;
  }

  const elements = element.body;
  const linesOfFunction = elements
    .map(e => convertElementToLine(e, {}))
    .filter(e => !!e);
  const functionCode = linesOfFunction.join("\n");

  const result = `
package main\n
import "fmt"\n\n
${functionCode}
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