"use strict";

const https = require("https");
const port = process.env.PORT || 3000;
const server = require("http").createServer();
const xsenv = require("@sap/xsenv");
const xssec = require("@sap/xssec");
const xsHDBConn = require("@sap/hdbext");
const express = require("express");
const logging = require("@sap/logging");
const compression = require("compression");
const cds = require("@sap/cds");
const bodyParser = require('body-parser');

https.globalAgent.options.ca = xsenv.loadCertificates();
global.__base = __dirname + "/";

// Initialize Express App
const app = express();

//Body parser
app.use(bodyParser.json());

//Compression
app.use(compression({
    threshold: "1b"
}));
/*
 const hanaOptions = xsenv.getServices({
     hana: {
         plan: "hdi-shared"
     }
 });
 */
let hanaOptions = {
    hana: {
        host: "zeus.hana.prod.eu-central-1.whitney.dbaas.ondemand.com",
        port: "21513",
        encrypt: true,
        sslValidateCertificate: true,
        driver: "com.sap.db.jdbc.Driver",
        url: "jdbc:sap://zeus.hana.prod.eu-central-1.whitney.dbaas.ondemand.com:21513?encrypt=true&validateCertificate=true&currentschema=PT",
        schema: "LEV_SCP",
        hdi_user: "LEV_SCP_4M6D3274UZJZ6PAOMLLV7NSDR_DT",
        hdi_password: "Ge2bxXyrH9swPc4qEpcfZt2gC_qF04IJwsiMzglcYYeVXlMkstKjZCEB7-f.2GLXa8mFW8Sr2Y0vRym0S4pxjzElkkGLMV2d3LXwGJS6VT8mOX6XUXS-MLbClxn_raAA",
        user: "LEV_SCP_4M6D3274UZJZ6PAOMLLV7NSDR_RT",
        password: "Vs2puzLB3tCODJD5MVtOs0jgnorTmQclpnxin57OQt0NnkaZgIrxJJ-XzWKC5E4b3h1V7qV0q4rLESeASxw063MUeztHDU1goZZvKojUf.nwQ63vAbxtOkKvJx-jbRQl"
    }
};

hanaOptions.hana.pooling = true;
app.use(
    xsHDBConn.middleware(hanaOptions.hana)
);

//CDS OData V4 Handler
cds.connect({
    kind: "hana",
    logLevel: "info",
    credentials: hanaOptions.hana
});
cds
    .serve("gen/csn.json", {
        crashOnError: false
    })
    .at("/odata/")
    .in(app)
    .catch(err => {
        // do not crash on error
    });

//Setup Routes
require("./router")(app, server);

//Error handling
app.use(function (err, req, res, next) {
        res.status(500).send({
            "msgId": "",
            "type": "Error",
            "msg": err.message
        });
});

//Start the Server
server.on("request", app);
server.listen(port, () => console.info(`HTTP Server: ${server.address().port}`));
