#!env node
if(require.main === module && process.argv[2])
  branch = process.argv[2];

require('./util').ensureCleanMaster(branch);
