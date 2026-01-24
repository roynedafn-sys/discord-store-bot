const { 
  Client, 
  GatewayIntentBits, 
  Partials, 
  EmbedBuilder 
} = require("discord.js");

const db = require("./database");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(" ");

  if (message.content === "!payments") {
    return message.reply("💳 Payments accepted: PayPal, Crypto, CashApp");
  }

  if (message.content === "!price") {
    const products = db.prepare("SELECT * FROM products").all();
    if (!products.length) return message.reply("No products listed.");

    let text = products.map(p => `**${p.name}** - ${p.price}`).join("\n");
    return message.reply(text);
  }

  if (message.content === "!orderno") {
    const order = db.prepare(
      "INSERT INTO orders (user_id, product, status) VALUES (?, ?, ?)"
    ).run(message.author.id, "Unknown", "Pending");

    return message.reply(`🧾 Your order number is **#${order.lastInsertRowid}**`);
  }

  if (args[0] === "!orderinfo" && args[1]) {
    const order = db.prepare(
      "SELECT * FROM orders WHERE id = ?"
    ).get(args[1]);

    if (!order) return message.reply("Order not found.");

    return message.reply(
      `Order #${order.id}\nProduct: ${order.product}\nStatus: ${order.status}`
    );
  }
});

client.login(process.env.DISCORD_TOKEN);
