
function getCore () {
    return `"The code below serves both as examples and as a small core library. Either delete it or press Enter!"
(fn pos?  n (< 0 n))
(fn neg?  n (< n 0))
(fn odd?  n (= (mod n 2) 1))
(fn even? n (! (odd? n)))
(fn zero? n (= n 0))
(fn inc   n (+ n 1))
(fn dec   n (- n 1))
(fn int x radix
  (parseInt: x (or radix 10)))
(fn avg list
  (/ (+ (.. list))
     (len list)))
(fn range n
  (eval: (str "[...Array(" n ").keys()]")))

(fn fib n
  (if (< n 2) n
    (+ (fib (dec n))
       (fib (- n 2)))))
(fn countdown n
  (when (pos? n)
    (println n)
    (recur (dec n))))
(fn vec->xml v
  (if (vec? v)
    (do
      (let tag (0 v))
      (let attr
        (if (dict? (1 v))
          (map #(str \\sp (0 %) \\= \\" (1 %) \\") (1 v))))
      (str
        \\< $tag (.. $attr) \\>
        (.. (map vec->xml (sect (if $attr 2 1) v)))
        "</" $tag \\>))
    v))

(def pi (eval: Math.PI))
(vec->xml
  [div
    [h2 "Hello"]
    [p "JavaScript's Math.PI is " \\nl [b $pi] "."]
    [p "Find more info about Epizeuxis on "
       [a {href "https://github.com/phunanon/Epizeuxis"}
          "Github"]]])`;
}