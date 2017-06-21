#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {execSync} = require("child_process");
const nwjs_ver = process.argv[2];
const nwgyp_home = path.join(process.env.HOME || process.env.USERPROFILE, ".nw-gyp");

if (!nwjs_ver) {
  console.error("usage: " + path.basename(process.argv[1]) + " <nwjs-version>");
  process.exit(1);
}

let platform = process.platform;
let arch_list;
let node_ver;

switch (platform) {
  case "linux":
    arch_list = ["x64", "ia32"];
    break;
  case "darwin":
    arch_list = ["x64"];
    break;
  case "win32":
    arch_list = ["x64", "ia32"];
    break;
  default:
    console.error("unknown platform: " + process.platform);
    break;
}

function ensureDirSync(dirname) {
  let info = path.parse(path.normalize(path.join(dirname, "DUMMY")));
  let curDir = info.root;
  info.dir.split(path.sep).forEach((dir) => {
    curDir = path.join(curDir, dir);
    if (!fs.existsSync(curDir)) {
      fs.mkdirSync(curDir);
    }
  });
}

arch_list.forEach((arch) => {
  console.info("#================================================================================");
  console.info("# Rebuilding module for NW.js " + nwjs_ver + " (" + arch + ")");
  console.info("#");

  let src = path.join("build", "Release", "serialport.node");
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
  }

  let cmd = "nw-gyp configure --target=" + nwjs_ver + " --arch=" + arch;
  console.log("> " + cmd);
  let log = execSync(cmd).toString();
  console.log(log);

  if (!node_ver) {
    console.info("# Detecting node version");
    let header = path.join(nwgyp_home, nwjs_ver, "src", "node_version.h");
    if (!fs.existsSync(header)) {
      console.error("Node header (" + header + ") not found");
      process.exit(1);
    }

    let data = fs.readFileSync(header, "utf-8");
    node_ver = ["MAJOR", "MINOR", "PATCH"].map((item) => {
      let re = new RegExp("^#\\s*define\\s+NODE_" + item + "_VERSION\\s+(\\d+)\\s*$", "m");
      let value = data.match(re);
      return value[1];
    }).join(".");
    console.info("# Node version: " + node_ver);
  }

  cmd = "nw-gyp build --target=" + nwjs_ver + " --arch=" + arch;
  console.log("> " + cmd);
  log = execSync(cmd).toString();
  console.log(log);

  let dest = path.join("compiled", node_ver, platform, arch, path.basename(src));
  console.info("# Copying binary (" + dest + ")");
  ensureDirSync(path.dirname(dest));
  fs.writeFileSync(dest, fs.readFileSync(src));
});

console.info("# Done.");
