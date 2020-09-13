# Epizeuxis

A toy browser-based programming language for teaching/learning. Pronounced /ɛpɪzuksɪs/ (ep-i-ZOOK-sis).  
Acts as a 'hosted' language, similar to [Clojure](https://en.wikipedia.org/wiki/Clojure), in that interfacing with JavaScript is permitted and encouraged. 

Try it [here](https://phunanon.github.io/Epizeuxis).  
Core functions are provided as example on how the native operations work, syntax, and to make the language more usable.

### Syntax

**Literals**  
- All symbols are internally strings, e.g. `hello`
- `true`, `false`, `null`
- `"Hello, world!"` is a string literal, with double quotes
- `123` or `-123` or `1.23` or `-1.23` are number literals
- `\a` is a character literal, with a backslash
  - `\nl` for newline, `\sp` for space
- `%` is the first function parameter
- `%N` is the `N`th parameter

### Native operations

An operation is opposed to a function which is used defined.

Any integers can be used to get the Nth element of a vector, string, or dictionary.  
E.g. `(2 [a b c d e f]) => c`  
E.g. `(map 1 [[a b c] [1 2 3] [e f g]]) => [b 2 f]`

A keyword such as `:keyword` can be used to get the `:keyword` key from a dictionary.  
E.g. `(:name {:age 23 :name "Patrick" :gender "Male"}) => "Patrick"`

`sect` returns vector or string `v` with…  
`(sect v)` … the first element dropped;  
`(sect d v)` … `d` number of elements dropped;  
`(sect d t v)` … `t` number of elements after `d` number of elements dropped.

`..` 'bursts' vector elements or dictionary entries into its parent's arguments.  
E.g. `(+ (.. [0 1 2 3])) => 6`  
E.g. `(str (.. {a b c d})) => "[a b][c d]"`

`vec` returns a vector with its arguments as the elements.  
`dict` returns a dictionary with its arguments as the entries.  
E.g. `(dict 1 (vec a b c) d e) => {1 [a b c], d e}`

The following operations return true if its first argument is…  
`vec?` a vector;  
`str?` a string;  
`dict?` a dictionary.

`len` returns the length of a vector, string, or number of dictionary entries.  
E.g. `(map len [[0 1 2] "hello" {a b c d}]) => [3 5 2]`

`(nth v n)` returns the `n`th vector element, string character, or dictionary entry.  
E.g. `(map #(nth % 1) [[1 2 3] "hello" {a b c d}]) => [2 e [c d]]`

`(into src dest)` returns dictionary `src` with `dest` merged into it, replacing any existing keys with keys from `d1`.  
E.g. `(into {k v} {a b c d}) => {a b, c d, k v}`  
E.g. `(into {k v} {k 0 a b}) => {k v a b}`

`eval` invokes JavaScript's `eval()` function with a string of JavaScript.  
Use in conjunction with `x->js` to serialise complex Epizeuxis data.  
Concatenates its arguments into one string.  
E.g. `(eval "2 + 2") or (eval 2 + 2) => 4`  
E.g. `(eval (x->js [0 1 2]) .length) => 3`

`x->js` serialises its argument into a JSON string. Does not natively work with dictionaries.  
E.g. `(x->js [0 b 2]) => [0,"b",2]`

The following operations evaluate all their arguments but…  
`val` returns its first argument;  
`do` returns its last argument.

**Other currently undocumented functions:**  
`if and or let recur ! def str println + - * / mod = != > < >= <= map reduce when`  