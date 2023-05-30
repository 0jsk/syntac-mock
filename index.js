const express = require('express');
const jsonServer = require('json-server');
const bodyParser = require('body-parser');
const userRoutes = require('./userRoutes');
const multer = require('multer');
const {Configuration, OpenAIApi} = require("openai");
const authMiddleware = require("./authMiddleware");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const server = jsonServer.create();
const router = jsonServer.router('./db.json');
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(bodyParser.urlencoded({extended: true}));
server.use(bodyParser.json());

server.use('/api/auth', userRoutes);


// Настройка multer
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100  // ограничение размера файла - 5MB
  },
  fileFilter: fileFilter
});

const config = new Configuration({
  apiKey: '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'
})
const openai = new OpenAIApi(config);

const startPrompt = [
  {
    "role": "system",
    "content": "You are the system of syntactic test checking. Your task is to identify the following errors in the text: syntactic, spelling, punctuation. Make your answer in the following way - for each type of error put a colon and list the text in which the error occurred, nothing more. Group this mistakes by type. Answer in Russian language"
  },
];

const sendSyntacticCheck = async (prompt) => {
  const fullPrompt = [
    ...startPrompt,
    {
      "role": "user",
      "content": prompt
    }
  ]

  const gptResponse = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0.6,
    presence_penalty: 0,
    top_p: 1,
    messages: fullPrompt,
    stream: false,
    max_tokens: 2048
  });

  return gptResponse.data;
};


server.post('/api/check', async (req, res) => {
  const path = './uploads/' + req.body.filename;
  const extension = req.body.filename.split('.').pop().toLowerCase();

  console.log("here", { extension })

  let text = '';

  if (extension === 'pdf') {
    const dataBuffer = fs.readFileSync(path);
    const pdfData = await pdfParse(dataBuffer);
    text = pdfData.text;
  } else if (extension === 'docx') {
    text = await mammoth.extractRawText({ path });
    text = text.value;
  } else {
    res.status(400).send('Invalid file type');
    return;
  }

  text = text.slice(0, 500).trim()
  console.log({ text });

  try {
    const response = await sendSyntacticCheck(text);

    res.json(response.choices[0].message.content);
  } catch (error) {
    res.status(500).send('Something went wrong');
  }
});

server.get('/uploads/:filename', (req, res) => {
  res.sendFile(__dirname + '/uploads/' + req.params.filename);
});

server.post('/uploads/:filename', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).send({
        status: false,
        data: 'No file is selected.',
      });
    } else {
      // send response
      res.send({
        status: true,
        data: {
          name: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }

})

server.use('/api', router);

server.listen(3000, () => {
  console.log('JSON Server is running on port 3000');
});
