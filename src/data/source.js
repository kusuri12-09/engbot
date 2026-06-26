const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const JSON_DIR = path.join(DATA_DIR, 'json');

async function loadExportedData(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const source = await fs.readFile(filePath, 'utf8');
  const commonJsSource = source.replace(
    /export const ([A-Z_]+)\s*=/g,
    'exports.$1 ='
  );
  const sandbox = { exports: {} };

  vm.runInNewContext(commonJsSource, sandbox, { filename: filePath });

  return sandbox.exports;
}

async function loadSourceData() {
  const [
    { WORDS },
    { PASSAGES },
    { GRAMMAR_QUESTIONS, GRAMMAR_CONCEPTS }
  ] = await Promise.all([
    loadExportedData('words.js'),
    loadExportedData('passages.js'),
    loadExportedData('grammar.js')
  ]);

  return {
    words: WORDS,
    passages: PASSAGES,
    grammarQuestions: GRAMMAR_QUESTIONS,
    grammarConcepts: GRAMMAR_CONCEPTS
  };
}

module.exports = {
  DATA_DIR,
  JSON_DIR,
  loadSourceData
};
