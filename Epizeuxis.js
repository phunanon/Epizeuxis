const isColl = o => [eDict, eSet, Array].find(t => o instanceof t);
function isEquiv (a, b) {
  const t = [a, b].map(o => isColl(o) || Object.prototype.toString.call(o));
  if (t[0] != t[1]) return false;
  if (isColl(a)) {
    if (a.length !== b.length) return false;
  } else return a === b;
  for (var i = 0; i < a.length; ++i)
    if (!isEquiv(a.nth(i), b.nth(i)))
      return false;
  return true;
}

class eDict {
  constructor (entries) {
    this.items = entries.filter(([k], i) => !entries.slice(i+1).find(([_k]) => isEquiv(k, _k)));
  }
  nth (n) { return this.items[n]; }
  get (k) { return (this.items.find(([_k]) => isEquiv(k, _k)) || [0, null])[1]; }
  *[Symbol.iterator]() { for (let e of this.items) yield e; }
  toString () { return `{${this.items.map(e => mapnstr(e).join(' ')).join(', ')}}`; }
}
class eSet {
  constructor (entries) {
    this.items = entries.filter((e, i) => !entries.slice(i+1).find(x => isEquiv(e, x))).sort();
  }
  nth (n) { return this.items[n]; }
  get (v) { return this.items.find(e => isEquiv(e, v)) || null; }
  *[Symbol.iterator]() { for (let e of this.items) yield e; }
  toString () { return `#{${mapnstr(this.items).join(' ')}}`; }
}

