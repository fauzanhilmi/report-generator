const amqp = require("amqplib");
const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://user:password@rabbitmq";

let connection, channel;

async function getConnection() {
  try {
    if (!connection) { // Create connection if not existing
      connection = await amqp.connect(RABBITMQ_URL);
      console.log("RabbitMQ connection created")
  
      connection.on("close", () => {
        console.error("RabbitMQ connection closed.");
        connection = null;
      });
      
      connection.on("error", (error) => {
        console.error("RabbitMQ connection error: ", error)
        connection = null;
      });
    }
    return connection
  } catch (error) {
    console.error("Failed to connect to RabbitMQ: ", error)
    process.exit(1)
  }
}

async function getChannel() {
  const conn = await getConnection();
  try {
    if (!channel) { // Create channel if not existing
      channel = await conn.createChannel();
      console.log("RabbitMQ channel created")
      
      channel.on("error", (error) => {
        console.error("RabbitMQ channel error:", error);
        channel = null;
      });
  
      channel.on("close", () => {
        console.log("RabbitMQ channel closed");
        channel = null;
      });
    }
    return channel
  } catch (error) {
    console.error("Failed to create RabbitMQ channel: ", error);
    process.exit(1);
  }
}

async function publishToQueue(queueName, message) {
  try {
    const channel = await getChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(message), { persistent: true });
    console.log(`Sent to ${queueName}:`, message);
  } catch (error) {
    console.error(`Error publishing ${message} to ${queueName}: `, error);
  }
}

async function consumeFromQueue(queueName, callback) {
  const channel = await getChannel();
  await channel.assertQueue(queueName, { durable: true });

  channel.consume(queueName, async (msg) => {
    if (msg) {
      console.log(`Received from ${queueName}:`, msg.content.toString());
      try {
        const jsonMessage = JSON.parse(msg.content.toString());
        await callback(jsonMessage);
        channel.ack(msg);
      } catch (error) {
        console.error("Error processing message:", error);
        channel.nack(msg, false, true); // Requeue the message
      }
    }
  });
}

module.exports = { publishToQueue, consumeFromQueue }