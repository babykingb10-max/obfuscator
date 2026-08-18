export function minifyJson(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err: any) {
    throw new Error(`Invalid JSON: ${err?.message ?? "could not be parsed"}`);
  }
  return JSON.stringify(parsed);
}
