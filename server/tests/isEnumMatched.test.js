const isEnumMatched = require("../utils/isEnumMatched");

describe("isEnumMatched", () => {
  describe("When value matches enum", () => {
    it("should return true", () => {
      expect(isEnumMatched(["Hello", "Car"], "Hello")).toBe(true);
    });
  });

  describe("When value does not match enum", () => {
    it("should return false", () => {
      expect(isEnumMatched(["Zoo", "Ocean"], "tree")).toBe(false);
    });
  });

  describe("When value matches enum", () => {
    it("should return true and be case insensitive", () => {
      expect(isEnumMatched(["Hello", "Car"], "car")).toBe(true);
    });
  });
});
