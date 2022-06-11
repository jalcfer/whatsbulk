var express = require("express");
var app = express();
const PORT = process.env.PORT || 3000;

const xlsxFile = require("read-excel-file/node");
const puppeteer = require("puppeteer");
const config = require("./config");
const fs = require("fs");
//multer object creation
var multer = require("multer");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

app.set("view engine", "pug");

var upload = multer({ storage: storage });
app.get("/", function (req, res, next) {
  let valid = req.query.valid ? true : false;
  if (valid)
    res.render("index", {
      title: "Envío Mensajes",
      message: "Envíe mensajes multiples",
    });
  else
    res.render("index", {
      title: "Envío Mensajes",
      message: "Envíe nuevamente mensajes multiples",
    });
});

app.post("/", upload.single("imageupload"), function (req, res) {
  //res.redirect('/?valid=1');
  res.send(imageupload);
  //res.send("Archivo subido");
});

app.listen(PORT, function () {
  console.log(`Whatsapp app listen on port ${PORT}!`);
});

const start = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./user_data",
  });
  const page = await browser.newPage();
  const userAgent =
    "Mozilla/5.0 (X11; Linux x86_64)" +
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36";
  await page.setUserAgent(userAgent);

  await page.goto("http://web.whatsapp.com");
  await page.waitForSelector(".zaKsw", { timeout: 180000 });

  console.log("logged in");

  let contactos = [];
  var xlsx = await xlsxFile("./Data.xlsx").then((rows) => {
    contactos = rows;
  });

  let precontent = getContent(config.content);
  //let content = encodeURIComponent(precontent.replace(/\+/g, "%2B"));
  let content = encodeURIComponent(precontent);
  //let content = encodeURI(precontent.replace(/\+/g, "%2B"));
  
  for (const contact of contactos) {
    try {
      var phone = contact[1] + "";
      console.log(phone);
      var name = contact[0] + "";
      console.log(name);
      await page.goto(`https://web.whatsapp.com/send?phone=${phone.trim()}&text=Hola ${name.trim()}, ${content}`)
      page.on('dialog', async dialog => {
        await dialog.accept()
      })
      await page.waitForSelector("._2lMWa", { timeout: 60000 });
      //await page.focus('._13NKt.copyable-text.selectable-text')
      //await page.keyboard.press(String.fromCharCode(13))
      await page.waitFor(4000);
      //await page.waitForSelector('button[class~="svlsagor"]tvf2evcx oq44ahr5 lb5m6g5c svlsagor p2rjqpw5 epia9gcq', { timeout: 60000 })
      await page.waitForSelector('button[class~="epia9gcq"]', {
        timeout: 60000,
      });
      await page.waitFor(4000);
      await page.click('button[class~="epia9gcq"]');
      await page.waitFor(4000);
      //await page.waitForSelector('[aria-label=" Entregado "]', {timeout: 30000})
      log("mensaje enviado correctamente a " + contact);
      console.log("mensaje enviado correctamente a " + contact);
    } catch (error) {
      log("numero de teléfono incorrecto " + contact);
      console.log("numero de teléfono incorrecto " + contact);
      console.log("Error::" + error);
      continue;
    }
  }

  console.log("done");
  await page.waitFor(1000);
  browser.close();
};

start();

const getContact = (path) => {
  const contact = fs.readFileSync(path, { encoding: "utf-8" });
  return contact;
};

const getContent = (path) => {
  const content = fs.readFileSync(path, { encoding: "utf-8" });
  return content;
};

const log = (msg) => {
  const content = fs.writeFileSync("log.txt", `${msg}\r\n`, {
    encoding: "utf-8",
    flag: "a+",
  });
  return content;
};
