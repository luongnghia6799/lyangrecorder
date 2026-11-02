import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const sourceImage = process.argv[2] || "C:\\Users\\Administrator\\OneDrive\\AI Image\\LyangRecorder.png";
const ffmpegExe = path.join(rootDir, "node_modules", "ffmpeg-static", "ffmpeg.exe");

if (!fs.existsSync(sourceImage)) {
	console.error(`Source image not found: ${sourceImage}`);
	process.exit(1);
}

if (!fs.existsSync(ffmpegExe)) {
	console.error(`ffmpeg.exe not found: ${ffmpegExe}`);
	process.exit(1);
}

console.log(`Generating app icons from: ${sourceImage}`);

function resizePng(width, height, outputPath) {
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	const result = spawnSync(
		ffmpegExe,
		[
			"-y",
			"-i",
			sourceImage,
			"-vf",
			`scale=${width}:${height}:flags=lanczos`,
			"-compression_level",
			"9",
			outputPath,
		],
		{ stdio: "pipe" },
	);
	if (result.status !== 0) {
		console.error(`Failed to resize ${outputPath}:`, result.stderr.toString());
	} else {
		console.log(`Generated: ${path.relative(rootDir, outputPath)} (${width}x${height})`);
	}
}

// 1. Update public/mascot.png
resizePng(512, 512, path.join(rootDir, "public", "mascot.png"));

// 2. Update public/app-icons
const appIconSizes = [16, 32, 64, 128, 256, 512, 1024];
for (const size of appIconSizes) {
	resizePng(size, size, path.join(rootDir, "public", "app-icons", `recordly-${size}.png`));
	resizePng(size, size, path.join(rootDir, "public", "app-icons", `recordlymac-${size}.png`));
}

// 3. Update icons/icons/png
const buildIconSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
for (const size of buildIconSizes) {
	resizePng(size, size, path.join(rootDir, "icons", "icons", "png", `${size}x${size}.png`));
}

// 4. Update icons/icons/win/icon.ico (multi-resolution)
const icoPath = path.join(rootDir, "icons", "icons", "win", "icon.ico");
fs.mkdirSync(path.dirname(icoPath), { recursive: true });
const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const filterComplex = icoSizes.map((s, idx) => `[0:v]scale=${s}:${s}:flags=lanczos[s${s}]`).join(";");
const mapArgs = icoSizes.flatMap((s) => ["-map", `[s${s}]`]);

const icoResult = spawnSync(
	ffmpegExe,
	[
		"-y",
		"-i",
		sourceImage,
		"-filter_complex",
		filterComplex,
		...mapArgs,
		icoPath,
	],
	{ stdio: "pipe" },
);

if (icoResult.status !== 0) {
	console.error("Failed to generate icon.ico:", icoResult.stderr.toString());
} else {
	console.log(`Generated: ${path.relative(rootDir, icoPath)} (multi-size ICO)`);
}

console.log("All icons successfully generated!");

