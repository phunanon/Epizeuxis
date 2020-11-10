
# Epizeuxis lesson

Programming is a discipline for instructing computational work. It may integrate deeply into a machine that the instructions can control the signals on a circuit board, or like Epizeuxis it may execute entirely in your web browser. Programming is generally expressed as *code* - text read and understood by software to carry out instructions. The most important concept is taking inputs and producing outputs - whether that's text in, text out; financial data in, predictions out; camera video and maps in, car self-driving out.  
Epizeuxis is designed to have a simple syntax and operation. You simply type the code into the text box and press Enter. Let's start with some math operations. `=>` will denote the result of executing the code.
```clj
(+ 2 2)
=> 4
```
So, by entering `(+ 2 2)` and pressing Enter the code was read, executed, and returned a result of `4`. Let's try a few more.
```clj
(+ 2 2 2)   (- 10 3)   (* 8 7)   (/ 10 2 2)
=> 6        => 7       => 56     => 2.5
```
Anything in the form `(…)` is called an *expression*. An expression has two constituents: an *operation*, which above is `+` `-` `*` `/`; 0 or more *arguments*, which above are all the numbers. Spaces separate the operation and arguments, and it doesn't matter how many spaces there are;
```clj
(+ 2 2 2) works the same as (+     2 2   2) and even (   +   2   2  2  )
```
So, an operation accepts arguments and produces a result. Sometimes an operation may take no arguments at all, such as the expression `(random)` returning a random number.