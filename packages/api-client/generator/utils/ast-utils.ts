import { promises as fsPromises } from "fs";
import {
  ClassDeclarationStructure,
  ClassMemberTypes, FunctionDeclaration, FunctionExpression, InterfaceDeclarationStructure,
  Project,
  PropertyDeclaration,
  SourceFile,
} from "ts-morph";

/**
 * Metadata required during AST transformations
 */
export interface ContextOptions {
  baseFileContents: string;
  baseFileName: string;
}

/**
 * Parse source code creating SourceFile object
 *
 * @param options - options for the function
 * @param content - typescript code input
 */
export async function parseAST(options: ContextOptions, content: string): Promise<SourceFile> {
  const project = new Project({ useVirtualFileSystem: true });
  const virtualFile = project.createSourceFile("__dummy__.ts", options.baseFileContents + ";\n" + content, { overwrite: true });
  return virtualFile;
}

/**
 * Parse the input code and extract a class with a given name from the parsed AST.
 *
 * @param options - function options
 * @param className - class name to be extracted
 * @param content - input source code containing the class definition
 */
export async function createClassFromSource(options: ContextOptions, className: string, content: string): Promise<ClassDeclarationStructure> {
  return (await parseAST(options, content)).getClassOrThrow(className).getStructure();
}

/**
 * Parse the input code and extract an interface with a given name from the parsed AST.
 *
 * @param options - function options
 * @param interfaceName - interface name to be extracted
 * @param content - input source code containing the interface definition
 */
export async function createInterfaceFromSource(options: ContextOptions, interfaceName: string, content: string): Promise<InterfaceDeclarationStructure> {
  return (await parseAST(options, content)).getInterfaceOrThrow(interfaceName).getStructure();
}

/**
 * Parse the input code and extract the arrow function as normal function declaration.
 *
 * @param options - function options
 * @param name - the function name will be set to this value
 * @param content - input source code containing only an arrow function
 */
export async function parseArrowFunction(options: ContextOptions, name: string, content: string): Promise<FunctionDeclaration> {
  return (await parseAST(options, `function ${name}${content.replace("=>", "")};`)).getFunctionOrThrow(name);
}

/**
 * Extracts arrow function from a class member object.
 * The member must be defined as follows:
 *   memberX = (a: string) => { console.log(a); }
 *
 * @param options - function options
 * @param member - AST member object
 */
export async function extractArrowFunctionFromClassProperty(options: ContextOptions, member: ClassMemberTypes): Promise<FunctionDeclaration | undefined> {
  const property = member as PropertyDeclaration;

  if (property.getStructure) {
    const structure = property.getStructure();
    if (structure !== undefined && structure.initializer !== undefined) {
      return await parseArrowFunction(options, property.getName(), structure.initializer.toString());
    }
  }
  return undefined;
}

/**
 * This function takes path to the source file and replaces __dumy__.ts file references.
 * This is the case when you perform operations on AST, the parseAST function creates a new file
 * called __dummy__.ts, so all the types, classes, interfaces are referring to that file.
 * To fix that this function replaces all the dummy file references with correct ones.
 *
 * @param path - path to the source file to be fixed
 */
export async function fixFileImports(path: string) {
  const inFileHandle = await fsPromises.open(path, "r");
  const inputContent = await inFileHandle.readFile();
  await inFileHandle.close();

  const outFileHandle = await fsPromises.open(path, "w");
  const fixedContent = inputContent.toString().replace(/import\s*\("\/__dummy__"\)\.?/ig, "");
  await outFileHandle.writeFile(fixedContent);
  await outFileHandle.close();
}