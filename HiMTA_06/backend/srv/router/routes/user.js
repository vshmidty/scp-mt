/*eslint no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
/*eslint-env node, es6 */
"use strict";

const express = require("express");

const dbClass = require(global.__base + "utils/dbClass");
const COMMON = require(global.__base + "utils/common");

function _prepareObject(oUser, req) {
    const user = COMMON.getAjaxUser(req);

		oUser.changedBy = user;
    return oUser;
}

module.exports = () => {
    const app = express.Router();

    app.get("/", async (req, res, next) => {
        try {
            COMMON.checkAjaxAuth(req, "himta.view");
            
            const logger = req.loggingContext.getLogger("/Application");
        		logger.info('user get request');
        		let tracer = req.loggingContext.getTracer(__filename);
        		tracer.entering("/user", req, res);

            tracer.exiting("/user", "User Get works");
            res.type("application/json").status(201).send(JSON.stringify({text: "User Get works"}));
        } catch (e) {
            tracer.catching("/user", e);
            next(e);
        }
    });

    app.post("/", async (req, res, next) => {
        try {
            COMMON.checkAjaxAuth(req, "himta.edit");

            const logger = req.loggingContext.getLogger("/Application");
            logger.info('user POST request');
            let tracer = req.loggingContext.getTracer(__filename);
            tracer.entering("/user", req, res);


            const db = new dbClass(req.db);
            const oUser = _prepareObject(req.body, req);

            oUser.usid = await db.getNextval("usid");
            const sSql = "INSERT INTO \"USER\" VALUES(?,?)";
            const aValues = [oUser.usid, oUser.name];
            const oUserSqlPromise = db.executeUpdate(sSql, aValues);

            const sSqlAddress = "INSERT INTO \"ADDRESS\" VALUES(\"adid\".NEXTVAL,?,?,?,?)";
            const aValuesAddress = [oUser.usid, oUser.toAddress.city, oUser.toAddress.strt, oUser.toAddress.hnum];
            const oAddressSqlPromise = db.executeUpdate(sSqlAddress, aValuesAddress);


            Promise.all([oUserSqlPromise, oAddressSqlPromise])
                .then(() => res.type("application/json").status(201).send(JSON.stringify(oUser)))
                .catch((err) => res.type("application/json").status(500).send(JSON.stringify(err)));
        } catch (e) {
            next(e);
        }
    });

    return app;
};
