const esprima = require('esprima');
const fs = require('fs');
const utils = require('./utils');

fs.readFile('./source/index.js', 'utf8', function(err, program) {
  if (err) console.log('File not found');
  console.log('program', program);
  const astTree = esprima.parseScript(program);
  const astStr = JSON.stringify(astTree, null, "  ");
  console.log('Tree: \n', astStr);
  const sourceCode = utils.convertToFile(astTree, './dest/main.go');

  console.log('SourceCode: \n', sourceCode);
});

