import { beforeEach, describe, expect, it } from "vitest";
import { clearHistory, logVisit, readHistory } from "./history";

describe("history", () => {
  beforeEach(() => clearHistory());

  it("puts the newest visit first and folds repeats within 30 minutes", () => {
    logVisit("json-formatter", "open", 1_000);
    logVisit("app-chess", "open", 2_000);
    logVisit("json-formatter", "open", 3_000);
    expect(readHistory().map((v) => v.id)).toEqual(["json-formatter", "app-chess"]);
    logVisit("json-formatter", "open", 3_000 + 31 * 60_000);
    expect(readHistory()).toHaveLength(3);
  });

  it("keeps downloads apart from opens and drops junk", () => {
    logVisit("craft-photo-editor", "open", 1);
    logVisit("craft-photo-editor", "download", 2);
    expect(readHistory().map((v) => v.act)).toEqual(["download", "open"]);
    localStorage.setItem(
      "empire-toolboxes:history",
      '[{"id":1},"x",{"id":"a","act":"open","at":5}]',
    );
    expect(readHistory()).toEqual([{ id: "a", act: "open", at: 5 }]);
  });
});
