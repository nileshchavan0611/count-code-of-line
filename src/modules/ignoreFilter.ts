import * as fs from "fs/promises";
import * as path from "path";
import ignore from "ignore";

export async function createIgnoreFilter(dir: string) {
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
