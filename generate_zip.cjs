const fs = require('fs');
const archiver = require('archiver');
const { execSync } = require('child_process');

console.log("Building extension...");
execSync('npm run build', { stdio: 'inherit' });

console.log("Creating zip archive using archiver...");
const output = fs.createWriteStream('voidfetch-extension.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archiver has been finalized and the output file descriptor has closed.');
});

output.on('end', function() {
  console.log('Data has been drained');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);
archive.directory('extension_ready/', false);
archive.finalize();
