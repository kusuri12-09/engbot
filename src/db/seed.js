const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('./pool');
const { JSON_DIR } = require('../data/source');

async function readJson(fileName) {
  const filePath = path.join(JSON_DIR, fileName);
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function upsertWords(client, words) {
  let count = 0;

  for (const [lesson, lessonWords] of Object.entries(words)) {
    for (const word of lessonWords) {
      await client.query(
        `insert into word (lesson, eng, kor)
         values ($1, $2, $3)
         on conflict (eng) do update
         set lesson = excluded.lesson,
             kor = excluded.kor`,
        [Number(lesson), word.en, word.ko]
      );
      count += 1;
    }
  }

  return count;
}

async function upsertPassages(client, passages) {
  let count = 0;

  for (const [lesson, passage] of Object.entries(passages)) {
    await client.query(
      `insert into passage (lesson, title, text)
       values ($1, $2, $3)
       on conflict (lesson) do update
       set title = excluded.title,
           text = excluded.text`,
      [Number(lesson), passage.title, passage.text]
    );
    count += 1;
  }

  return count;
}

async function upsertGrammarConcepts(client, concepts) {
  let sectionCount = 0;
  let exampleCount = 0;

  for (const [lesson, concept] of Object.entries(concepts)) {
    const conceptResult = await client.query(
      `insert into grammar_concept (lesson, title)
       values ($1, $2)
       on conflict (lesson) do update
       set title = excluded.title
       returning id`,
      [Number(lesson), concept.title]
    );
    const conceptId = conceptResult.rows[0].id;

    for (const [sectionIndex, section] of concept.sections.entries()) {
      const sectionResult = await client.query(
        `insert into grammar_concept_section (
           grammar_concept_id,
           section_order,
           title,
           content,
           pattern,
           note
         )
         values ($1, $2, $3, $4, $5, $6)
         on conflict (grammar_concept_id, section_order) do update
         set title = excluded.title,
             content = excluded.content,
             pattern = excluded.pattern,
             note = excluded.note
         returning id`,
        [
          conceptId,
          sectionIndex + 1,
          section.title,
          section.content,
          section.pattern,
          section.note || null
        ]
      );
      const sectionId = sectionResult.rows[0].id;
      sectionCount += 1;

      for (const [exampleIndex, example] of section.examples.entries()) {
        await client.query(
          `insert into grammar_concept_example (
             grammar_concept_section_id,
             example_order,
             eng,
             kor
           )
           values ($1, $2, $3, $4)
           on conflict (grammar_concept_section_id, example_order) do update
           set eng = excluded.eng,
               kor = excluded.kor`,
          [sectionId, exampleIndex + 1, example.en, example.ko]
        );
        exampleCount += 1;
      }
    }
  }

  return { sectionCount, exampleCount };
}

async function upsertGrammarQuestions(client, questions) {
  let questionCount = 0;
  let optionCount = 0;

  for (const [lesson, lessonQuestions] of Object.entries(questions)) {
    for (const [questionIndex, question] of lessonQuestions.entries()) {
      const questionResult = await client.query(
        `insert into grammar_question (
           lesson,
           question_order,
           type,
           instruction,
           sentence,
           wrong_part,
           answer,
           explanation,
           translation
         )
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         on conflict (lesson, question_order) do update
         set type = excluded.type,
             instruction = excluded.instruction,
             sentence = excluded.sentence,
             wrong_part = excluded.wrong_part,
             answer = excluded.answer,
             explanation = excluded.explanation,
             translation = excluded.translation
         returning id`,
        [
          Number(lesson),
          questionIndex + 1,
          question.type,
          question.instruction,
          question.sentence || null,
          question.wrongPart || null,
          String(question.answer),
          question.explanation,
          question.translation
        ]
      );
      const questionId = questionResult.rows[0].id;
      questionCount += 1;

      for (const [optionIndex, option] of (question.options || []).entries()) {
        await client.query(
          `insert into grammar_question_option (
             grammar_question_id,
             option_order,
             content
           )
           values ($1, $2, $3)
           on conflict (grammar_question_id, option_order) do update
           set content = excluded.content`,
          [questionId, optionIndex + 1, option]
        );
        optionCount += 1;
      }
    }
  }

  return { questionCount, optionCount };
}

async function main() {
  const [words, passages, grammarQuestions, grammarConcepts] =
    await Promise.all([
      readJson('words.json'),
      readJson('passages.json'),
      readJson('grammar-questions.json'),
      readJson('grammar-concepts.json')
    ]);

  const client = await pool.connect();

  try {
    await client.query('begin');

    const wordCount = await upsertWords(client, words);
    const passageCount = await upsertPassages(client, passages);
    const { sectionCount, exampleCount } = await upsertGrammarConcepts(
      client,
      grammarConcepts
    );
    const { questionCount, optionCount } = await upsertGrammarQuestions(
      client,
      grammarQuestions
    );

    await client.query('commit');

    console.log(
      [
        `Seed complete.`,
        `words=${wordCount}`,
        `passages=${passageCount}`,
        `grammar_sections=${sectionCount}`,
        `grammar_examples=${exampleCount}`,
        `grammar_questions=${questionCount}`,
        `grammar_options=${optionCount}`
      ].join(' ')
    );
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
