import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

const dryRun = process.env.DRY_RUN === "true";

export const config = {
  dryRun,
  email: {
    user: dryRun ? process.env.EMAIL_USER || "" : requireEnv("EMAIL_USER"),
    pass: dryRun ? process.env.EMAIL_PASS || "" : requireEnv("EMAIL_PASS"),
    target: dryRun ? process.env.TARGET_EMAIL || "" : requireEnv("TARGET_EMAIL")
  },
  hfAPIKey: process.env.HF_API_KEY,
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    parentPageID: process.env.NOTION_PARENT_PAGE_ID
  }
};
