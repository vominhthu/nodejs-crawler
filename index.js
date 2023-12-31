const axios = require('axios');

const VIET_NAM = 'Vietnam';
const STATUS = {
    CLOSED: 'Closed'
};

const mailConfiguration = {
    subject: 'Visa 462 Tracking',
    emailFrom: 'thu.vominh22@gmail.com',
    emailsTo: ['thu.vominh23@gmail.com', 'hochihai1997@gmail.com']
}

async function fetchHTML(url) {
    const { data } = await axios.get(url);
    return data;
}

const cheerio = require('cheerio');

function extractData(html, country = VIET_NAM) {
    const $ = cheerio.load(html);
    const rtestate = $('.ms-rtestate-field table tr');
    const countryObj = {};

    for (let i = 1; i < rtestate.length; i++) {
        const td1 = rtestate[i].children[0].children[0].data;
        const td2 = rtestate[i].children[1].children[0].next.children[0].data;
        const td3 = rtestate[i].children[2].children[0].data;
        if (td1 === country) {
            countryObj[country] = {
                status: td2,
                slots: td3
            }
        }
    }
    return countryObj
}

async function crawl(url, country) {
    try {
        const html = await fetchHTML(url);
        const data = extractData(html, country);
        const isSendEmail = true;
        if (isSendEmail) {
            mailConfiguration.emailsTo.forEach(async function (emailTo) {
                await sendMail(emailTo, mailConfiguration.subject, `${country}: ${data[country].status}, slots: ${data[country].slots}`)
            });
        }
        return `Country: ${country}, Status: <span style="color:red">${data[country].status}</span>, Slots: ${data[country].slots}`;
    } catch (error) {
        return 'Failed: ' + error.message
    }
}
async function sendMail(emailTo, subject, text) {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: mailConfiguration.emailFrom,
            pass: 'exwq cgkg vqyw rtrb'
        }
    });
    var mailOptions = {
        from: mailConfiguration.emailFrom,
        to: emailTo,
        subject: subject,
        text: text
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

function isTimeToSend() {
    const hour  = new Date(new Date().toLocaleString('en-US')).getUTCHours();
    const isHour = hour === 4 || hour === 12;
    const minutes  = new Date(new Date().toLocaleString('en-US')).getUTCMinutes() === 30;
    return isHour && minutes;
}

//file name : index.js

const express = require('express')
const app = express()
const port = 3000

app.get('/healthz', (req, res) => {
  res.send('Hello World!')
});

app.get('/run', async (req, res) => {
    const message = await crawl('https://immi.homeaffairs.gov.au/what-we-do/whm-program/status-of-country-caps', VIET_NAM);
    res.send(`<b>Running time: ${new Date().toUTCString()}</b>: ${message}`)
  });


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})