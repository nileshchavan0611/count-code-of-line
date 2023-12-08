import * as vscode from "vscode";
import { countLinesCmd } from "./lineCounter";

export function registerCommands(context: vscode.ExtensionContext) {
  let countLinesDisposable = vscode.commands.registerCommand(
    "count-code-of-line.countLines",
    async () => {
      await countLinesCmd("text");
    }
  );

  let countLinesCSVDisposable = vscode.commands.registerCommand(
    "count-code-of-line.countLinesCSV",
    async () => {
      await countLinesCmd("csv");
    }
  );

  context.subscriptions.push(countLinesDisposable);
  context.subscriptions.push(countLinesCSVDisposable);
}
