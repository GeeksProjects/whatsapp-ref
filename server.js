const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const app = express();
const port = 3000;
console.log(process.env.WHATSAPP_API_KEY);
app.use(bodyParser.json());
app.get("/", (req, res) => res.send("Hello World!"));

app.get("/api", (req, res) => {
  //   console.log(req.body);
  //   console.log(req.params);
  console.log(req.query["hub.verify_token"]);
  //   res.json(true);
  res.status(200).send(req.query["hub.challenge"]);
});

const get_image = async (image_id) => {
  try {
    const image_info = await axios.get(
      `https://graph.facebook.com/v13.0/${image_id}/`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
        },
      }
    );

    const image = await axios.get(image_info.data.url, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
      },
      responseType: "stream",
    });
    // console.log({ ...image, data: null });
    const writer = fs.createWriteStream("./image.jpeg");
    image.data.pipe(writer);

    // Wait for the writer to finish writing
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    // image.data.pipe(writer);

    // return new Promise((resolve, reject) => {
    //   writer.on("finish", resolve);
    //   writer.on("error", reject);
    // });
  } catch (err) {
    console.log(err);
  }
};

app.post("/api", (req, res) => {
  //   console.log(req);
  // get the text of the message
  let changes = req.body.entry[0].changes[0].value;
  let message = changes.messages[0];
  //   const {
  //     profile: { name },
  //   } = changes.contacts[0];
  //   //   console.log(profile);
  //   let { text, from } = message;
  console.log(message);
  if (message.type !== "text") {
    get_image(message[message.type].id);
  }
  //   console.log(req.body.entry[0].changes[0].value);
  //   console.log(text, from, name);

  res.status(200).send("ok");
});

const send_whatsapp_message = async (body) => {
  return axios.post(
    `https://graph.facebook.com/v13.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
    body,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
      },
    }
  );
};

app.post("/text_message", async (req, res) => {
  const { text } = req.body;
  const body = {
    to: "+201033304427",
    messaging_product: "whatsapp",
    text: {
      body: text,
    },
    type: "text",
  };
  return send_whatsapp_message(body)
    .then((response) => {
      console.log(response.data);
      res.status(200).send(response.data);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err);
    });
});

app.post("/attachment_message", async (req, res) => {
  const { message } = req.body;
  const attachment = message.attachments[0];
  const type = ["image", "video", "audio"].includes(attachment.file_type)
    ? attachment.file_type
    : "document";
  type_content = {
    link: attachment.download_url,
  };
  if (!["audio", "sticker"].includes(type)) {
    type_content.caption = attachment.caption;
  }
  if (type == "document") {
    type_content.file_name = attachment.file_name;
  }
  body = {
    messaging_product: "whatsapp",
    to: "+201033304427",
    type: type,
    [type]: type_content,
  };
  return send_whatsapp_message(body)
    .then((response) => {
      console.log(response.data);
      res.status(200).send(response.data);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(err);
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
