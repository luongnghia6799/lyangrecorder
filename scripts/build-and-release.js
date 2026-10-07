import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function run(cmd) {
  console.log(`\n🚀 [EXEC] ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

async function main() {
  try {
    console.log('=====================================================');
    console.log('📦 LyangRecorder - Auto Build & GitHub Release Pipeline');
    console.log('=====================================================\n');

    // 1. Read app version from tauri.conf.json
    const tauriConfPath = path.resolve('src-tauri', 'tauri.conf.json');
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf-8'));
    const version = tauriConf.version || '1.0.0';
    const tag = `v${version}`;

    console.log(`📌 App Version: ${version} (Tag: ${tag})\n`);

    // 2. Build Frontend
    console.log('⚙️  Step 1/4: Building Vite & TypeScript Frontend...');
    run('npx tsc && npx vite build');

    // 3. Build Tauri NSIS Bundle Installer
    console.log('\n⚙️  Step 2/4: Compiling Rust & Packaging Windows NSIS Installer...');
    run('npx tauri build --bundles nsis');

    // 4. Copy Portable Standalone EXE
    console.log('\n⚙️  Step 3/4: Creating Portable Standalone Executable...');
    const targetDir = path.resolve('src-tauri', 'target', 'release');
    const nsisDir = path.resolve(targetDir, 'bundle', 'nsis');
    const appExe = path.resolve(targetDir, 'tauri-app.exe');
    const portableExe = path.resolve(nsisDir, `LyangRecorder_${version}_portable_x64.exe`);
    const setupExe = path.resolve(nsisDir, `LyangRecorder_${version}_x64-setup.exe`);

    if (fs.existsSync(appExe)) {
      fs.copyFileSync(appExe, portableExe);
      console.log(`✅ Created: ${portableExe}`);
    }

    if (!fs.existsSync(setupExe)) {
      throw new Error(`Cannot find setup binary at ${setupExe}`);
    }

    // 5. Upload to GitHub Release
    console.log(`\n⚙️  Step 4/4: Uploading Release binaries to GitHub (${tag})...`);
    
    // Check if release tag exists
    let releaseExists = false;
    try {
      execSync(`gh release view ${tag}`, { stdio: 'ignore' });
      releaseExists = true;
    } catch {
      releaseExists = false;
    }

    const notesFile = path.resolve('RELEASE_NOTES.md');
    const notesArg = fs.existsSync(notesFile) ? `--notes-file "${notesFile}"` : `--notes "Release ${tag}"`;

    if (!releaseExists) {
      console.log(`🆕 Creating new GitHub Release ${tag}...`);
      run(`gh release create ${tag} "${setupExe}" "${portableExe}" --title "LyangRecorder ${tag} - Smart Auto-Zoom Studio" ${notesArg}`);
    } else {
      console.log(`🔄 Updating existing GitHub Release ${tag}...`);
      run(`gh release upload ${tag} "${setupExe}" "${portableExe}" --clobber`);
    }

    console.log('\n=====================================================');
    console.log(`🎉 RELEASE HOÀN TẤT THÀNH CÔNG!`);
    console.log(`🔗 Link Release: https://github.com/luongnghia6799/lyangrecorder/releases/tag/${tag}`);
    console.log('=====================================================\n');
  } catch (err) {
    console.error('\n❌ Build/Release thất bại:', err.message || err);
    process.exit(1);
  }
}

main();
