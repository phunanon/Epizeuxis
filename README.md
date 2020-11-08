# Epizeuxis - try it [here](https://phunanon.github.io/Epizeuxis)

A toy browser-based programming language for teaching/learning. Pronounced /ɛpɪzuksɪs/ (ep-i-ZOOK-sis).  
Acts as a 'hosted' language, similar to [Clojure](https://en.wikipedia.org/wiki/Clojure), in that interfacing with JavaScript is permitted and encouraged.  
Core functions are provided as example on how the native operations work, syntax, and to make the language more usable.

### Syntax

**Literals, data types**  
- All symbols are internally strings, e.g. `hello`
- `true`, `false`, `null`
- `"Hello, world!"` is a string literal, with double quotes
- `123` or `-123` or `1.23` or `-1.23` are number literals
- `\a` is a character literal, with a backslash
  - `\nl` for newline, `\sp` for space
- `%` is the first function argument
- `%N` is the `N`th argument

Note: `undefined` is also a literal, which is falsey and only appears within Epizeuxis internally.

**Collections**  
- `[a 1 :c]` is a vector of elements of any type, equivalent to `(vec a 1 :c)`
- `{a 0 b :c}` is a dictionary of key-value pairs of any type, equivalent to `(dict a 0 b :c)`
- `#{a 1 :c}` is a set of unique values, equivalent to `(set a 1 :c)`
- `args` returns a vector of the arguments of the function 

Note: dictionaries are stringified such as `{a 0, b :c}` to help readability.  
Note: dictionary keys and values can be any type at all, including vectors, e.g. `{[0 1] 2}`.  
Note: sets will only preserve distinct elements, i.e. `#{1 1 2}` or `(into #{1 2} #{1})` is equal to `#{1 2}`.  
Note: dictionaries with duplicate keys will only preserve the last distinctly keyed entry.

**Expressions**  
An evaluated expression returns a value. An expression is formed such as `(+ 1 2 3)` whereby the `+` could be a native operation, program function, lambda, variable containing a function or lambda reference, or another expression evaluated as one of the aforementioned; the `1 2 3` in this case are three arguments, of any data type including expressions.  
E.g. `(+ 1 2 3) => 6`  
E.g. `(double 5) => 10`  
E.g. `(#(* % %) 8) => 64`  
E.g. `($something "blah" [random arguments]) => ...`  
E.g. `((if true + -) 12 9) => 21`  
E.g. `(+ (- 10 5) 8) => 12`

**Functions**  
Function declarations are only accepted at the top-level of a document or REPL interaction - they cannot be contained within expressions.  
They are declared as `(fn function-name [0…] [1…])` or `(fn function-name [1…])`  
where `[0…]` is zero or more named parameters (e.g. `a b c`), and `[1…]` is one or more expressions (e.g. `(val "hello")`)  
E.g. `(fn add a b (+ a b))`  
E.g. `(fn say2x string (println string " " string))`  
E.g. `(fn say-hello (println "Hello.") (println "You're handsome"))`

Note: functions can be overloaded with arguments which can be accessed either through a numbered argument i.e. `%5` or through the `args` collection. If a function is underloaded, i.e. called with less arguments than named parameters, the missing named parameters are `undefined`.  
Note `#[…]` is shorthand for `#(vec …)`.

### Native operations

An operation is opposed to a function which is used defined.

An integer N can take one argument which is a vector, string, dictionary, or set, and will return the Nth element of that collection.  
E.g. `(2 [a 1 b 2 c 3]) => b`  
E.g. `(map 1 [[a b c] [1 2 3] [e f g]]) => [b 2 f]`

A vector can take one argument, and it will return the argument if it is within the vector, otherwise `null`.  
E.g. `([a b c] b) => b`  
E.g. `(map [1 2] [5 4 2 3 1]) => [null null 2 null 1]`

A dictionary can take one argument, and will return the value that corresponds to the argument as a key retrieval, otherwise `null`.  
E.g. `({a 1 b 2} b) => 2`  
E.g. `(map {0 1 1 0} [0 0 1 1 2 1 0]) => [1 1 0 0 null 0 1]`

A set can take one argument, and will return the argument if it is within the set, otherwise `null`.  
E.g. `(#{1 2 3} 1) => 1`  
E.g. `(#{a 1 :c} d) => null`

A keyword such as `:keyword` can be used to get the `:keyword` key from a dictionary.  
E.g. `(:name {:age 23 :name "Patrick" :gender "Male"}) => "Patrick"`

There are many arthimetic and comparison operations, demonstrated:  
`(+ 1 2 3) => 3`, addition, varadic;  
`(- 1 2 3) => -4`, subtraction, varadic;  
`(- 123) => -123`, sign change, arity 1;  
`(* 60 60 24) => 86400`, multiplication, varadic;  
`(/ 10 2 2) => 2.5`, division, varadic;  
`(quo 19 2 2) => 4`, quotient, varadic;  
`(& 123 12 9) => 8`, bitwise AND, varadic;  
`(| 128 64 1) => 193`, bitwise OR, varadic;  
`(^ 55 170 55) => 170`, bitwise XOR, varadic;  
`(>> 128 2) => 64`, bitwise right shift, arity 2;  
`(<< 16 3) => 64`, bitwise left shift, arity 2;  
`(~ 170) => -171`, bitwise NOT, arity 1;  
`(** 2 8) => 256`, expotent, arity 2;  
`(mod 1234 10) => 4`, modulus, arity 2;  
`(! 123) => false`, negation, arity 1;  
`(= [0 a [:b]] [0 a [:b]]) => true`, equality, varadic;  
`(!= #{0 1 2} [0 1 2] null) => true`, inequality, varadic;  
`(< 0 1 2 3) => true`, monotonically increasing numbers, varadic;  
`(> 4 3 2 9) => false`, monotonically decreasing numbers, varadic;  
`(<= 0 0 1 2) => true`, monotonically non-decreasing numbers, varadic;  
`(>= 8 8 3 2) => true`, monotonically non-increasing numbers, varadic.

`sect` returns vector or string `v` with…  
`(sect v)` … the first element dropped;  
`(sect d v)` … `d` number of elements dropped;  
`(sect d t v)` … `t` number of elements after `d` number of elements dropped.

The following operations evaluate all their arguments but…  
`val` returns its first argument;  
`do` returns its last argument.

`(map f v…)` calls the `f` function for each item across each collection `v` until one of the collections is exhausted, passing an item from each collection as arguments.  
E.g. `(map + [0 1 2 3] [0 1 2 3 4 5 6]) => [0 2 4 6]`  
E.g. `(map - [0 1 2 3]) => [0 -1 -2 -3]`  
E.g. `(map str "hello" "world") => [hw eo lr ll od]`

`(loop n f)` calls the `f` function `n` times like `(f acc i)` where `acc` is the return value of the previous repetition or null, and `i` is the repetition number starting from 0.  
`(loop n s f)` does the same except `acc` is first set to `s`.  
Returns the last retition's return value.  
E.g. `(loop 4 +) => 6` which is the same as `(+ (+ (+ (+ null 0) 1) 2) 3)`  
E.g. `(loop 3 5 +) => 8` which is the same as `(+ (+ (+ 5 0) 1) 2)`

`..` 'bursts' vector elements or dictionary entries into its parent's arguments.  
E.g. `(+ (.. [0 1 2 3])) => 6`  
E.g. `(str (.. {a b c d})) => "[a b][c d]"`

`vec` returns a vector with its arguments as the elements.  
`dict` returns a dictionary with its arguments as the entries.  
`set` returns a set with its distinct arguments as the elements.  
E.g. `(dict (vec a b c) (set d e e)) => {[a b c] #{d e}}`

The following operations return true if its first argument is…  
`vec?` a vector;  
`str?` a string;  
`dict?` a dictionary.

`len` returns the length of a vector, string, or number of dictionary entries.  
E.g. `(map len [[0 1 2] "hello" {a b c d}]) => [3 5 2]`

`(nth v n)` returns the `n`th vector element, string character, or dictionary entry.  
E.g. `(map #(nth % 1) [[1 2 3] "hello" {a b c d}]) => [2 e [c d]]`

`(into dest src)` returns collection `dest` with `src` merged into it. It intelligently merges between vectors, dictionaries and sets.
E.g. `(into [a b c d] {k v}) => [a b c d [k v]]`  
E.g. `(into {k 0 a b} {k v}) => {k v a b}`  
E.g. `(into #{} [0 1 2 3 3 3]) => #{0 1 2 3}`

`(filter f v)` returns `v` with only items where `(f item)` is truthy.  
E.g. `(filter odd? (range 10)) => [1 3 5 7 9]`  
E.g. `(filter val ["hello" null "hey" false "hi"]) => ["hello" "hey" "hi"]`

`(remove f v)`, complementary to `filter`, returns `v` with only items where `(f item)` is falsey.  
E.g. `(remove odd? (range 10)) => [0 2 4 6 8]`  
E.g. `(remove #(< 3 (len %)) ["hello" "hey"]) => ["hey"]`

`juxt` returns a function that acts like this: `#[(arg0 %) (arg1 %) …]` where `argN` are arguments to `juxt`. Means juxtposition.  
E.g. `((juxt halve double triple) 12) => [6 24 36]`  
E.g. `((juxt filter remove) odd? (range 10)) => [[1 3 5 7 9] [0 2 4 6 8]]`

`comp` returns a function that calls the functions in its arguments in turn. Means compose.  
E.g. `((comp inc double) 10) => 22`  
E.g. `((comp double dec dec) 10) => 18`
E.g. `(comp inc double)` is shorthand for `#(double (inc (.. args)))`

`eval` invokes JavaScript's `eval()` function with a string of JavaScript.  
Use in conjunction with `x->js` to serialise complex Epizeuxis data.  
Concatenates its arguments into one string.  
E.g. `(eval "2 + 2") or (eval 2 + 2) => 4`  
E.g. `(eval (x->js [0 1 2]) .length) => 3`

`x->js` serialises its argument into a JSON string. Does not natively work with dictionaries.  
E.g. `(x->js [0 b 2]) => [0,"b",2]`

`print` and `println` prints its arguments concetanated as a string to the HTML transcript of the Epizeuxis REPL, either without or with a newline after it.

**Other currently undocumented functions:**  
`if and or let def recur str reduce when random rrandom round floor ceil`