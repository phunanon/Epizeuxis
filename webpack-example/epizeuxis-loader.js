module.exports = source =>`
  const {vm} = require("../../Epizeuxis.js");
  vm(${JSON.stringify(source)}, t => process.stdout.write(t));
`;