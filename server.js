const polka = require('polka');
const send = require('@polka/send-type');
var exec = require('child_process').exec;
const fs = require('fs');
const https = require("https");
const URL = "https://ipinfo.io";
const publicIp = require('public-ip');
const { json } = require('body-parser');
var speedTest= require('./main');
var mainSpeed=require('./app');
 //setInterval(()=>{
    //getNetworkDownloadSpeed();
 //},5000)

//  (async () => {
//     try {
//       console.log(await speedTest({maxTime: 20000}));
//     } catch (err) {
//       console.log(err.message);
//     } finally {
//       process.exit(0);
//     }
//   })();

// function ter(){
//     exec('node cli.js -j -v', (err, stdout, stderr) => {
     
//             // the *entire* stdout and stderr (buffered)
//             console.log(`stdout: ${stdout}`);
//             console.log(`stderr: ${stderr}`);
//     })
// }

//ter()

//var test = speedTest({maxTime: 5000});

// test.on('data', data => {
//   console.log(data);
// });

// (async () => {
//     try {
//       console.log(await mainSpeed());
//     } catch (err) {
//       console.log(err.message);
//     } finally {
//       process.exit(0);
//     }
//   })();

const app = polka();
const port = process.env.PORT || 5000;

app.use(json())

app.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// app.get('/my/ip', (req,res)=>{
//     const endpoint = `${URL}/${ip}/json${token ? `?token=${token}` : ""}`;
//     https.get(endpoint, response => {
//       let data = "";
//       response.on("error", err => reject(err));
//       response.on("data", chunk => (data += chunk));
//       response.on("end", () => resolve(JSON.parse(data)));
//     });
// })

// function ipInfo(ip, token = null) {
//     return new Promise((resolve, reject) => {
//       const endpoint = `${URL}/${ip}/json${token ? `?token=${token}` : ""}`;
//       https.get(endpoint, response => {
//         let data = "";
//         response.on("error", err => reject(err));
//         response.on("data", chunk => (data += chunk));
//         response.on("end", () => resolve(JSON.parse(data)));
//       });
//     });
//   }
// ipInfo()
// create a GET route to test speed


app.get('/net/test', (req, res) => {
  // console.log(getip()) 
    exec('node cli.js -j -v', (err, stdout, stderr) => {
        if (err) {
            //some err occurred
            console.error(err);
            send(res, 500, { "error": "There was an error while running the speed test." });
        }
        else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            let result = JSON.parse(stdout);
            let response = {
                   "download":result.download + " Mbps",
                    "upload": result.upload + " Mbps",
                    "ping":result.ping,
                    "ipinfo":result
                };
                send(res, 200, response);
            
        }
    });
   

});


// create a POST route to run iperf3
app.post('/iperf/test', (req, res) => {
    console.log(req.body);
    let host = req.body.host;
    let port = req.body.port;

    exec('iperf3 -J -c ' + host + ' -p ' + port, (err, stdout, stderr) => {
        if (err) {
            console.error(err);
            send(res, 500, { "error": err });
        }
        else {
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            let result = JSON.parse(stdout);
            if (result.error) {
                send(res, 500, { "error": err });
            }
            else {
                console.log(stdout);
                let result = JSON.parse(stdout).end;
                let sender = {
                    "interval": result.sum_sent.start.toFixed(2) + "-" + result.sum_sent.end.toFixed(2) + " sec",
                    "transfer": (result.sum_sent.bytes / 1e6).toFixed(2),
                    "bandwidth": (result.sum_sent.bits_per_second / 1e6).toFixed(2),
                    "retransmits": result.sum_sent.retransmits ? result.sum_sent.retransmits : ""
                }
                let receiver = {
                    "interval": result.sum_received.start.toFixed(2) + "-" + result.sum_sent.end.toFixed(2) + " sec",
                    "transfer": (result.sum_received.bytes / 1e6).toFixed(2),
                    "bandwidth": (result.sum_received.bits_per_second / 1e6).toFixed(2),
                    "retransmits": result.sum_received.retransmits ? result.sum_received.retransmits : ""
                }
                send(res, 200, {
                    "sender": sender,
                    "receiver": receiver
                });
            }
        }
    });
});

//if built client exists, serve static content
if (fs.existsSync("client/build/index.html")) {
    console.log("production");
    const sirv = require('sirv')('client/build');
    app.use(sirv);
}

// console.log that your server is up and running
app.listen(port, () => console.log(`Listening on port ${port}`));

function getMegabitsPerSecond(aBytes, aElapsed) {
    let megaBits = aBytes / 125000;
    let seconds = aElapsed / 1000;
    return megaBits / seconds;
}
