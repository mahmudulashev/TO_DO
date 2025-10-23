#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");

const electronBinary = require("electron");

const args = process.argv.slice(2);
const entry = args.length > 0 ? args : [path.resolve(process.cwd(), ".")];
const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinary, entry, {
  stdio: "inherit",
  windowsHide: false,
  env
});

child.on("close", code => {
  process.exit(typeof code === "number" ? code : 0);
});

child.on("error", error => {
  console.error("Failed to launch Electron:", error);
  process.exit(1);
});
