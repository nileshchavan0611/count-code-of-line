import * as fs from "fs/promises";
import * as path from "path";
import ignore from "ignore";

export async function countFiles(
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
export async function countLines(
  dir: string,
  ig: ReturnType<typeof ignore>,
  baseDir: string,
  onFileProcessed: () => void
): Promise<any> {
  let totalLines = 0;
  const files = await fs.readdir(dir);
  let reportData: any = []; // Array to hold report data

  for (const file of files) {
    let fullPath = path.join(dir, file);
    let relativePath = path.relative(baseDir, fullPath);

    if (ig.ignores(relativePath)) {
      continue;
    }

    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      var lineCountObj = await countLines(
        fullPath,
        ig,
        baseDir,
        onFileProcessed
      );
      reportData = [...lineCountObj.reportData, ...reportData];
      var lineCount = lineCountObj.totalLines;
      reportData.push({ type: "Folder", path: relativePath, lines: lineCount }); // Push data to array
      totalLines += lineCount;
    } else if (stat.isFile()) {
      const data = await fs.readFile(fullPath, "utf8");
      let lineCount = data.split("\n").length;
      reportData.push({ type: "File", path: relativePath, lines: lineCount }); // Push data to array
      totalLines += lineCount;
      onFileProcessed();
    }
  }

  return { reportData, totalLines };
}
