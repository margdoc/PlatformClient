/*
 * api-client - Client generator for Meet IT WebApp to generate Typescript client from Swagger API YAML
 *
 * MIT 2019
 */
import { flags, Command } from "@oclif/command";
import * as path from "path";
import { fatal, info, setLevel }  from "../utils/log";

import { generateClient } from "../src";

/**
 * This class provides oclif CLI interface for the api client generator
 */
class WebAppClientGeneratorCli extends Command {
  static description =
    "Client generator for WebApp: Generated Typescript client from Swagger YAML file";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({
      description: "Print the version of the generator",
    }),
    envConfigJsonFile: flags.string({
      description: "Path to the json file containing configuration for all of the environments",
      default: path.resolve(path.join(__dirname, "..", "environments.json")),
    }),
    envVariableName: flags.string({
      description: "Name of environmental variable that contains current environment name",
      default: "API_CLIENT_ENV",
    }),
    overrideRuntime: flags.string({
      description: "Override the default runtime file with the customized one.",
      default: "",
    })
  };

  static args = [{ name: "swaggerFile" }, { name: "outputDirectory" }, { name: "typeOfHttpRequest" }];

  async run(): Promise<void> {
    const { args, flags: cliFlags } = this.parse(WebAppClientGeneratorCli);

    setLevel("info");

    if (!args.swaggerFile) {
      fatal("Swagger Yaml file path is required parameter.");
    }

    if (!args.outputDirectory) {
      fatal("Output directory was not specified.");
    }

    if (!args.typeOfHttpRequest) {
      fatal("Unique type of request not specified");
    }

    generateClient({
      outputDir: args.outputDirectory,
      swaggerFile: args.swaggerFile,
      overrideRuntime: cliFlags.overrideRuntime,
      envInheritanceOptions: {
        envConfigJsonFile: cliFlags.envConfigJsonFile,
        envVariableName: cliFlags.envVariableName,
      },
      typeOfHttpRequest: args.typeOfHttpRequest
    });

  }
}

export default WebAppClientGeneratorCli;
