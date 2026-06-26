const pool = require('./pool');

async function getRandomWord() {
  const { rows } = await pool.query(
    'select id, eng, kor from word order by random() limit 1'
  );

  return rows[0] || null;
}

async function getWordById(id) {
  const { rows } = await pool.query(
    'select id, eng, kor from word where id = $1',
    [id]
  );

  return rows[0] || null;
}

module.exports = {
  getRandomWord,
  getWordById
};
