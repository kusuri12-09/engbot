const {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder
} = require('discord.js');

const LANGUAGE_CHOICES = {
  KOREAN: 'korean',
  ENGLISH: 'english'
};

const commands = [
  new SlashCommandBuilder()
    .setName('단어')
    .setDescription('영어 단어 퀴즈를 요청합니다.')
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts(
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
      InteractionContextType.Guild
    )
    .addStringOption((option) =>
      option
        .setName('언어')
        .setDescription('정답으로 입력할 언어를 선택하세요.')
        .setRequired(false)
        .addChoices(
          { name: '한국어', value: LANGUAGE_CHOICES.KOREAN },
          { name: '영어', value: LANGUAGE_CHOICES.ENGLISH }
        )
    ),
  new SlashCommandBuilder()
    .setName('퀴즈')
    .setDescription('영어 퀴즈를 요청합니다.')
    .setIntegrationTypes(ApplicationIntegrationType.UserInstall)
    .setContexts(
      InteractionContextType.BotDM,
      InteractionContextType.PrivateChannel,
      InteractionContextType.Guild
    )
];

module.exports = {
  commands,
  LANGUAGE_CHOICES
};
