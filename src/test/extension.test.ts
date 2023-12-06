import * as assert from "assert";
import * as vscode from "vscode";
import * as myExtension from "../extension";
import path from "path";
import ignore from "ignore";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Count lines of code test", async () => {
    // Use the temp.js file as the test file
    const uri = path.join(__dirname, "temp");
    const ig = ignore();
    const count = await myExtension.countLines(
      uri,
      ig,
      uri,
      () => {}
    );
	console.log(count);    // Replace expectedCount with the expected number of lines in your temp.js file
    const expectedCount = 5;
    assert.strictEqual(count, expectedCount);
  });
});
