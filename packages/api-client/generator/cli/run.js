#!/usr/bin/env node
/*
 * api-client - Client generator for Meet IT WebApp to generate Typescript client from Swagger API YAML
 *
 * MIT 2019
 */
"use strict";

const path = require("path");

const project = path.join(__dirname, "../../tsconfig.json");
require("ts-node").register({ project, files: true });
require(`./index`).default
    .run()
    .catch(require("@oclif/errors/handle"));
