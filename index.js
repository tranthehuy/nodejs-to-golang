const esprima = require('esprima');
const fs = require('fs');
const utils = require('./utils');

fs.readFile('./source/index.js', 'utf8', function(err, program) {
  if (err) console.log('File not found');
  console.log('program', program);
  const astTree = esprima.parseScript(program);
  utils.convertToFile(astTree, './dest/main.go');
  const astStr = JSON.stringify(astTree, null, "  ");
  console.log(astStr);
});

