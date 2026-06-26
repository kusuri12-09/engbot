const fs = require('node:fs/promises');
const path = require('node:path');
const { JSON_DIR, loadSourceData } = require('./source');

async function writeJson(fileName, data) {
  const filePath = path.join(JSON_DIR, fileName);
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function main() {
  const sourceData = await loadSourceData();

  await fs.mkdir(JSON_DIR, { recursive: true });
  await Promise.all([
    writeJson('words.json', sourceData.words),
    writeJson('passages.json', sourceData.passages),
    writeJson('grammar-questions.json', sourceData.grammarQuestions),
    writeJson('grammar-concepts.json', sourceData.grammarConcepts)
  ]);

  console.log(`JSON files written to ${JSON_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
