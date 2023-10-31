import { assert, expect, test, describe, it } from "vitest";
import "../index";

describe("Test APIs", () => {
  test("responds to /", () => {
    const req = {};

    const res = {
      text: "",
      send: function (input) {
        this.text = input;
      },
    };
    index(req, res);

    expect(res.text).toEqual("hello world!");
  });
});
