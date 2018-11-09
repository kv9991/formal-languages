const fs = require("fs");
const path = require("path");
const EventEmitter = require("events");
const util = require("util");

const filepath = path.join(__dirname, "language.txt");
const readFile = util.promisify(fs.readFile);

const parseFailAsync = async (filename, encoding = "utf-8") =>
  await readFile(filename, encoding);

const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min) + min);

class FormalLanguage {
  constructor() {
    this.handleFileContent = this.handleFileContent.bind(this);
    this.parseLanguage = this.parseLanguage.bind(this);

    this.emitter = new EventEmitter();
    this.fileContent = null;
    this.isInitiated = false;

    this.state = {
      V: null,
      N: null,
      P: null
    };
  }

  setState(data) {
    this.state = Object.assign({}, this.state, data);
  }

  create(filepath) {
    console.log("process new formal language..");

    return parseFailAsync(filepath)
      .then(this.handleFileContent)
      .then(this.parseLanguage)
      .catch(this.handleError);
  }

  handleFileContent(file) {
    console.log("file reading success");

    this.fileContent = file;
  }

  parseLanguage() {
    console.log("parsing language into js structures..");

    const splittedContent = this.fileContent.split("\n");

    this.setState({
      V: splittedContent[0].split(","),
      N: splittedContent[1].split(","),
      P: splittedContent
        .map((content, index) => index > 2 && content)
        .filter(c => !!c)
        .reduce(
          (prev, curr, _, array) =>
            Object.assign({}, prev, {
              [curr[0]]: array
                .filter(item => item[0] === curr[0])
                .map(item => item.slice(2, item.length))
            }),
          {}
        )
    });

    console.log("parsing ended..");
    console.log(this.state);
    this.emitter.emit("read_end");
  }

  generate() {
    let string = "";

    let i = 0;
    while (i < 100) {
      const part = this.generateSymbol();
      string = string + part;
      i++;
    }

    this.emitter.emit("generate", string);
  }

  generateSymbol(symbol) {
    const { P, V, N } = this.state;

    if (!symbol) {
      return this.generateSymbol(P.S[0]);
    }

    if (V.indexOf(symbol) !== -1) {
      return symbol;
    }

    let part = symbol;

    while (part.split("").some(lit => N.indexOf(lit) !== -1)) {
      part.split("").forEach(lit => {
        if (part.indexOf("+") === -1) {
          part = part.replace(
            lit,
            this.generateSymbol(P[lit][getRandomNumber(0, P[lit].length)])
          );
        } else {
          part = part.replace("A", "");
        }
      });
    }

    return part;
  }

  on(event, callback) {
    this.emitter.on(event, callback);
  }

  handleError(error) {
    console.log("can't read file", error);
    return process.exit();
  }
}

const myFormalLanguage = new FormalLanguage();

myFormalLanguage.create(filepath);

myFormalLanguage.on("read_end", () => {
  myFormalLanguage.generate();
});

myFormalLanguage.on("generate", generated => {
  console.log(generated);
});

setInterval(() => {
  console.log("timer that keeps nodejs processing running");
}, 1000 * 60 * 60);
