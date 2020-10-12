import {promises as fsPromises} from "fs";
import * as yaml from "js-yaml";
import {execute} from "../utils/exec";
import {fatal, info} from "../utils/log";

import { transformDefaultApiFile } from "./transform-api-file";

/**
 * Options to pass to the client generator
 */
export interface GeneratorOptions {
  outputDir: string;
  swaggerFile: string;
  envInheritanceOptions: EnvInheritanceOptions;
  overrideRuntime: string;
  typeOfHttpRequest: string;
}

/**
 * Options for environement inheritance
 */
export interface EnvInheritanceOptions {
  envConfigJsonFile: string;
  envVariableName: string;
}

/**
 * This function looks at the API_ENV variable and adds keys to the Swagger configuration.
 *
 * @param apiSpecs - Swagger configuration to be modified
 * @param config - Function configuration
 * @param config.envConfigJsonFile - Path of configuration json containing properties for all of the environments
 * @param config.envVariableName - Name of the variable containing environment name
 */
async function inheritEnvApiProperties(apiSpecs: any, {
  envConfigJsonFile,
  envVariableName,
}: EnvInheritanceOptions): Promise<any> {
  let envConfig = null;
  try {
    info(`Load environments configuration file from file "${envConfigJsonFile}"`);
    const envConfigHandle = await fsPromises.open(envConfigJsonFile, "r");
    envConfig = JSON.parse((await envConfigHandle.readFile()).toString());
    await envConfigHandle.close();
  } catch (e) {
    info(`Failed to load environments configuration`);
    info(e);
    return apiSpecs;
  }

  let envName = (process.env) ? process.env[envVariableName] : null;
  if (!envName && envConfig) {
    envName = envConfig.defaultEnvironment;
  }

  info(`Generating client for environment: ${envName || "unknown"}...`);

  if (envName && envConfig && envConfig[envName]) {
    const envProps = envConfig[envName];
    if (typeof apiSpecs === "object") {
      return {
        ...apiSpecs,
        ...envProps,
      };
    }
  }

  return apiSpecs;
}

/**
 * Cleanup specs to provide compatibility with open-api generator
 * This function traverses API specs object (loaded from yaml, json or other format)
 * and returns modified sanitized object.
 *
 * @param apiSpecs - Swagger/OpenAPI specs object
 * @param envInheritanceOptions - environment inheritance configuration
 * @param recursiveLaunch - Is the call recursive?
 */
async function sanitizeAPISpecs(apiSpecs: any, envInheritanceOptions: EnvInheritanceOptions, recursiveLaunch: boolean = false): Promise<any> {
  if (apiSpecs && typeof apiSpecs === "object") {
    if (!recursiveLaunch) {
      apiSpecs = await inheritEnvApiProperties(apiSpecs, envInheritanceOptions);
    }
    for (const key of Object.keys(apiSpecs)) {
      apiSpecs[key] = await sanitizeAPISpecs(apiSpecs[key], envInheritanceOptions, true);
    }
    if (apiSpecs.tags !== undefined) {
      delete apiSpecs.tags;
    }
    return apiSpecs;
  } else if (apiSpecs && apiSpecs.map) {
    return Promise.all(apiSpecs.map((item: any) => sanitizeAPISpecs(item, envInheritanceOptions), true));
  }
  if (apiSpecs && apiSpecs.tags !== undefined) {
    delete apiSpecs.tags;
  }
  return apiSpecs;
}

/**
 * This is basic entrypoint function called each time the client must be generated
 *
 * @param outputDir - output directory
 * @param swaggerFile - input Swagger yaml file
 */
export async function generateClient({ outputDir, swaggerFile, envInheritanceOptions, overrideRuntime, typeOfHttpRequest }: GeneratorOptions) {

  try {
    /**
     * We validate the Swagger file with the swagger-cli command
     */
    info("Validating Swagger specification...");
    //info(await execute(`yarn swagger-cli validate "${swaggerFile}"`));

    /**
     * Create directories if needed
     */
    info("Creating temporary/output directiories...");
    try {
      await fsPromises.mkdir("./_temp");
      await fsPromises.mkdir(outputDir);
    } catch (e) {
    }

    /**
     * In those steps we convert Swagger format to OpenAPI and then generate Typescript RXJS client
     */

    const swaggerFileHandle = await fsPromises.open(swaggerFile, "r");
    const swaggerSpecs = yaml.safeLoad((await swaggerFileHandle.readFile()).toString());
    await swaggerFileHandle.close();

    info("Sanitizing specs file...");
    const sanitizedAPIObject = await sanitizeAPISpecs(swaggerSpecs, envInheritanceOptions);
    await fsPromises.writeFile(swaggerFile, yaml.safeDump(sanitizedAPIObject));
    //console.log(JSON.stringify(sanitizedAPIObject, null, 2));

    if (swaggerSpecs) {
      // We are using Open API format already
      info("Copying OpenAPI specification YAML (skipping Swager conversion)...");
      info(await execute(`cp "${swaggerFile}" ./_temp/api.yaml`));
    } else {
      info("Generating OpenAPI specification from Swagger YAML...");
      info(await execute(`yarn swagger2openapi -y -o ./_temp/api.yaml "${swaggerFile}"`));
    }

    info("Generating Typescript RXJS client for webapp...");
    info(await execute(`openapi-generator generate -i ./_temp/api.yaml -g typescript-rxjs -o "${outputDir}" --skip-validate-spec`));

    /**
     * Remove unwated files that generator leaves
     */
    info("Removing temporary files...");
    info(await execute(`rm -rd "./_temp"`));
    info(await execute(`rm "${outputDir}/tsconfig.json"`));
    info(await execute(`rm "${outputDir}/.gitignore"`));
    info(await execute(`rm "${outputDir}/.openapi-generator-ignore"`));
    info(await execute(`rm -rd "${outputDir}/.openapi-generator"`));

    if (overrideRuntime !== "") {
      info(`Override runtime.ts with ${overrideRuntime}...`);
      info(await execute(`rm "${outputDir}/runtime.ts"`));
      info(await execute(`cp "${outputDir}/../${overrideRuntime}" "${outputDir}/runtime.ts"`));
    }

    /**
     * In this place we use custom transformation function to operate on the api file
     */
    info("Running transformations...");
    await transformDefaultApiFile(`${outputDir}/apis/DefaultApi.ts`, typeOfHttpRequest);

    /**
     * Rename files and plug them into tslint to be a bit beautified
     */
    info("Rename and move files...");
    info(await execute(`rm ${outputDir}/apis/index.ts`));
    await fsPromises.rename(`${outputDir}/apis/DefaultApi.ts`, `${outputDir}/apis/index.ts`);

    info("Lint the resulting code...");
    info(`tslint -c tslint.json '${outputDir}/**/*.ts'`);
    info(await execute(`tslint -c tslint.json '${outputDir}/**/*.ts' --fix`));
  } catch (e) {
    fatal((e) ? (e.message || e) : ("Unknown error occurred."));
  }
}
