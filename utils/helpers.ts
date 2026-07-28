export function getAuthError(error?: string) {
  if (!error) return "Something went wrong.";

  const msg = error.toLowerCase();

  if (msg.includes("user already exists"))
    return "An account with this email already exists.";

  if (msg.includes("invalid password")) return "Incorrect password.";

  if (msg.includes("invalid email")) return "Please enter a valid email.";

  if (msg.includes("user not found"))
    return "No account found with this email.";

  if (msg.includes("email not verified"))
    return "Please verify your email before signing in. For that visit signup page and register again with the same email.";

  if (msg.includes("too many requests"))
    return "Too many attempts. Please try again later.";

  return error;
}
