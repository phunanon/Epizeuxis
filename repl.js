const readline = require('readline');
eval(require('fs').readFileSync('Epizeuxis.js').toString());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> '
});

rl.prompt();

rl.on('line', (line) => {
  console.log(vm(line, t => process.stdout.write(t)));
  rl.prompt();
});