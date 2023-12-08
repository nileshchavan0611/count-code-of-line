import * as vscode from "vscode";
import { registerCommands } from "./modules/commands";

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context);
}