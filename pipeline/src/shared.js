import fs from "fs/promises";

export async function persistData(data, filePath) {
  try {
    await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, {
      flag: "w",
    });
  } catch (err) {
    throw new Error(`In persistData: ${err}`);
  }
}

export function getFlag(args, flagName, defaultValue) {
  let flagValue = defaultValue;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const currentFlagName = args[i].substring(2);
      if (currentFlagName === flagName) {
        flagValue = true;
        break;
      }
    }
  }
  return flagValue;
}

// Reads a flag with a value, like --mode=all
export function getOption(args, optionName, defaultValue) {
  const prefix = `--${optionName}=`;
  const arg = args.find((a) => a.startsWith(prefix));
  return arg ? arg.substring(prefix.length) : defaultValue;
}
