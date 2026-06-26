create table if not exists word (
  id bigserial primary key,
  lesson int not null default 0,
  eng varchar(255) unique not null,
  kor varchar(255) not null
);

alter table word
  add column if not exists lesson int not null default 0;

alter table word
  drop constraint if exists word_kor_key;

create table if not exists discord_guild (
  id bigserial primary key,
  guild_id varchar(32) unique not null,
  name varchar(255) not null,
  owner_id varchar(32),
  member_count int,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists passage (
  id bigserial primary key,
  lesson int unique not null,
  title varchar(255) not null,
  text text not null
);

create table if not exists grammar_concept (
  id bigserial primary key,
  lesson int unique not null,
  title varchar(255) not null
);

create table if not exists grammar_concept_section (
  id bigserial primary key,
  grammar_concept_id bigint not null references grammar_concept(id) on delete cascade,
  section_order int not null,
  title varchar(255) not null,
  content text not null,
  pattern varchar(255) not null,
  note text
);

create unique index if not exists grammar_concept_section_order_key
  on grammar_concept_section(grammar_concept_id, section_order);

create table if not exists grammar_concept_example (
  id bigserial primary key,
  grammar_concept_section_id bigint not null references grammar_concept_section(id) on delete cascade,
  example_order int not null,
  eng text not null,
  kor text not null
);

create unique index if not exists grammar_concept_example_order_key
  on grammar_concept_example(grammar_concept_section_id, example_order);

create table if not exists grammar_question (
  id bigserial primary key,
  lesson int not null,
  question_order int not null,
  type varchar(50) not null,
  instruction text not null,
  sentence text,
  wrong_part text,
  answer text not null,
  explanation text not null,
  translation text not null
);

create unique index if not exists grammar_question_order_key
  on grammar_question(lesson, question_order);

create table if not exists grammar_question_option (
  id bigserial primary key,
  grammar_question_id bigint not null references grammar_question(id) on delete cascade,
  option_order int not null,
  content text not null
);

create unique index if not exists grammar_question_option_order_key
  on grammar_question_option(grammar_question_id, option_order);

create table if not exists quiz (
  id bigserial primary key,
  question varchar(255) not null,
  answer int not null,
  constraint quiz_answer_range check (answer between 1 and 5)
);
