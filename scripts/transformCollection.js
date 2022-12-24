import collection from "../src/data/collection.json" assert { type: "json" };

const descriptions = collection.map((r) => {
  return r.basic_information.formats[0].descriptions;
});

console.log(descriptions);
