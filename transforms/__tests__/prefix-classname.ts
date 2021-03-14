import { defineTest } from "jscodeshift/dist/testUtils";

describe("prefix-classname", () => {
  defineTest(
    __dirname,
    "prefix-classname",
    null,
    `prefix-classname/basic`,
    { parser: "tsx" }
  );
});