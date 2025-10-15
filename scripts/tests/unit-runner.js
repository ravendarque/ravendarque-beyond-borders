// Minimal test runner for two helper functions
const assert = require('assert');
const path = require('path');
const script = require(path.resolve(__dirname, '..', 'fetch-and-extract.cjs'));

// The script file is an executable module; it doesn't export functions currently.
// We'll re-require the file by spawning node to run small snippets instead of importing.

const spawn = require('child_process').spawnSync;

function runNodeEval(code) {
  const res = spawn(process.execPath, ['-e', code], { encoding: 'utf8' });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error('Node eval failed: ' + res.stderr);
  return res.stdout.trim();
}

// Test sanitizeFilename
const s1 = runNodeEval("const path=require('path'); const f=require('./../fetch-and-extract.cjs'); console.log(typeof sanitizeFilename === 'function')");
console.log('sanitizeFilename present:', s1);

// Test color extraction quickly using the function exported by eval
const colors = runNodeEval("const fs=require('fs'); const p=require('path'); const moduleText=fs.readFileSync(p.resolve(__dirname,'..','fetch-and-extract.cjs'),'utf8');\n// extract function source via regex\nconst m=moduleText.match(/function extractColorsFromSvgText\([\s\S]*?\n\}/);\nif(!m) { console.error('missing'); process.exit(2);}\nconst fnSrc=m[0];\nconst wrapper='(function(){'+fnSrc+'; console.log(JSON.stringify(extractColorsFromSvgText(\"#abc rgb(1,2,3) fill:\'red\'\")) );})()';\nconsole.log(eval(wrapper));");
console.log('colors test output:', colors);

console.log('unit-runner finished');