const mapnstr = v => [...v].map(x => x == null ? "null" : x);
const jsColl = x => isColl(x) ? [...x] : x;
Object.defineProperty(Array.prototype, "last", {get: function () { return this.length ? this[this.length - 1] : null; }});
Array.prototype.toString = function () { return `[${mapnstr(this).join(' ')}]`; };
[eSet, eDict].forEach(t => Object.defineProperty(t.prototype, "length", {get: function () { return this.items.length; }}));
String.prototype.nth = Array.prototype.nth = function (n) { return this[n]; };
const hashCode = s => [...s].reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);


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
        tokens.push({type: Tkn.LParen}, {type: Tkn.Sym, str: {'[': "vec", '{': "dict"}[c]});
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
      case '#':
        if (source[i+1] == "{") {
          ++i;
          tokens.push({type: Tkn.LParen}, {type: Tkn.Sym, str: "set"});
        } else tokens.push({type: Tkn.Hash});
        break;
      default:
        let [sym] = source.slice(i).match(/[\w-+/*?!=<>$.:&|^~]+/);
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



class Func {
  constructor (f) {
    this.f = f;
  }
}

let printer;
let variables = {};
let funcs = {
  "or":      (...all)   => all.find(x => x) || null,
  "and":     (...all)   => all.every(x => x) || null,
  "val":     v          => v,
  "do":      (...all)   => all.pop(),
  "!":       v          => !v,
  "def":     (k, val)   => variables[`$${k}`] = val,
  "print":   (...all)   => printer(all.join("")) && null,
  "println": (...all)   => funcs.print(...all, "\n"),
  "+":       (...all)   => all.reduce((a, b) => a + b),
  "-":       (...all)   => all.length == 1 ? -all[0] : all.reduce((a, b) => a - b),
  "*":       (...all)   => all.reduce((a, b) => a * b),
  "/":       (...all)   => all.reduce((a, b) => a / b),
  "quo":     (...all)   => all.reduce((a, b) => Math.floor(a / b)),
  "&":       (...all)   => all.reduce((a, b) => a & b),
  "|":       (...all)   => all.reduce((a, b) => a | b),
  "^":       (...all)   => all.reduce((a, b) => a ^ b),
  ">>":      (a, b)     => a >> b,
  "<<":      (a, b)     => a << b,
  "~":       n          => ~n,
  "**":      (a, b)     => a ** b,
  "mod":     (a, b)     => a % b,
  "=":       (...all)   => all.every(v => isEquiv(v, all[0])),
  "!=":      (...all)   => !funcs["="](...all),
  ">":       (...all)   => !isNaN(all.reduce((a, b) => a >  b ? b : NaN)),
  "<":       (...all)   => !isNaN(all.reduce((a, b) => a <  b ? b : NaN)),
  ">=":      (...all)   => !isNaN(all.reduce((a, b) => a >= b ? b : NaN)),
  "<=":      (...all)   => !isNaN(all.reduce((a, b) => a <= b ? b : NaN)),
  "round":   n          => Math.round(n),
  "floor":   n          => Math.floor(n),
  "ceil":    n          => Math.ceil(n),
  "random":  (a, b)     => Math.random() * (b - a || a || 1) + (b ? a : 0),
  "rrandom": (a, b)     => Math.round(funcs.random(a, b)),
  "str?":    s          => typeof(s) == 'string',
  "vec?":    v          => Array.isArray(v),
  "set?":    s          => s instanceof eSet,
  "dict?":   d          => d instanceof eDict,
  "str":     (...all)   => all.join(""),
  "vec":     (...all)   => all,
  "set":     (...all)   => new eSet(all),
  "dict":    (...all)   => {
    let entries = [];
    for (let i = 0; i < all.length; i += 2)
      entries.push([all[i], all[i+1]]);
    return new eDict(entries);
  },
  "len":     arr        => arr.length,
  "nth":     (arr, n)   => arr.nth(n),
  "into":    (des, src) => des instanceof eDict ? new eDict([...des, ...src])
                            : des instanceof eSet ? new eSet([...des, ...src]) :
                            [...des, ...src],
  "sect":    (a, b, c) => {
    switch (!!a + !!b + !!c) {
      case 1: return a.slice(1);
      case 2: return b.slice(a);
      case 3: return c.slice(a, a + b);
    }
    return null;
  },
  "map":     (ctx, f, ...vs) =>  [...Array(Math.min(...vs.map(v => v ? v.length : 0))).keys()]
                            .map(i => exeOp(f, vs.map(v => v.nth(i)), ctx)),
  "reduce":  (ctx, f, v, s) => (s ? [s, ...v] : v).reduce((a, b) => exeOp(f, [a, b], ctx)),
  "loop":    (ctx, n, s, f) => {
    if (s && !f) { f = s; s = null; }
    for (let i = 0; i < n; ++i)
      s = exeOp(f, [s, i], ctx);
    return s;
  },
  "filter":  (ctx, f, v) => v.filter(x => exeOp(f, [x], ctx)),
  "remove":  (ctx, f, v) => v.filter(x => !exeOp(f, [x], ctx)),
  "juxt":    (...fs)    => new Func((ctx, ...args) => fs.map(f => exeOp(f, args, ctx))),
  "comp":    (...fs)    => new Func((ctx, ...args) => fs.reduce((acc, f) => [exeOp(f, acc, ctx)], args)[0]),
  "when":    (...all)   => all.pop()
};

const isTrue = v => v && v.type != Tkn.N && v.type != Tkn.F;

function autocompleteStrings () {
  return [...Object.getOwnPropertyNames(funcs),
          ...Object.getOwnPropertyNames(variables),
         "if", "recur", "..", "let"];
}
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
                   ...params.map((p, i) => [i, p]),            //and numbered parameters
                   ["args", params]]);                         //and the args collection
    while (f.length && !doRecur) {
      if (f[0].type == Tkn.LParen) f.shift();
      ret = exeForm(f, ctx);
    }
    if (doRecur) params = ret;
  } while (doRecur);
  return ret;
}

function exeOp (op, args, ctx) {
  if (!isNaN(op)) {
		op = parseInt(op);
    return op >= 0 ? args[0].nth(op) : args[0].nth(args[0].length + op);
	}
  if (Array.isArray(op))
    return op.find(e => isEquiv(e, args[0])) || null;
  if (op instanceof eDict || op instanceof eSet)
    return op.get(args[0]);
  if (op instanceof Func)
    return op.f(ctx, ...args);
  if (op.startsWith(':'))
    return args[0].get(op);
  if (typeof(funcs[op]) == 'function')
    return ["map", "reduce", "loop", "filter", "remove"].includes(op)
      ? funcs[op](ctx, ...args)
      : funcs[op](...args);
  if (Array.isArray(funcs[op]))
    return exeFunc(op, args, ctx);
  if (op.endsWith(':'))
    return eval(op.slice(0, -1)).call(null, ...args.map(jsColl));
  if (op.startsWith('.'))
    return args[0][op.slice(1)].call(...args.map(jsColl));
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
