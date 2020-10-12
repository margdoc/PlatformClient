/**
 * Capitalizes first letter of the string
 *
 * @param input - input text
 */
export function capitalizeFirstLetter(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}