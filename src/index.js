const {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { discordToken } = require('./config');
const { LANGUAGE_CHOICES } = require('./commands');
const { upsertUserInstall } = require('./db/users');
const { getRandomWord, getWordById } = require('./db/words');
const pool = require('./db/pool');

const COMMANDS = {
  WORD: '단어',
  QUIZ: '퀴즈'
};

const ANSWER_BUTTON_PREFIX = 'word-open';
const MODAL_PREFIX = 'word-answer';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages
  ]
});

function getAuthorizingUserId(interaction) {
  const owners = interaction.authorizingIntegrationOwners;
  const userInstallKey = String(ApplicationIntegrationType.UserInstall);

  if (!owners) {
    return interaction.user.id;
  }

  if (owners instanceof Map) {
    return owners.get(ApplicationIntegrationType.UserInstall) ||
      owners.get(userInstallKey) ||
      interaction.user.id;
  }

  return owners[ApplicationIntegrationType.UserInstall] ||
    owners[userInstallKey] ||
    interaction.user.id;
}

async function saveInteractionUser(interaction) {
  await upsertUserInstall({
    userId: getAuthorizingUserId(interaction),
    username: interaction.user.username,
    globalName: interaction.user.globalName,
    context: interaction.context === null || interaction.context === undefined
      ? null
      : String(interaction.context),
    guildId: interaction.guildId,
    channelId: interaction.channelId
  });
}

function buildWordPrompt(word, language) {
  if (language === LANGUAGE_CHOICES.KOREAN) {
    return {
      title: '영어 단어 퀴즈',
      prompt: '다음 영어 단어의 한국어 뜻을 작성하세요',
      clue: word.eng,
      label: '한국어 뜻'
    };
  }

  return {
    title: '영어 단어 퀴즈',
    prompt: '다음 한국어 뜻을 보고 영어 단어를 작성하세요',
    clue: word.kor,
    label: '영어 단어'
  };
}

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase('ko-KR');
}

function isCorrectAnswer(word, language, answer) {
  const expected =
    language === LANGUAGE_CHOICES.KOREAN ? word.kor : word.eng;

  return normalizeAnswer(answer) === normalizeAnswer(expected);
}

async function handleWordCommand(interaction) {
  const language = interaction.options.getString('언어', true);
  const word = await getRandomWord();

  if (!word) {
    await interaction.reply({
      content: '등록된 단어가 없습니다.',
      ephemeral: true
    });
    return;
  }

  const { title, prompt, clue } = buildWordPrompt(word, language);
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(prompt)
    .addFields({ name: '문제', value: clue })
    .setColor(0x2f80ed);

  const answerButton = new ButtonBuilder()
    .setCustomId(`${ANSWER_BUTTON_PREFIX}:${interaction.user.id}:${word.id}:${language}`)
    .setLabel('답안 입력')
    .setStyle(ButtonStyle.Primary);

  await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(answerButton)
    ]
  });
}

async function handleWordAnswerButton(interaction) {
  const [, userId, wordId, language] = interaction.customId.split(':');

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: '이 퀴즈를 요청한 사용자만 답안을 입력할 수 있습니다.',
      ephemeral: true
    });
    return;
  }

  const word = await getWordById(wordId);

  if (!word) {
    await interaction.reply({
      content: '해당 단어를 찾을 수 없습니다.',
      ephemeral: true
    });
    return;
  }

  const { title, label } = buildWordPrompt(word, language);
  const modal = new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}:${userId}:${word.id}:${language}`)
    .setTitle(title);

  const answerInput = new TextInputBuilder()
    .setCustomId('answer')
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(255);

  modal.addComponents(
    new ActionRowBuilder().addComponents(answerInput)
  );

  await interaction.showModal(modal);
}

async function handleWordAnswer(interaction) {
  const [, userId, wordId, language] = interaction.customId.split(':');

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: '이 퀴즈를 요청한 사용자만 답안을 제출할 수 있습니다.',
      ephemeral: true
    });
    return;
  }

  const answer = interaction.fields.getTextInputValue('answer');
  const word = await getWordById(wordId);

  if (!word) {
    await interaction.reply({
      content: '해당 단어를 찾을 수 없습니다.',
      ephemeral: true
    });
    return;
  }

  if (isCorrectAnswer(word, language, answer)) {
    await interaction.reply({
      content: '정답입니다.',
      ephemeral: true
    });
    return;
  }

  const expected =
    language === LANGUAGE_CHOICES.KOREAN ? word.kor : word.eng;

  await interaction.reply({
    content: `오답입니다. 정답은 ${expected}입니다.`,
    ephemeral: true
  });
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    await saveInteractionUser(interaction);

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === COMMANDS.WORD) {
        await handleWordCommand(interaction);
        return;
      }

      if (interaction.commandName === COMMANDS.QUIZ) {
        await interaction.reply('아직 구현되지 않은 기능입니다');
      }
      return;
    }

    if (
      interaction.isButton() &&
      interaction.customId.startsWith(`${ANSWER_BUTTON_PREFIX}:`)
    ) {
      await handleWordAnswerButton(interaction);
      return;
    }

    if (
      interaction.isModalSubmit() &&
      interaction.customId.startsWith(`${MODAL_PREFIX}:`)
    ) {
      await handleWordAnswer(interaction);
    }
  } catch (error) {
    console.error(error);

    const payload = {
      content: '요청 처리 중 오류가 발생했습니다.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload);
      return;
    }

    await interaction.reply(payload);
  }
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

async function shutdown() {
  client.destroy();
  await pool.end();
  process.exit(0);
}

client.login(discordToken);
