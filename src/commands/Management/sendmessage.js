import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import botConfig, { getColor } from '../../config/botConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('sendmessage')
    .setDescription('Send a premium management message')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel where message will be sent')
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const user = interaction.user;

    // 🔒 Permission check (only staff)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: botConfig.messages.noPermission,
        ephemeral: true
      });
    }

    // Step 1: Ask for message
    await interaction.reply({
      content: '✍️ Type the message you want to send...',
      ephemeral: true
    });

    const filter = (m) => m.author.id === user.id;

    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
      time: 60000
    });

    // Step 2: When user sends message
    collector.on('collect', async (msg) => {
      try {
        // 🧹 Delete user's message (clean look)
        await msg.delete().catch(() => {});

        // 💎 Create premium embed
        const embed = new EmbedBuilder()
          .setColor(getColor('primary'))
          .setAuthor({
            name: 'Inferno | Management',
            iconURL: interaction.guild.iconURL()
          })
          .setDescription(
            `📢 **Announcement**\n────────────\n${msg.content}\n────────────`
          )
          .setFooter({
            text: `${botConfig.embeds.footer.text} • Sent by ${user.username}`
          })
          .setTimestamp();

        // Send to selected channel
        await channel.send({ embeds: [embed] });

        await interaction.followUp({
          content: '✅ Message sent successfully!',
          ephemeral: true
        });

      } catch (error) {
        console.error(error);

        await interaction.followUp({
          content: botConfig.messages.errorOccurred,
          ephemeral: true
        });
      }
    });

    // Step 3: Timeout
    collector.on('end', (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: '⏰ You didn’t type anything in time.',
          ephemeral: true
        }).catch(() => {});
      }
    });
  }
};