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
  ReturnStatement: 'ReturnStatement',
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
    const argument = arguments.map(arg => convertElementToLine(arg, {}, element));
    return `fmt.Println(${argument.join(', ')})`;
  }
  return '';
}

const nameToType = (name) => {
  if (name.includes('_')) {
    const arr = name.split('_');
    if (arr[1] === 'arr' || arr[1] === 'array') {
      return {
        name,
        type: `[${arr[2]}]${arr[3]}`
      }
    }
    return {
      name,
      type: arr[1]
    }
  }
  if (name.startsWith('int')) {
    return {
      name,
      type: 'int',
    };
  }
  if (name === 'main') {
    return {
      name,
      type: '',
    };
  }
  return {
    name,
    type: 'string',
  };
}

const convertElementToLine = (element, options = {}, parent) => {
  const { indent = '' } = options;
  let result = indent;
  let objectName, propertyName, leftStr, rightStr;
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
    case TYPES.MemberExpression:
      objectName = _.get(element, 'object.name', '');
      propertyName = _.get(element, 'property.name', '');
      return `${objectName}.${propertyName}`;
      break;
    case TYPES.CallExpression: 
      const callee = _.get(element, 'callee', {});
      const calleeStr = convertElementToLine(callee, options, element);
      const args = _.get(element, 'arguments', []);
      const argumentStr = args
        .map(arg => convertElementToLine(arg, {}, element))
        .join(', ');
      return `${calleeStr}(${argumentStr})`
      break;
    case TYPES.ReturnStatement:
      rightObject = _.get(element, 'argument', {});
      rightStr = convertElementToLine(rightObject, options, element);
      return `return ${rightStr}`;
    case TYPES.ExpressionStatement:
      // detect console.log
      objectName = _.get(element, 'expression.callee.object.name', '');
      propertyName = _.get(element, 'expression.callee.property.name', '');
      if (objectName === 'console' && propertyName === 'log') {
        result = buildLogExpression(element);
        break;
      }
      const exp = _.get(element, 'expression', {});
      result = convertElementToLine(exp, options, element);
      break;
    case TYPES.VariableDeclarator:
      objectName = _.get(element, 'id.name', '');
      objectValue = _.get(element, 'init', {});
      objectKind = _.get(parent, 'kind', '');
      defType = objectKind === 'let' ? 'var' : 'const';
      valStr = convertElementToLine(objectValue, options, element);
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

  const fromNameToDefinition = (name) => {
    const o = nameToType(name);
    return `${o.name} ${o.type}`;
  }
  const paramsStr = objectParams.map(p => fromNameToDefinition(p.name)).join(', ');

  const funcType = nameToType(objectName);
  // build a function from template
  const defineLine = indent + `func ${funcType.name}(${paramsStr}) ${funcType.type} {`
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