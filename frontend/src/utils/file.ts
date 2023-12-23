export function downloadFile(
  str: string,
  name: string = "",
  mime: string = "text/csv",
): void {
  const hiddenElement = document.createElement("a");
  hiddenElement.href = `data:${mime};charset=utf-8,${encodeURI(str)}`;
  hiddenElement.target = "_blank";
  hiddenElement.download = name || "export.csv";
  hiddenElement.click();
}

export function basename(path: string): string {
  return path.split("/").reverse()[0];
}

export interface DynoCsv {
  time: string;
  speed: string;
  alt: string;
  weight?: string;
  speedOn3000rpm?: string;
  cx?: string;
  frontalSurface?: string;
  wheelLoss?: string;
  powerFac?: string;
  airDensity?: string;
}

export function parseDynoCsv(content: string): DynoCsv[] {
  const lines = String(content)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line)
    .map((line) => line.split(","));

  const header = lines.shift() ?? [];
  const timeColumn = header.findIndex((value) => value === "time");
  const speedColumn = header.findIndex((value) => value === "speed");
  const altColumn = header.findIndex((value) => value === "alt");
  const speedOn3000rpmColumn = header.findIndex(
    (value) => value === "speedOn3000rpm",
  );
  const weightColumn = header.findIndex((value) => value === "weight");
  const cxColumn = header.findIndex((value) => value === "cx");
  const frontalSurfaceColumn = header.findIndex(
    (value) => value === "frontalSurface",
  );
  const wheelLossColumn = header.findIndex((value) => value === "wheelLoss");
  const powerFacColumn = header.findIndex((value) => value === "powerFac");
  const airDensityColumn = header.findIndex((value) => value === "airDensity");

  return lines.map((line) => {
    return {
      time: line[timeColumn],
      speed: line[speedColumn],
      alt: line[altColumn] ?? 0,
      speedOn3000rpm: line[speedOn3000rpmColumn] ?? undefined,
      weight: line[weightColumn] ?? undefined,
      cx: line[cxColumn] ?? undefined,
      frontalSurface: line[frontalSurfaceColumn] ?? undefined,
      wheelLoss: line[wheelLossColumn] ?? undefined,
      powerFac: line[powerFacColumn] ?? undefined,
      airDensity: line[airDensityColumn] ?? undefined,
    };
  });
}

export async function readAllFiles(
  files: FileList,
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (const file of files) {
    const fileReader = new FileReader();
    const content: string = await new Promise((resolve, reject) => {
      fileReader.readAsText(file);
      fileReader.onload = () => {
        if (!fileReader.result) {
          return reject();
        }

        resolve(String(fileReader.result));
      };
    });

    result.set(file.name, content);
  }

  return result;
}
