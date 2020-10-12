import {ExecException} from "child_process";

const childProcess = require("child_process");

/**
 * Utility to execute commands
 *
 * @param command - command to be executed
 */
export function execute(command: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    childProcess.exec(command, function(error: ExecException | null, stdout: string, stderr: string) {
      if (error) {
        reject(error);
        return;
      }
      if (stderr) {
        reject(stderr);
        return;
      }
      resolve(stdout);
    });
  });
}