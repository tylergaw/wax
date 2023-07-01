import fs from "fs/promises";

export const dataFilePath = "./src/data/collection.json";

export async function persistData(data, filePath) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), {
      flag: "w",
    });
  } catch (err) {
    console.log(err);
  }
}
