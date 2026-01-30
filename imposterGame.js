const { Collection } = require("discord.js");

const WORD_PAIRS = [
  ["Cat", "Dog"],
  ["Beach", "Desert"],
  ["Apple", "Pear"],
  ["Car", "Bike"],
  ["Sun", "Moon"],
  ["Coffee", "Tea"],
  ["River", "Lake"],
  ["Shirt", "Jacket"],
  ["Pizza", "Burger"],
  ["Winter", "Summer"]
];

let game = {
  active: false,
  players: new Collection(),
  hints: new Collection(),
  votes: new Collection(),
  imposter: null,
  realWord: null,
  fakeWord: null
};

function resetGame() {
  game = {
    active: false,
    players: new Collection(),
    hints: new Collection(),
    votes: new Collection(),
    imposter: null,
    realWord: null,
    fakeWord: null
  };
}

module.exports = {
  handleCommand: async (message) => {
    const args = message.content.trim().split(" ");
    const cmd = args[0];

    if (cmd === "!startgame") {
      if (game.active) return message.reply("Game already running.");
      game.active = true;
      return message.reply("🎮 Game started! Type `!join` to enter.");
    }

    if (cmd === "!join") {
      if (!game.active) return message.reply("No game running. Use `!startgame`.");
      if (game.players.has(message.author.id)) return message.reply("Already joined.");
      game.players.set(message.author.id, message.author);
      return message.reply(`${message.author.username} joined.`);
    }

    if (cmd === "!begin") {
      if (game.players.size < 3) return message.reply("Need at least 3 players.");
      const [real, fake] = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
      game.realWord = real;
      game.fakeWord = fake;
      const ids = Array.from(game.players.keys());
      const imposterId = ids[Math.floor(Math.random() * ids.length)];
      game.imposter = imposterId;

      for (const [id, user] of game.players) {
        const word = id === imposterId ? fake : real;
        user.send(`Your word is: **${word}**${id === imposterId ? "\n🤫 You are the IMPOSTER!" : ""}`).catch(() => {
          message.channel.send(`Couldn't DM ${user.username}.`);
        });
      }

      return message.channel.send("Words sent! Submit hints with `!hint <word>`.");
    }

    if (cmd === "!hint") {
      if (!game.active || !game.players.has(message.author.id)) return;
      if (game.hints.has(message.author.id)) return message.reply("Hint already submitted.");
      const hint = args.slice(1).join(" ");
      if (!hint) return message.reply("Provide a hint word.");
      game.hints.set(message.author.id, hint);
      message.reply("Hint recorded.");

      if (game.hints.size === game.players.size) {
        let hintList = "";
        for (const [id, hint] of game.hints) {
          const user = game.players.get(id);
          hintList += `${user.username}: ${hint}\n`;
        }
        message.channel.send(`🧠 All hints submitted:\n${hintList}\nVote using \`!vote @user\`.`);
      }
    }

    if (cmd === "!vote") {
      if (!game.active || !game.players.has(message.author.id)) return;
      const target = message.mentions.users.first();
      if (!target || !game.players.has(target.id)) return message.reply("Invalid vote.");
      game.votes.set(message.author.id, target.id);
      message.reply("Vote recorded.");

      if (game.votes.size === game.players.size) {
        const tally = {};
        for (const votedId of game.votes.values()) {
          tally[votedId] = (tally[votedId] || 0) + 1;
        }

        const eliminatedId = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
        const eliminatedUser = game.players.get(eliminatedId);
        const imposterUser = game.players.get(game.imposter);
        const result = eliminatedId === game.imposter ? "🎉 Group wins!" : "😈 Imposter wins!";

        message.channel.send(
          `🗳️ Voting complete.\nEliminated: **${eliminatedUser.username}**\nImposter: **${imposterUser.username}**\nReal word: **${game.realWord}**\nImposter word: **${game.fakeWord}**\n${result}`
        );

        resetGame();
      }
    }
  }
};
