import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import ignore from "ignore";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "count-code-of-line.countLines",
    async () => {
      if (vscode.workspace.workspaceFolders) {
        let startMessageDisposable: vscode.Disposable | undefined;

        startMessageDisposable = vscode.window.setStatusBarMessage(
          "Counting lines of code started..."
        );
        const dir = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const ig = await createIgnoreFilter(dir);
        await fs.writeFile(path.join(dir, "report.txt"), "");

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
            let totalLines = await countLines(dir, ig, dir, () => {
              processedFiles++;
              progress.report({
                message: `Processed ${processedFiles} out of ${totalFiles} files.`,
              });
            });
            await fs.appendFile(
              path.join(dir, "report.txt"),
              `Total number of lines: ${totalLines}\n`
            );
            vscode.window
              .showInformationMessage(
                "Line counting completed! Click to open report.",
                "Open Report"
              )
              .then((selection) => {
                if (selection === "Open Report") {
                  vscode.workspace
                    .openTextDocument(path.join(dir, "report.txt"))
                    .then((doc) => {
                      vscode.window.showTextDocument(doc);
                    });
                }
              });
          }
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// ... rest of your code ...
async function createIgnoreFilter(dir: string) {
  const ig = ignore();
  ig.add(["**/migrations/**", ".git/**", ".vscode/**", "report.txt"]);
  const gitignorePath = path.join(dir, ".gitignore");

  try {
    await fs.access(gitignorePath);
    const gitignore = await fs.readFile(gitignorePath, "utf-8");
    let list = gitignore.split("\r\n").join("\n").split("\n");
    list = list.filter((value) => value.length > 0 && !value.startsWith("#"));
    ig.add(list);
  } catch (err) {
    // .gitignore file does not exist
  }

  return ig;
}

async function countFiles(
  dir: string,
  ig: ReturnType<typeof ignore>,
  baseDir: string,
  onFileProcessed: () => void
): Promise<number> {
  let totalFiles = 0;
  const files = await fs.readdir(dir);

  for (const file of files) {
    let fullPath = path.join(dir, file);
    let relativePath = path.relative(baseDir, fullPath);

    if (ig.ignores(relativePath)) {
      continue;
    }

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      totalFiles += await countFiles(fullPath, ig, baseDir, onFileProcessed);
    } else if (stat.isFile()) {
      totalFiles++;
    }

    onFileProcessed();
  }

  return totalFiles;
}

async function countLines(
  dir: string,
  ig: ReturnType<typeof ignore>,
  baseDir: string,
  onFileProcessed: () => void
): Promise<number> {
  let totalLines = 0;
  const files = await fs.readdir(dir);

  for (const file of files) {
    let fullPath = path.join(dir, file);
    let relativePath = path.relative(baseDir, fullPath);

    if (ig.ignores(relativePath)) {
      continue;
    }

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      var lineCount = await countLines(fullPath, ig, baseDir, onFileProcessed);
      await fs.appendFile(
        path.join(baseDir, "report.txt"),
        `Folder ${relativePath} has ${lineCount} lines\n`
      );
      totalLines += lineCount;
    } else if (stat.isFile()) {
      const data = await fs.readFile(fullPath, "utf8");
      let lineCount = data.split("\n").length;
      await fs.appendFile(
        path.join(baseDir, "report.txt"),
        `File ${relativePath} has ${lineCount} lines\n`
      );
      totalLines += lineCount;
      onFileProcessed();
    }
  }

  return totalLines;
}
