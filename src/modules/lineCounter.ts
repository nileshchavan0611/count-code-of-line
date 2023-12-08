import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { createIgnoreFilter } from "./ignoreFilter";
import { countFiles, countLines } from "./fileCounter";

export async function countLinesCmd(type: string = "text") {
  {
    if (vscode.workspace.workspaceFolders) {
      let startMessageDisposable: vscode.Disposable | undefined;

      startMessageDisposable = vscode.window.setStatusBarMessage(
        "Counting lines of code started..."
      );
      const dir = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const ig = await createIgnoreFilter(dir);

      let totalFiles = 0;
      let processedFiles = 0;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Counting files...",
          cancellable: false,
        },
        async (progress) => {
          startMessageDisposable?.dispose();
          totalFiles = await countFiles(dir, ig, dir, () => {
            processedFiles++;
            progress.report({
              message: `Processed ${processedFiles} files.`,
            });
          });
        }
      );

      processedFiles = 0;

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Counting lines of code...",
          cancellable: false,
        },
        async (progress) => {
          let totalLinesObj = await countLines(dir, ig, dir, () => {
            processedFiles++;
            progress.report({
              message: `Processed ${processedFiles} out of ${totalFiles} files.`,
            });
          });
          let totalLines = totalLinesObj.totalLines;
          var fileName = "report.txt";
          // Convert report data to text and write to file
          switch (type) {
            case "text":
              let reportText = totalLinesObj.reportData
                .map(
                  (item: any) =>
                    `${item.type} ${item.path} has ${item.lines} lines\n`
                )
                .join("");
              await fs.writeFile(path.join(dir, fileName), "");
              await fs.writeFile(path.join(dir, fileName), reportText);
              await fs.appendFile(
                path.join(dir, fileName),
                `Total number of lines: ${totalLines}\n`
              );

              break;

            case "csv":
              fileName = "report.csv";
              let reportCSV = totalLinesObj.reportData
                .map((item: any) => `${item.type},${item.path},${item.lines}\n`)
                .join("");
              await fs.writeFile(path.join(dir, fileName), "");
              await fs.writeFile(path.join(dir, fileName), reportCSV);
              await fs.appendFile(
                path.join(dir, fileName),
                `Total number of lines,,${totalLines}\n`
              );
              break;
            default:
              break;
          }
          vscode.window
            .showInformationMessage(
              `Line counting completed! Click to open report (${type} File).`,
              "Open Report"
            )
            .then((selection) => {
              if (selection === "Open Report") {
                vscode.workspace
                  .openTextDocument(path.join(dir, fileName))
                  .then((doc) => {
                    vscode.window.showTextDocument(doc);
                  });
              }
            });
        }
      );
    }
  }
}
