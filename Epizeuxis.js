
Array.prototype.toString = function () { return `[${this.join(" ")}]`; };
const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);

const Tkn = {
  LParen: 0, RParen: 1,
  Sym: 2, Str: 3,
  Param: 4, Num: 5, Hash: 6,
  T: 'true', F: 'false', N: 'null'
};

function tokenise (source) {
  const tokens = [];
  for (let i = 0; i < source.length; ++i) {
    const c = source[i];
    if (/\s/.test(c)) continue;
    if (/\d/.test(c)) {
      const [num] = source.slice(i).match(/\d+/);
      tokens.push({type: Tkn.Num, num: parseInt(num)});
      i += num.length - 1;
      continue;
    }
    if ((v = source.slice(i).match(/^(true|false|null)/))) {
      tokens.push({type: v[0]});
      i += v[0].length - 1;
      continue;
    }
    switch (c) {
      case '(': tokens.push({type: Tkn.LParen}); break;
      case '[':
        tokens.push({type: Tkn.LParen});
        tokens.push({type: Tkn.Sym, str: "vec"});
        break;
      case ')': case ']':
        tokens.push({type: Tkn.RParen});
        break;
      case '"':
        let str = source.substr(i+1, source.slice(i+1).search(/(?<!\\)"/))
        tokens.push({type: Tkn.Str, str: str.replace(/\\"/g, '"')});
        i += str.length+1;
        break;
      case '\\':
        let sample = source.substr(i+1, 2);
        let longCh = {'nl': '\n', 'sp': ' '}[sample];
        tokens.push({type: Tkn.Str, str: longCh || sample[0]});
        i += longCh ? 2 : 1;
        break;
      case '%':
        let [pstr] = source.slice(i+1).match(/^[\d]+/) || [];
        tokens.push({type: Tkn.Param, num: parseInt(pstr || 0)});
        i += (pstr || []).length;
        break;
      case '#': tokens.push({type: Tkn.Hash}); break;
      default:
        let [sym] = source.slice(i).match(/[\w-+/*?!=<>$.]+/);
        tokens.push({type: Tkn.Sym, str: sym});
        i += sym.length - 1;
    }
  }
  return tokens;
}

function seperate (tokens) {
  //Extract lambdas
  let newTokens = [], lambdaFuncsTokens = [];
  for (let t = 0; t < tokens.length; ++t) {
    if (tokens[t].type == Tkn.Hash) {
      ++t;
      const newFuncTokens = [];
      skipArg(tokens.slice(t), tkn => {++t; newFuncTokens.push(tkn);});
      --t;
      const hash = {type: Tkn.Sym, str: 'F'+ hashCode(newFuncTokens.join(""))};
      newFuncTokens.splice(1, 0, {type: Tkn.Sym, str: "fn"}, hash, {type: Tkn.LParen});
      newTokens.push(hash);
      lambdaFuncsTokens = [...lambdaFuncsTokens, ...newFuncTokens, {type: Tkn.RParen}];
    } else
      newTokens.push(tokens[t]);
  }
  tokens = [...newTokens, ...lambdaFuncsTokens];
  //Seperate all tokens into functions
  let funcs = [[]];
  let depth = 0;
  for (const t of tokens) {
    if ([Tkn.LParen, Tkn.LSquare].includes(t.type)) ++depth;
    if ([Tkn.RParen, Tkn.RSquare].includes(t.type)) --depth;
    funcs[funcs.length-1].push(t);
    if (!depth)
      funcs.push([]);
  }
  funcs.pop();
  const isFn = f => f.length > 1 ? f[1].str != "fn" : true;
  const entry = funcs.filter(isFn);
  funcs = funcs.filter(f => !isFn(f));
  return [[].concat(...entry), funcs];
}

function parse (source) {
  const [entry, funcsTokens] = seperate(tokenise(source));
  let funcs = {entry: entry};
  for (const ts of funcsTokens)
    funcs[ts[2].str] = ts.slice(3, ts.length - 1);
  return funcs;
}



const nu = () => Tkn.N;
let printer;
let variables = {};
let funcs = {
  "val":     v          => v,
  "do":      (...all)   => all.pop(),
  "!":       v          => !v,
  "def":     (n, val)   => nu(variables[n] = val),
  "str":     (...all)   => all.join(""),
  "println": (...all)   => nu(printer(all.join("") +'\n')), 
  "+":       (...all)   => all.reduce((a, b) => a + b),
  "-":       (...all)   => all.reduce((a, b) => a - b),
  "*":       (...all)   => all.reduce((a, b) => a * b),
  "/":       (...all)   => all.reduce((a, b) => a / b),
  "mod":     (a, b)     => a % b,
  "=":       (...all)   => all.every(v => v == all[0]),
  "!=":      (...all)   => !funcs["="](...all),
  ">":       (...all)   => !isNaN(all.reduce((a, b) => a >  b ? b : NaN)),
  "<":       (...all)   => !isNaN(all.reduce((a, b) => a <  b ? b : NaN)),
  ">=":      (...all)   => !isNaN(all.reduce((a, b) => a >= b ? b : NaN)),
  "<=":      (...all)   => !isNaN(all.reduce((a, b) => a <= b ? b : NaN)),
  "vec?":    v          => Array.isArray(v),
  "vec":     (...all)   => all,
  "len":     arr        => arr.length,
  "nth":     (arr, n)   => arr[n],
  "sect":    (...all) => {
    switch (all.length) {
      case 1: return all[0].slice(1);
      case 2: return all[1].slice(all[0]);
      case 3: return all[2].slice(all[0], all[0]+all[1]);
    }
    return null;
  },
  "map":     (f, ...vs) =>  [...Array(Math.min(...vs.map(v => v.length))).keys()]
                            .map(i => exeOp(f, vs.map(v => v[i]))),
  "reduce":  (f, v, s)  => (s ? [s, ...v] : v).reduce((a, b) => exeOp(f, [a, b])),
  "when":    (...all)   => all.pop(),
  "eval":    (...all)   => eval(funcs["str"](...all)),
  "x->js":   x          => JSON.stringify(x)
};

const isTrue = v => v && v.type != Tkn.N && v.type != Tkn.F;

function vm (source, newPrinter) {
  printer = newPrinter;
  funcs = {...funcs, ...parse(source)};
  return exeFunc("entry");
}

let doRecur;
function exeFunc (fName, params = []) {
  let ret;
  let lets = {};
  do {
    doRecur = false;
    let f = funcs[fName].slice();
    if (!f.length) return Tkn.N;
    if (f.length == 1)
      return exeArg(f, params, []);
    const paramSyms = f.slice(0, f.findIndex(t => t.type == Tkn.LParen)).map(p => p.str);
    f = f.slice(paramSyms.length);
    while (f.length && !doRecur)
      ret = exeForm(f, lets, params, paramSyms);
    if (doRecur) params = ret;
  } while (doRecur);
  return ret;
}

function exeOp (op, args) {
  if (typeof(funcs[op]) == 'function')
    return funcs[op](...args);
  if (Array.isArray(funcs[op]))
    return exeFunc(op, args);
  return null;
}

function skipArg (f, func = null) {
  let depth = 0;
  do {
    const t = f.shift();
    depth += (t.type == Tkn.LParen) - (t.type == Tkn.RParen);
    if (func) func(t);
  } while (f.length && depth);
}

function skipForm (f) {
  while (f[0].type != Tkn.RParen)
    skipArg(f);
}

let doBurst = false;
function exeForm (f, lets, params, paramSyms) {
  if (f[0].type == Tkn.LParen) f.shift();
  const op = exeArg(f, lets);
  const args = [];
  while (f.length) {
    if (f[0].type == Tkn.RParen) {
      f.shift();
      break;
    }
    if (f[0].type == Tkn.Param) {
      args.push(params[f[0].num]);
      f.shift();
    } else
    if ((pIdx = paramSyms.indexOf(f[0].str)) != -1) {
      args.push(params[pIdx]);
      f.shift();
    } else
      args.push(exeArg(f, lets, params, paramSyms));
    if (doRecur) return args.pop();
    if (doBurst) {
      doBurst = false;
      args.push(...args.pop());
    }
    if (op == "when" && args.length == 1 && !isTrue(args[0])) {
      skipForm(f);
      if (f.length && f[0].type == Tkn.RParen) f.shift();
      return null;
    } else
    if (op == "if") {
      if ((args.length == 1) ^ isTrue(args[0]) && f[0].type != Tkn.RParen)
        skipArg(f);
      if (f.length && f[0].type == Tkn.RParen) {
        f.shift();
        return args.length == 2 ? args[1] : null;
      }
    } else
    if (op == "and") {
      if (!isTrue(args[0]))
        skipForm(f);
      if (f[0].type == Tkn.RParen) {
        f.shift();
        return isTrue(args[0]);
      }
      args.pop();
    } else
    if (op == "or") {
      if (isTrue(args[0]))
        skipForm(f);
      if (f[0].type == Tkn.RParen) {
        f.shift();
        return isTrue(args[0]) ? args[0] : false;
      }
      args.pop();
    }
  }
  
  if (op == "recur") {
    doRecur = true;
    return args;
  }
  if (op == "..") {
    doBurst = true;
    return args[0];
  }
  if (op == "let") {
    lets[args[0]] = args[1];
    return null;
  }
  return exeOp(op, args);
}

function exeArg (f, lets, params, paramSyms) {
  const t = f.shift();
  switch (t.type) {
    case Tkn.LParen: return exeForm(f, lets, params, paramSyms);
    case Tkn.Sym: case Tkn.Str:
      return t.str.startsWith("$")
        ? (lets[t.str.slice(1)] || variables[t.str.slice(1)])
        : t.str;
    case Tkn.Num: return t.num;
    case Tkn.T: return true;
    case Tkn.F: return false;
    case Tkn.N: return null;
  }
}