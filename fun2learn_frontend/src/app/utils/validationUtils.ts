/**
 * Checks whether the provided email is a valid email
 * @param email - The string to check for valid email
 * @returns true if email is valid else false
*/
export const isValidEmail = (email:string) : boolean => {
    if (!email) return false;
    const emailRegex =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Checks whether the provided password is a valid password.
 * Valid Password Requirements - At least one Alphabet, one number, one symbol, and 6–25 characters long
 * @param password - The string to check whether a password is valid
 * @returns true if the password is valid else false
 */
export const isValidPassword = (password: string): boolean => {
  if (!password) return false;

  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,25}$/;

  return passwordRegex.test(password);
};