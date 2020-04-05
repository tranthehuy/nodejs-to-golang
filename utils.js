const TYPES = {
  PROGRAM: 'Program'
}

const ERRORS = {
  wrongCode: 'Wrong code!'
}

const logger = {
  info: console.log
}

const convertToFile  = (astTree, outputFile) => {
  const outputCode = [];
  if (astTree.type !== TYPES.PROGRAM) {
    logger.info(ERRORS.wrongCode);
    return;
  }

}

export default {
  convertToFile
}