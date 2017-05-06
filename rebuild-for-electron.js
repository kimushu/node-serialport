#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const {execSync} = require("child_process");
const electron_ver = process.argv[2];
const electron_url = "https://atom.io/download/electron";
const nodegyp_home = path.join(
  process.platform == "win32" ? process.env.USERPROFILE : process.env.HOME,
  ".node-gyp"
);

if (!electron_ver) {
  console.error("usage: " + path.basename(process.argv[1]) + " <electron-version>");
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
    arch_list = ["ia32"];
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
  console.info("# Rebuilding module for Electron " + electron_ver + " (" + arch + ")");
  console.info("#");

  let src = path.join("build", "Release", "serialport.node");
  if (fs.existsSync(src)) {
    fs.unlinkSync(src);
  }

  let cmd = "node-gyp rebuild --target=" + electron_ver + " --arch=" + arch + " --dist-url=" + electron_url;
  console.log("> " + cmd);
  let log = execSync(cmd).toString();
  console.log(log);

  if (!node_ver) {
    console.info("# Detecting node version");
    let header = path.join(nodegyp_home, "iojs-" + electron_ver, "src", "node_version.h");
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

  let dest = path.join("compiled", node_ver, platform, arch, path.basename(src));
  console.info("# Copying binary (" + dest + ")");
  ensureDirSync(path.dirname(dest));
  fs.writeFileSync(dest, fs.readFileSync(src));
});

console.info("# Done.");
