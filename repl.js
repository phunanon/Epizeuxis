const readline = require('readline');
const fs = require('fs')
const rf = f => fs.readFileSync(f).toString()
eval(rf('Epizeuxis.js') + rf('core.js'));
vm(getCoreEpizeuxis());

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
  completer
});

function completer (line) {
  const input = line.split(/[\(\) ]/).pop();
  const completions = autocompleteStrings();
  const hits = completions.filter(c => c.startsWith(input));
  return [hits.length ? hits : completions, input];
}

console.log('\033[2J');
rl.prompt();

rl.on('line', (line) => {
  console.log(vm(line, t => process.stdout.write(t)));
  rl.prompt();
});