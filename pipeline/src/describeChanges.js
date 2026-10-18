import fs from "fs/promises";

const displayName = (name) => name.replace(/\s?\(\d+\)$/, "").trim();

export const getNewRecords = (before, after) => {
  const existing = new Set(before.map((r) => r.instance_id));
  return after.filter((r) => !existing.has(r.instance_id));
};

export const formatRecordList = (records) =>
  records
    .map(({ basic_information: { artists, title } }) => {
      return `- ${displayName(artists[0].name)} - ${title}`;
    })
    .join("\n");

export const describeChanges = (before, after) => {
  const records = getNewRecords(before, after);

  if (!records.length) {
    return "";
  }

  return `New records:\n\n${formatRecordList(records)}`;
};

if (!process.env.TEST) {
  const [beforePath, afterPath] = process.argv.slice(2);
  const read = async (p) => JSON.parse(await fs.readFile(p, "utf8"));
  console.log(describeChanges(await read(beforePath), await read(afterPath)));
}
