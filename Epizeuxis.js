Array.prototype.toString = function () { return `[${this.join(' ')}]`; };
Map.prototype.toString = function () { return `{${[...this.entries()].map(e => e.join(' ')).join(', ')}}`; };
Object.defineProperty(Map.prototype, "length", {get: function () { return this.size; }});
String.prototype.nth = Array.prototype.nth = function (n) { return this[n]; };
Map.prototype.nth = function (n) { return (key = [...this.keys()][n], [key, this.get(key)]); };
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
    if (/\d+(\.\d+)?/.test(c)) {
      const [num] = source.slice(i).match(/[\d.]+/);
      tokens.push({type: Tkn.Num, num: (num.includes('.') ? parseFloat : parseInt)(num)});
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
      case '{':
        tokens.push({type: Tkn.LParen});
        tokens.push({type: Tkn.Sym, str: {'[': "vec", '{': "dict"}[c]});
        break;
      case ')': case ']': case '}':
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
        let [sym] = source.slice(i).match(/[\w-+/*?!=<>$.:]+/);
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
  "or":      (...all)   => all.find(x => x) || null,
  "and":     (...all)   => all.every(x => x) || null,
  "val":     v          => v,
  "do":      (...all)   => all.pop(),
  "!":       v          => !v,
  "def":     (k, val)   => nu(variables[`$${k}`] = val),
  "print":   (...all)   => nu(printer(all.join(""))),
  "println": (...all)   => funcs.print(...all, "\n"),
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
  "str?":    s          => typeof(s) == 'string',
  "dict?":   d          => d instanceof Map,
  "vec":     (...all)   => all,
  "str":     (...all)   => all.join(""),
  "dict":    (...all)   => {
    let dict = new Map();
    for (let i = 0; i < all.length; i += 2)
      dict.set(all[i], i+1 < all.length ? all[i+1] : null);
    return dict;
  },
  "len":     arr        => arr.length,
  "nth":     (arr, n)   => arr.nth(n),
  "into":    (src, des) => new Map([...des, ...src]),
  "sect":    (...all) => {
    switch (all.length) {
      case 1: return all[0].slice(1);
      case 2: return all[1].slice(all[0]);
      case 3: return all[2].slice(all[0], all[0]+all[1]);
    }
    return null;
  },
  "map":     (ctx, f, ...vs) =>  [...Array(Math.min(...vs.map(v => v ? v.length : 0))).keys()]
                            .map(i => exeOp(f, vs.map(v => v.nth(i)), ctx)),
  "reduce":  (ctx, f, v, s)  => (s ? [s, ...v] : v).reduce((a, b) => exeOp(f, [a, b], ctx)),
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
function exeFunc (fName, params = [], ctx = new Map()) {
  let ret;
  do {
    doRecur = doBurst = false;
    let f = funcs[fName].slice();
    if (!f.length) return Tkn.N;
    if (f.length == 1)
      return exeArg(f, ctx);
    const paramSyms = f.slice(0, f.findIndex(t => t.type == Tkn.LParen)).map(p => p.str);
    f = f.slice(paramSyms.length);
    ctx = new Map([...ctx,                                     //Combine old context...
                   ...paramSyms.map((p, i) => [p, params[i]]), //with named parameters
                   ...params.map((p, i) => [i, p])]);          //and numbered parameters
    while (f.length && !doRecur)
      ret = exeForm(f, ctx);
    if (doRecur) params = ret;
  } while (doRecur);
  return ret;
}

function exeOp (op, args, ctx) {
  if (Number.isInteger(op))
    return args[0].nth(op);
  if (op.startsWith(':'))
    return args[0].get(op);
  if (typeof(funcs[op]) == 'function')
    return ["map", "reduce"].includes(op)
      ? funcs[op](ctx, ...args)
      : funcs[op](...args);
  if (Array.isArray(funcs[op]))
    return exeFunc(op, args, ctx);
  console.log(`Operation \`${op}\` not found.`);
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
function exeForm (f, ctx) {
  if (f.length == 1)
    return exeArg(f, ctx);
  if (f[0].type == Tkn.LParen) f.shift();
  const op = exeArg(f, ctx);
  const args = [];
  while (f.length) {
    //Break on )
    if (f[0].type == Tkn.RParen) {
      f.shift();
      break;
    }
    //Emit an indexed parameter
    if (f[0].type == Tkn.Param) {
      args.push(ctx.get(f[0].num));
      f.shift();
    } else
    //Emit a named parameter
    if (ctx.has(f[0].str)) {
      args.push(ctx.get(f[0].str));
      f.shift();
    } else
    //Evaluate the argument
      args.push(exeArg(f, ctx));
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
    //Short-circuited `and` and `or`
    //  should only be used if there is one arg at a time;
    //  won't happen during a burst or mapping
    //  which will instead use native operations
    if (args.length == 1) {
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
  }
  
  if (op == "recur")
    return (doRecur = args);
  if (op == "..")
    return (doBurst = (args[0] ? args[0] : null));
  if (op == "let") {
    ctx.set(`$${args[0]}`, args[1]);
    return null;
  }
  return exeOp(op, args, ctx);
}

function exeArg (f, ctx) {
  const t = f.shift();
  switch (t.type) {
    case Tkn.LParen: return exeForm(f, ctx);
    case Tkn.Sym: case Tkn.Str:
      return t.str.startsWith("$")
        ? (ctx.get(t.str) || variables[t.str])
        : t.str;
    case Tkn.Num: return t.num;
    case Tkn.T: return true;
    case Tkn.F: return false;
    case Tkn.N: return null;
  }
}
